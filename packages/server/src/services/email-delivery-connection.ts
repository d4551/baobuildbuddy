import {
  COUNT_THREE_FIFTY_FOUR,
  COUNT_THREE_THIRTY_FOUR,
  COUNT_TWO_FIFTY,
  COUNT_TWO_FIFTY_ONE,
  COUNT_TWO_THIRTY_FIVE,
  COUNT_TWO_TWENTY,
  COUNT_TWO_TWENTY_ONE,
} from "@bao/shared/constants/numeric";
import { settle } from "@bao/shared/utils/promise";
import {
  connectSmtpSocket,
  upgradeSmtpSocket,
  writeBytes,
} from "./email-delivery-connection-socket";
import {
  assertExpectedCode,
  assertSocket,
  createSmtpConnectionState,
  readResponse,
  type SmtpConnectionState,
} from "./email-delivery-connection-state";
import type { EmailTransportRuntimeConfig, SmtpResponse } from "./email-delivery-contracts";
import { dotStuffMessage, encodeBase64Utf8, SMTP_LINE_BREAK } from "./email-delivery-message";

const SMTP_DATA_ENDING = `${SMTP_LINE_BREAK}.${SMTP_LINE_BREAK}`;
const SMTP_QUIT_COMMAND = "QUIT";

export class SmtpConnection {
  private readonly state: SmtpConnectionState = createSmtpConnectionState();

  constructor(private readonly config: EmailTransportRuntimeConfig) {}

  async connect(): Promise<void> {
    await connectSmtpSocket(this.state, this.config);
  }

  async ehlo(clientHost: string): Promise<SmtpResponse> {
    return this.command(`EHLO ${clientHost}`, [COUNT_TWO_FIFTY], "EHLO");
  }

  async startTls(): Promise<void> {
    const socket = assertSocket(this.state);
    await this.command("STARTTLS", [COUNT_TWO_TWENTY], "STARTTLS");

    this.state.socket = await upgradeSmtpSocket(this.state, this.config, socket);
    this.state.socket.timeout(this.config.connectionTimeoutSeconds);
  }

  async authPlain(username: string, password: string): Promise<void> {
    const encoded = encodeBase64Utf8(`\u0000${username}\u0000${password}`);
    await this.command(`AUTH PLAIN ${encoded}`, [COUNT_TWO_THIRTY_FIVE], "AUTH PLAIN");
  }

  async authLogin(username: string, password: string): Promise<void> {
    await this.command("AUTH LOGIN", [COUNT_THREE_THIRTY_FOUR], "AUTH LOGIN");
    await this.command(
      encodeBase64Utf8(username),
      [COUNT_THREE_THIRTY_FOUR],
      "AUTH LOGIN username",
    );
    await this.command(encodeBase64Utf8(password), [COUNT_TWO_THIRTY_FIVE], "AUTH LOGIN password");
  }

  async sendMail(fromEmail: string, recipientEmail: string, message: string): Promise<void> {
    await this.command(`MAIL FROM:<${fromEmail}>`, [COUNT_TWO_FIFTY], "MAIL FROM");
    await this.command(
      `RCPT TO:<${recipientEmail}>`,
      [COUNT_TWO_FIFTY, COUNT_TWO_FIFTY_ONE],
      "RCPT TO",
    );
    await this.command("DATA", [COUNT_THREE_FIFTY_FOUR], "DATA");
    await this.writeCommand(`${dotStuffMessage(message)}${SMTP_DATA_ENDING}`);
    const dataResult = await readResponse(this.state);
    assertExpectedCode(dataResult, [COUNT_TWO_FIFTY], "message body");
  }

  async quit(): Promise<void> {
    if (this.state.closed) {
      return;
    }

    const quitResult = await settle(
      this.command(SMTP_QUIT_COMMAND, [COUNT_TWO_TWENTY_ONE], "QUIT"),
    );
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
