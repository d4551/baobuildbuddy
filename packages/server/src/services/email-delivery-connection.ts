import { settle } from "@bao/shared";
import { createServerLogger } from "../utils/logger";
import {
  type EmailTransportRuntimeConfig,
  type SmtpResponse,
  SmtpConnectionClosedError,
  SmtpProtocolError,
} from "./email-delivery-contracts";
import { dotStuffMessage, encodeBase64Utf8, SMTP_LINE_BREAK } from "./email-delivery-message";

const SMTP_DATA_ENDING = `${SMTP_LINE_BREAK}.${SMTP_LINE_BREAK}`;
const SMTP_QUIT_COMMAND = "QUIT";
const SMTP_RESPONSE_LINE_PATTERN = /^(\d{3})([ -])(.*)$/;

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

export class SmtpConnection {
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
