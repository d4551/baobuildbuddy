import type { EmailTransportSettings } from "@bao/shared";
import { generateId, isValidEmail, settle } from "@bao/shared";
import { createServerLogger } from "../utils/logger";

const SMTP_LINE_BREAK = "\r\n";
const SMTP_DATA_ENDING = `${SMTP_LINE_BREAK}.${SMTP_LINE_BREAK}`;
const SMTP_BASE64_LINE_LENGTH = 76;
const SMTP_QUIT_COMMAND = "QUIT";
const SMTP_DEFAULT_EHLO_HOST = "localhost";
const SMTP_RESPONSE_LINE_PATTERN = /^(\d{3})([ -])(.*)$/;
const SMTP_HEADER_NEWLINE_PATTERN = /\r?\n+/g;
const SMTP_ASCII_HEADER_PATTERN = /^[\x20-\x7E]*$/;
const SMTP_WHITESPACE_PATTERN = /\s+/g;

type SmtpAuthMode = EmailTransportSettings["authMethod"];

/**
 * Runtime transport config with the secret SMTP password attached.
 */
export interface EmailTransportRuntimeConfig extends EmailTransportSettings {
  password?: string | null;
}

/**
 * Outbound email delivery request payload.
 */
export interface EmailDeliveryRequest {
  recipientEmail: string;
  subject: string;
  body: string;
}

/**
 * Email delivery success metadata returned to automation flows.
 */
export interface EmailDeliveryResult {
  recipientEmail: string;
  fromEmail: string;
  deliveredAt: string;
  messageId: string;
}

interface SmtpResponse {
  code: number;
  lines: string[];
}

interface PendingResponseReader {
  reject: (reason?: unknown) => void;
  resolve: (response: SmtpResponse) => void;
}

interface PendingDrainReader {
  reject: (reason?: unknown) => void;
  resolve: () => void;
}

interface PendingTlsUpgrade {
  reject: (reason?: unknown) => void;
  resolve: () => void;
}

interface DeliveryEnvelopeMetadata {
  clientHost: string;
  deliveredAt: string;
  messageId: string;
}

class SmtpProtocolError extends Error {
  constructor(
    public readonly code: number,
    public readonly lines: string[],
    context: string,
  ) {
    super(`${context}: ${lines.join(" ")}`.trim());
  }
}

class SmtpConnectionClosedError extends Error {}

class SmtpConnection {
  private readonly decoder = new TextDecoder();
  private readonly encoder = new TextEncoder();
  private readonly queuedResponses: SmtpResponse[] = [];
  private readonly pendingReaders: PendingResponseReader[] = [];
  private readonly logger = createServerLogger("smtp-connection");
  private currentResponse: SmtpResponse | null = null;
  private buffer = "";
  private socket: Bun.Socket<undefined> | null = null;
  private pendingDrain: PendingDrainReader | null = null;
  private pendingTlsUpgrade: PendingTlsUpgrade | null = null;
  private closed = false;

  constructor(private readonly config: EmailTransportRuntimeConfig) {}

  /**
   * Opens the TCP connection and validates the SMTP greeting.
   */
  async connect(): Promise<void> {
    const socketResult = await settle(
      Bun.connect({
        hostname: this.config.host,
        port: this.config.port,
        tls: this.config.security === "tls",
        socket: {
          binaryType: "uint8array",
          close: (_socket, error) => {
            this.handleClose(error);
          },
          connectError: (_socket, error) => {
            this.rejectAllPending(error);
          },
          data: (_socket, data) => {
            this.handleData(data);
          },
          drain: () => {
            this.resolvePendingDrain();
          },
          error: (_socket, error) => {
            this.rejectAllPending(error);
          },
          handshake: (_socket, success, authorizationError) => {
            this.handleHandshake(success, authorizationError);
          },
          timeout: (socket) => {
            const timeoutError = new SmtpConnectionClosedError("SMTP connection timed out");
            this.rejectAllPending(timeoutError);
            socket.close();
          },
        },
      }),
    );

    if (socketResult.status === "rejected") {
      throw socketResult.reason;
    }

    this.socket = socketResult.value;
    this.socket.timeout(this.config.connectionTimeoutSeconds);

    const greeting = await this.readResponse();
    this.assertExpectedCode(greeting, [220], "SMTP greeting");
  }

  /**
   * Sends EHLO and returns the server capability lines.
   */
  async ehlo(clientHost: string): Promise<SmtpResponse> {
    return this.command(`EHLO ${clientHost}`, [250], "EHLO");
  }

  /**
   * Negotiates STARTTLS and waits for the TLS handshake to complete.
   */
  async startTls(): Promise<void> {
    this.assertSocket();
    await this.command("STARTTLS", [220], "STARTTLS");

    const upgraded = await this.waitForTlsUpgrade(() =>
      this.socket?.upgradeTLS({
        tls: true,
        socket: {
          binaryType: "uint8array",
          close: (_socket, error) => {
            this.handleClose(error);
          },
          data: (_socket, data) => {
            this.handleData(data);
          },
          drain: () => {
            this.resolvePendingDrain();
          },
          error: (_socket, error) => {
            this.rejectAllPending(error);
          },
          handshake: (_socket, success, authorizationError) => {
            this.handleHandshake(success, authorizationError);
          },
          timeout: (socket) => {
            const timeoutError = new SmtpConnectionClosedError("SMTP connection timed out");
            this.rejectAllPending(timeoutError);
            socket.close();
          },
        },
      }),
    );

    this.socket = upgraded;
    this.socket.timeout(this.config.connectionTimeoutSeconds);
  }

  /**
   * Authenticates with AUTH PLAIN.
   */
  async authPlain(username: string, password: string): Promise<void> {
    const encoded = encodeBase64Utf8(`\u0000${username}\u0000${password}`);
    await this.command(`AUTH PLAIN ${encoded}`, [235], "AUTH PLAIN");
  }

  /**
   * Authenticates with AUTH LOGIN.
   */
  async authLogin(username: string, password: string): Promise<void> {
    await this.command("AUTH LOGIN", [334], "AUTH LOGIN");
    await this.command(encodeBase64Utf8(username), [334], "AUTH LOGIN username");
    await this.command(encodeBase64Utf8(password), [235], "AUTH LOGIN password");
  }

  /**
   * Delivers a single RFC 5322 message through the SMTP connection.
   */
  async sendMail(fromEmail: string, recipientEmail: string, message: string): Promise<void> {
    await this.command(`MAIL FROM:<${fromEmail}>`, [250], "MAIL FROM");
    await this.command(`RCPT TO:<${recipientEmail}>`, [250, 251], "RCPT TO");
    await this.command("DATA", [354], "DATA");
    await this.writeCommand(`${dotStuffMessage(message)}${SMTP_DATA_ENDING}`);
    const dataResult = await this.readResponse();
    this.assertExpectedCode(dataResult, [250], "message body");
  }

  /**
   * Sends QUIT if the socket is still open.
   */
  async quit(): Promise<void> {
    if (this.closed) {
      return;
    }

    const quitResult = await settle(this.command(SMTP_QUIT_COMMAND, [221], "QUIT"));
    if (quitResult.status === "rejected") {
      this.logger.warn("smtp quit failed", quitResult.reason);
    }
  }

  /**
   * Closes the socket if it is still active.
   */
  close(): void {
    if (!this.socket || this.closed) {
      return;
    }

    this.closed = true;
    this.socket.close();
  }

  /**
   * Reads the next complete SMTP response from the server.
   */
  private async readResponse(): Promise<SmtpResponse> {
    if (this.queuedResponses.length > 0) {
      return this.queuedResponses.shift() as SmtpResponse;
    }

    return new Promise<SmtpResponse>((resolve, reject) => {
      this.pendingReaders.push({ resolve, reject });
    });
  }

  /**
   * Writes a command and validates the expected response code.
   */
  private async command(
    command: string,
    expectedCodes: readonly number[],
    context: string,
  ): Promise<SmtpResponse> {
    await this.writeCommand(`${command}${SMTP_LINE_BREAK}`);
    const response = await this.readResponse();
    this.assertExpectedCode(response, expectedCodes, context);
    return response;
  }

  /**
   * Writes bytes to the active socket while honoring backpressure.
   */
  private async writeCommand(command: string): Promise<void> {
    await this.writeBytes(this.encoder.encode(command), 0);
  }

  /**
   * Writes a buffer recursively until all queued bytes are sent.
   */
  private async writeBytes(bytes: Uint8Array, offset: number): Promise<void> {
    const socket = this.assertSocket();
    const remainingLength = bytes.byteLength - offset;
    if (remainingLength <= 0) {
      return;
    }

    const written = socket.write(bytes, offset, remainingLength);
    if (written < 0) {
      throw new SmtpConnectionClosedError("SMTP socket closed during write");
    }

    if (written >= remainingLength) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      this.pendingDrain = { resolve, reject };
    });
    await this.writeBytes(bytes, offset + written);
  }

  /**
   * Waits for a TLS handshake completion event after STARTTLS.
   */
  private async waitForTlsUpgrade(
    upgrade: () => [Bun.Socket<undefined>, Bun.Socket<undefined>] | undefined,
  ) {
    const tlsPromise = new Promise<void>((resolve, reject) => {
      this.pendingTlsUpgrade = { resolve, reject };
    });
    const upgradedSocket = upgrade();
    if (!upgradedSocket) {
      this.pendingTlsUpgrade = null;
      throw new SmtpConnectionClosedError("SMTP socket is not available");
    }

    const [, tlsSocket] = upgradedSocket;
    const tlsResult = await settle(tlsPromise);

    if (tlsResult.status === "rejected") {
      throw tlsResult.reason;
    }

    return tlsSocket;
  }

  /**
   * Parses SMTP response lines from socket data.
   */
  private handleData(data: Uint8Array): void {
    this.buffer += this.decoder.decode(data, { stream: true });

    for (;;) {
      const lineBreakIndex = this.buffer.indexOf(SMTP_LINE_BREAK);
      if (lineBreakIndex < 0) {
        return;
      }

      const line = this.buffer.slice(0, lineBreakIndex);
      this.buffer = this.buffer.slice(lineBreakIndex + SMTP_LINE_BREAK.length);
      this.handleResponseLine(line);
    }
  }

  /**
   * Accumulates multi-line SMTP responses and releases the next waiting reader.
   */
  private handleResponseLine(line: string): void {
    const parsed = SMTP_RESPONSE_LINE_PATTERN.exec(line);
    if (!parsed) {
      return;
    }

    const code = Number.parseInt(parsed[1] ?? "", 10);
    const separator = parsed[2] ?? " ";
    const message = parsed[3] ?? "";

    if (!this.currentResponse || this.currentResponse.code !== code) {
      this.currentResponse = {
        code,
        lines: [],
      };
    }

    this.currentResponse.lines.push(message);

    if (separator !== " ") {
      return;
    }

    const completedResponse = this.currentResponse;
    this.currentResponse = null;

    const nextReader = this.pendingReaders.shift();
    if (nextReader) {
      nextReader.resolve(completedResponse);
      return;
    }

    this.queuedResponses.push(completedResponse);
  }

  /**
   * Handles socket shutdown and rejects any pending readers.
   */
  private handleClose(error?: Error): void {
    this.closed = true;
    this.rejectAllPending(error ?? new SmtpConnectionClosedError("SMTP connection closed"));
  }

  /**
   * Resolves the pending TLS upgrade promise.
   */
  private handleHandshake(success: boolean, authorizationError: Error | null): void {
    if (!this.pendingTlsUpgrade) {
      return;
    }

    const pendingTlsUpgrade = this.pendingTlsUpgrade;
    this.pendingTlsUpgrade = null;

    if (!success && authorizationError) {
      pendingTlsUpgrade.reject(authorizationError);
      return;
    }

    pendingTlsUpgrade.resolve();
  }

  /**
   * Resolves the pending backpressure wait.
   */
  private resolvePendingDrain(): void {
    if (!this.pendingDrain) {
      return;
    }

    const pendingDrain = this.pendingDrain;
    this.pendingDrain = null;
    pendingDrain.resolve();
  }

  /**
   * Rejects all pending promises when the socket errors or closes.
   */
  private rejectAllPending(reason: unknown): void {
    const pendingReaders = this.pendingReaders.splice(0);
    for (const pendingReader of pendingReaders) {
      pendingReader.reject(reason);
    }

    if (this.pendingDrain) {
      this.pendingDrain.reject(reason);
      this.pendingDrain = null;
    }

    if (this.pendingTlsUpgrade) {
      this.pendingTlsUpgrade.reject(reason);
      this.pendingTlsUpgrade = null;
    }
  }

  /**
   * Validates the SMTP response code for a command context.
   */
  private assertExpectedCode(
    response: SmtpResponse,
    expectedCodes: readonly number[],
    context: string,
  ): void {
    if (expectedCodes.some((expectedCode) => expectedCode === response.code)) {
      return;
    }

    throw new SmtpProtocolError(
      response.code,
      response.lines,
      `Unexpected response for ${context}`,
    );
  }

  /**
   * Returns the active socket or throws when the connection is unavailable.
   */
  private assertSocket(): Bun.Socket<undefined> {
    if (!this.socket || this.closed) {
      throw new SmtpConnectionClosedError("SMTP socket is not available");
    }

    return this.socket;
  }
}

/**
 * Bun-native SMTP delivery service used by automation email workflows.
 */
export class EmailDeliveryService {
  private readonly logger = createServerLogger("email-delivery");

  /**
   * Sends a generated reply over SMTP using the configured transport settings.
   *
   * @param config - Persisted SMTP transport config with the secret password.
   * @param request - Generated outbound message to deliver.
   * @returns Delivery metadata for audit trails and UI state.
   */
  async send(
    config: EmailTransportRuntimeConfig,
    request: EmailDeliveryRequest,
  ): Promise<EmailDeliveryResult> {
    this.validateTransport(config, request.recipientEmail);

    const clientHost = resolveEhloHost(config.fromEmail, config.host);
    const deliveredAt = new Date().toISOString();
    const messageId = createMessageId(clientHost);
    const connection = new SmtpConnection(config);
    const metadata: DeliveryEnvelopeMetadata = {
      clientHost,
      deliveredAt,
      messageId,
    };

    const connectResult = await settle(connection.connect());
    if (connectResult.status === "rejected") {
      connection.close();
      throw connectResult.reason;
    }

    const deliveryResult = await settle(
      this.performDelivery(connection, config, request, metadata),
    );
    const quitResult = await settle(connection.quit());
    if (quitResult.status === "rejected") {
      this.logger.warn("smtp quit failed", quitResult.reason);
    }
    connection.close();

    if (deliveryResult.status === "rejected") {
      throw deliveryResult.reason;
    }

    this.logger.info("email delivered", {
      recipientEmail: request.recipientEmail,
      fromEmail: config.fromEmail,
      messageId,
    });

    return deliveryResult.value;
  }

  /**
   * Executes the SMTP handshake, optional auth, and message transfer sequence.
   */
  private async performDelivery(
    connection: SmtpConnection,
    config: EmailTransportRuntimeConfig,
    request: EmailDeliveryRequest,
    metadata: DeliveryEnvelopeMetadata,
  ): Promise<EmailDeliveryResult> {
    const initialCapabilities = await connection.ehlo(metadata.clientHost);
    const securedCapabilities =
      config.security === "starttls"
        ? await this.performStartTls(connection, initialCapabilities, metadata.clientHost)
        : initialCapabilities;

    await this.authenticateIfNeeded(connection, config, securedCapabilities);
    await connection.sendMail(
      config.fromEmail,
      request.recipientEmail,
      buildRfc822Message(config, request, metadata.deliveredAt, metadata.messageId),
    );

    return {
      recipientEmail: request.recipientEmail,
      fromEmail: config.fromEmail,
      deliveredAt: metadata.deliveredAt,
      messageId: metadata.messageId,
    };
  }

  /**
   * Validates SMTP settings before opening a network connection.
   */
  private validateTransport(config: EmailTransportRuntimeConfig, recipientEmail: string): void {
    if (config.host.trim().length === 0) {
      throw new Error("Email delivery host is not configured");
    }

    if (!isValidEmail(config.fromEmail)) {
      throw new Error("Email delivery sender address is invalid");
    }

    if (!isValidEmail(recipientEmail)) {
      throw new Error("Email delivery recipient address is invalid");
    }

    if (config.username.trim().length > 0 && !config.password) {
      throw new Error("Email delivery password is required for authenticated SMTP");
    }
  }

  /**
   * Upgrades the connection with STARTTLS when configured.
   */
  private async performStartTls(
    connection: SmtpConnection,
    capabilities: SmtpResponse,
    clientHost: string,
  ): Promise<SmtpResponse> {
    if (!smtpSupportsCapability(capabilities, "STARTTLS")) {
      throw new Error("SMTP server does not support STARTTLS");
    }

    await connection.startTls();
    return connection.ehlo(clientHost);
  }

  /**
   * Authenticates against the SMTP server when credentials are configured.
   */
  private async authenticateIfNeeded(
    connection: SmtpConnection,
    config: EmailTransportRuntimeConfig,
    capabilities: SmtpResponse,
  ): Promise<void> {
    const username = config.username.trim();
    if (username.length === 0) {
      return;
    }

    const password = config.password ?? "";
    if (!smtpSupportsAuthMode(capabilities, config.authMethod)) {
      throw new Error(`SMTP server does not advertise AUTH ${config.authMethod.toUpperCase()}`);
    }

    if (config.authMethod === "login") {
      await connection.authLogin(username, password);
      return;
    }

    await connection.authPlain(username, password);
  }
}

const sanitizeHeaderValue = (value: string): string =>
  value.replace(SMTP_HEADER_NEWLINE_PATTERN, " ").replace(SMTP_WHITESPACE_PATTERN, " ").trim();

const encodeBase64Utf8 = (value: string): string => Buffer.from(value, "utf8").toString("base64");

const encodeHeaderValue = (value: string): string => {
  const sanitized = sanitizeHeaderValue(value);
  if (SMTP_ASCII_HEADER_PATTERN.test(sanitized)) {
    return sanitized;
  }
  return `=?UTF-8?B?${encodeBase64Utf8(sanitized)}?=`;
};

const formatAddress = (email: string, displayName: string): string => {
  const sanitizedName = sanitizeHeaderValue(displayName);
  if (sanitizedName.length === 0) {
    return `<${email}>`;
  }
  return `${encodeHeaderValue(sanitizedName)} <${email}>`;
};

const splitBase64Lines = (value: string): string[] => {
  const lines: string[] = [];
  for (let index = 0; index < value.length; index += SMTP_BASE64_LINE_LENGTH) {
    lines.push(value.slice(index, index + SMTP_BASE64_LINE_LENGTH));
  }
  return lines.length > 0 ? lines : [""];
};

const dotStuffMessage = (value: string): string =>
  value
    .split(SMTP_LINE_BREAK)
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join(SMTP_LINE_BREAK);

const resolveEhloHost = (fromEmail: string, fallbackHost: string): string => {
  const domain = fromEmail.split("@")[1]?.trim();
  if (domain && domain.length > 0) {
    return domain;
  }

  const sanitizedHost = fallbackHost.trim();
  return sanitizedHost.length > 0 ? sanitizedHost : SMTP_DEFAULT_EHLO_HOST;
};

const createMessageId = (domain: string): string => `<${generateId()}@${domain}>`;

const smtpSupportsCapability = (capabilities: SmtpResponse, capability: string): boolean => {
  const normalizedCapability = capability.toUpperCase();
  return capabilities.lines.some((line) => line.toUpperCase().startsWith(normalizedCapability));
};

const smtpSupportsAuthMode = (capabilities: SmtpResponse, authMode: SmtpAuthMode): boolean => {
  const authLine = capabilities.lines.find((line) => line.toUpperCase().startsWith("AUTH "));
  if (!authLine) {
    return false;
  }

  const normalizedAuthLine = authLine.toUpperCase();
  if (authMode === "login") {
    return normalizedAuthLine.includes(" LOGIN");
  }

  return normalizedAuthLine.includes(" PLAIN");
};

const buildRfc822Message = (
  config: EmailTransportRuntimeConfig,
  request: EmailDeliveryRequest,
  deliveredAt: string,
  messageId: string,
): string => {
  const encodedBody = splitBase64Lines(
    encodeBase64Utf8(request.body.replace(/\r?\n/g, SMTP_LINE_BREAK)),
  );
  const fromAddress = formatAddress(config.fromEmail, config.fromName);
  const toAddress = formatAddress(request.recipientEmail, "");

  return [
    `From: ${fromAddress}`,
    `To: ${toAddress}`,
    `Subject: ${encodeHeaderValue(request.subject)}`,
    `Date: ${new Date(deliveredAt).toUTCString()}`,
    `Message-ID: ${messageId}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    ...encodedBody,
    "",
  ].join(SMTP_LINE_BREAK);
};

export const emailDeliveryService = new EmailDeliveryService();
