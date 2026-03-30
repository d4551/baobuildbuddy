import type { EmailTransportRuntimeConfig, SmtpResponse } from "./email-delivery-contracts";
import { settle } from "@bao/shared";
import { dotStuffMessage, encodeBase64Utf8, SMTP_LINE_BREAK } from "./email-delivery-message";
import {
  assertExpectedCode,
  assertSocket,
  createSmtpConnectionState,
  readResponse,
  type SmtpConnectionState,
} from "./email-delivery-connection-state";
import {
  connectSmtpSocket,
  upgradeSmtpSocket,
  writeBytes,
} from "./email-delivery-connection-socket";

const SMTP_DATA_ENDING = `${SMTP_LINE_BREAK}.${SMTP_LINE_BREAK}`;
const SMTP_QUIT_COMMAND = "QUIT";

export class SmtpConnection {
  private readonly state: SmtpConnectionState = createSmtpConnectionState();

  constructor(private readonly config: EmailTransportRuntimeConfig) {}

  async connect(): Promise<void> {
    await connectSmtpSocket(this.state, this.config);
  }

  async ehlo(clientHost: string): Promise<SmtpResponse> {
    return this.command(`EHLO ${clientHost}`, [250], "EHLO");
  }

  async startTls(): Promise<void> {
    const socket = assertSocket(this.state);
    await this.command("STARTTLS", [220], "STARTTLS");

    this.state.socket = await upgradeSmtpSocket(this.state, this.config, socket);
    this.state.socket.timeout(this.config.connectionTimeoutSeconds);
  }

  async authPlain(username: string, password: string): Promise<void> {
    const encoded = encodeBase64Utf8(`\u0000${username}\u0000${password}`);
    await this.command(`AUTH PLAIN ${encoded}`, [235], "AUTH PLAIN");
  }

  async authLogin(username: string, password: string): Promise<void> {
    await this.command("AUTH LOGIN", [334], "AUTH LOGIN");
    await this.command(encodeBase64Utf8(username), [334], "AUTH LOGIN username");
    await this.command(encodeBase64Utf8(password), [235], "AUTH LOGIN password");
  }

  async sendMail(fromEmail: string, recipientEmail: string, message: string): Promise<void> {
    await this.command(`MAIL FROM:<${fromEmail}>`, [250], "MAIL FROM");
    await this.command(`RCPT TO:<${recipientEmail}>`, [250, 251], "RCPT TO");
    await this.command("DATA", [354], "DATA");
    await this.writeCommand(`${dotStuffMessage(message)}${SMTP_DATA_ENDING}`);
    const dataResult = await readResponse(this.state);
    assertExpectedCode(dataResult, [250], "message body");
  }

  async quit(): Promise<void> {
    if (this.state.closed) {
      return;
    }

    const quitResult = await settle(this.command(SMTP_QUIT_COMMAND, [221], "QUIT"));
    if (quitResult.status === "rejected") {
      this.state.logger.warn("smtp quit failed", quitResult.reason);
    }
  }

  close(): void {
    if (!this.state.socket || this.state.closed) {
      return;
    }

    this.state.closed = true;
    this.state.socket.close();
  }

  private async command(
    command: string,
    expectedCodes: readonly number[],
    context: string,
  ): Promise<SmtpResponse> {
    await this.writeCommand(`${command}${SMTP_LINE_BREAK}`);
    const response = await readResponse(this.state);
    assertExpectedCode(response, expectedCodes, context);
    return response;
  }

  private async writeCommand(command: string): Promise<void> {
    const socket = assertSocket(this.state);
    await writeBytes(this.state, socket, this.state.encoder.encode(command), 0);
  }
}
