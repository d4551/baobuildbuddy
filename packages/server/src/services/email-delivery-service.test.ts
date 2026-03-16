import { afterEach, describe, expect, test } from "bun:test";
import type { EmailTransportSecurityOption } from "@bao/shared";
import { emailDeliveryService } from "./email-delivery-service";

const SMTP_LINE_BREAK = "\r\n";
const SMTP_PORT_EPHEMERAL = 0;
const SMTP_USERNAME = "mailer@example.test";
const SMTP_PASSWORD = "secret-password";
const SMTP_FROM_NAME = "Bao Build Buddy";
const SMTP_TEXT_DECODER = new TextDecoder();

interface CapturedSmtpExchange {
  commands: string[];
  message: string;
  username?: string;
}

interface SmtpSessionState {
  authComplete: boolean;
  awaitingLoginPassword: boolean;
  awaitingLoginUsername: boolean;
  buffer: string;
  dataMode: boolean;
  exchange: CapturedSmtpExchange;
  messageLines: string[];
}

type SmtpLineHandler = (
  socket: Bun.Socket<undefined>,
  session: SmtpSessionState,
  line: string,
) => boolean;

let activeListener: Bun.TCPSocketListener<undefined> | null = null;
let closeOnCommand: string | null = null;

const encodeBase64Utf8 = (value: string): string => Buffer.from(value, "utf8").toString("base64");

const createSessionState = (exchange: CapturedSmtpExchange): SmtpSessionState => ({
  authComplete: false,
  awaitingLoginPassword: false,
  awaitingLoginUsername: false,
  buffer: "",
  dataMode: false,
  exchange,
  messageLines: [],
});

const readNextBufferedLine = (session: SmtpSessionState): string | undefined => {
  const breakIndex = session.buffer.indexOf(SMTP_LINE_BREAK);
  if (breakIndex < 0) {
    return;
  }

  const line = session.buffer.slice(0, breakIndex);
  session.buffer = session.buffer.slice(breakIndex + SMTP_LINE_BREAK.length);
  return line;
};

const readBufferedLines = (session: SmtpSessionState): string[] => {
  const lines: string[] = [];

  for (;;) {
    const nextLine = readNextBufferedLine(session);
    if (nextLine === undefined) {
      return lines;
    }

    lines.push(nextLine);
  }
};

const handleDataModeLine = (
  socket: Bun.Socket<undefined>,
  session: SmtpSessionState,
  line: string,
): boolean => {
  if (!session.dataMode) {
    return false;
  }

  if (line === ".") {
    session.exchange.message = session.messageLines.join(SMTP_LINE_BREAK);
    session.dataMode = false;
    socket.write(`250 queued${SMTP_LINE_BREAK}`);
    return true;
  }

  session.messageLines.push(line);
  return true;
};

const handleAwaitingLoginUsername: SmtpLineHandler = (socket, session, line) => {
  if (!session.awaitingLoginUsername) {
    return false;
  }

  session.awaitingLoginUsername = false;
  session.awaitingLoginPassword = true;
  session.exchange.username = Buffer.from(line, "base64").toString("utf8");
  socket.write(`334 UGFzc3dvcmQ6${SMTP_LINE_BREAK}`);
  return true;
};

const handleAwaitingLoginPassword: SmtpLineHandler = (socket, session) => {
  if (!session.awaitingLoginPassword) {
    return false;
  }

  session.awaitingLoginPassword = false;
  session.authComplete = true;
  socket.write(`235 authenticated${SMTP_LINE_BREAK}`);
  return true;
};

const defaultEhloCapabilities = ["smtp.test", "STARTTLS", "AUTH PLAIN LOGIN"] as const;
type EhloCapability = string;

const buildEhloResponder = (capabilities: readonly EhloCapability[]): SmtpLineHandler => (
  socket,
  _session,
  line,
) => {
  if (!line.startsWith("EHLO ")) {
    return false;
  }

  for (let index = 0; index < capabilities.length; index += 1) {
    const capability = capabilities[index];
    const isLastLine = index === capabilities.length - 1;
    socket.write(`250${isLastLine ? " " : "-"}${capability}${SMTP_LINE_BREAK}`);
  }

  return true;
};

let ehloResponder: SmtpLineHandler = buildEhloResponder(defaultEhloCapabilities);
const handleEhloLine: SmtpLineHandler = (socket, session, line) => ehloResponder(socket, session, line);

const setEhloResponder = (responder: SmtpLineHandler): void => {
  ehloResponder = responder;
};

const handleAuthPlainLine: SmtpLineHandler = (socket, session, line) => {
  if (!line.startsWith("AUTH PLAIN ")) {
    return false;
  }

  session.authComplete = true;
  socket.write(`235 authenticated${SMTP_LINE_BREAK}`);
  return true;
};

const handleAuthLoginCommand: SmtpLineHandler = (socket, session, line) => {
  if (line !== "AUTH LOGIN") {
    return false;
  }

  session.awaitingLoginUsername = true;
  socket.write(`334 VXNlcm5hbWU6${SMTP_LINE_BREAK}`);
  return true;
};

const handleMailFromLine: SmtpLineHandler = (socket, session, line) => {
  if (!line.startsWith("MAIL FROM:")) {
    return false;
  }

  socket.write(
    `${session.authComplete ? "250 sender ok" : "530 authentication required"}${SMTP_LINE_BREAK}`,
  );
  return true;
};

const handleRecipientLine: SmtpLineHandler = (socket, _session, line) => {
  if (!line.startsWith("RCPT TO:")) {
    return false;
  }

  socket.write(`250 recipient ok${SMTP_LINE_BREAK}`);
  return true;
};

const handleDataCommand: SmtpLineHandler = (socket, session, line) => {
  if (line !== "DATA") {
    return false;
  }

  session.dataMode = true;
  socket.write(`354 end with .${SMTP_LINE_BREAK}`);
  return true;
};

const handleQuitCommand: SmtpLineHandler = (socket, _session, line) => {
  if (line !== "QUIT") {
    return false;
  }

  socket.write(`221 bye${SMTP_LINE_BREAK}`);
  socket.end();
  return true;
};

const SMTP_COMMAND_HANDLERS: readonly SmtpLineHandler[] = [
  handleAwaitingLoginUsername,
  handleAwaitingLoginPassword,
  handleEhloLine,
  handleAuthPlainLine,
  handleAuthLoginCommand,
  handleMailFromLine,
  handleRecipientLine,
  handleDataCommand,
  handleQuitCommand,
];

const handleCommandLine = (
  socket: Bun.Socket<undefined>,
  session: SmtpSessionState,
  line: string,
): void => {
  session.exchange.commands.push(line);
  if (closeOnCommand !== null && line === closeOnCommand) {
    socket.end();
    return;
  }
  for (const handler of SMTP_COMMAND_HANDLERS) {
    if (handler(socket, session, line)) {
      return;
    }
  }
};

const processSmtpData = (
  socket: Bun.Socket<undefined>,
  session: SmtpSessionState,
  data: Uint8Array,
): void => {
  session.buffer += SMTP_TEXT_DECODER.decode(data, { stream: true });

  for (const line of readBufferedLines(session)) {
    if (handleDataModeLine(socket, session, line)) {
      continue;
    }

    handleCommandLine(socket, session, line);
  }
};

const createSmtpSocketHandlers = (
  exchange: CapturedSmtpExchange,
  sessions: WeakMap<Bun.Socket<undefined>, SmtpSessionState>,
) => ({
  binaryType: "uint8array" as const,
  open(socket: Bun.Socket<undefined>) {
    sessions.set(socket, createSessionState(exchange));
    socket.write(`220 smtp.test ESMTP${SMTP_LINE_BREAK}`);
  },
  data(socket: Bun.Socket<undefined>, data: Uint8Array) {
    const session = sessions.get(socket);
    if (!session) {
      return;
    }

    processSmtpData(socket, session, data);
  },
});

type SmtpHarnessOptions = {
  capabilityLines?: readonly EhloCapability[];
  closeOnCommand?: string;
};

const createSmtpHarness = (
  options: SmtpHarnessOptions = {},
): { exchange: CapturedSmtpExchange; port: number } => {
  const exchange: CapturedSmtpExchange = {
    commands: [],
    message: "",
  };
  const sessions = new WeakMap<Bun.Socket<undefined>, SmtpSessionState>();
  setEhloResponder(buildEhloResponder(options.capabilityLines ?? defaultEhloCapabilities));
  closeOnCommand = options.closeOnCommand ?? null;
  activeListener = Bun.listen({
    hostname: "127.0.0.1",
    port: SMTP_PORT_EPHEMERAL,
    socket: createSmtpSocketHandlers(exchange, sessions),
  });

  return {
    exchange,
    port: activeListener.port,
  };
};

const createTransportConfig = (
  port: number,
  authMethod: "plain" | "login",
  security: EmailTransportSecurityOption = "plain",
) => ({
  host: "127.0.0.1",
  port,
  security,
  username: SMTP_USERNAME,
  fromEmail: SMTP_USERNAME,
  fromName: SMTP_FROM_NAME,
  authMethod,
  connectionTimeoutSeconds: 10,
  password: SMTP_PASSWORD,
});

const encodePlainAuthCommand = () =>
  `AUTH PLAIN ${encodeBase64Utf8(`\u0000${SMTP_USERNAME}\u0000${SMTP_PASSWORD}`)}`;

const encodeMessageBody = (body: string) =>
  encodeBase64Utf8(body.replaceAll("\n", SMTP_LINE_BREAK));

afterEach(() => {
  closeOnCommand = null;
  if (!activeListener) {
    return;
  }

  activeListener.stop(true);
  activeListener = null;
});

const expectRejectedDelivery = async (
  deliveryPromise: Promise<unknown>,
): Promise<Error> => {
  const result = await deliveryPromise.then(
    () => null,
    (error: unknown) => error,
  );
  expect(result).toBeInstanceOf(Error);
  return result as Error;
};

const registerAuthPlainTest = (): void => {
  test("sends a message using AUTH PLAIN", async () => {
    const harness = createSmtpHarness();
    const body = "Thanks for the interview.\nLooking forward to next steps.";
    const result = await emailDeliveryService.send(createTransportConfig(harness.port, "plain"), {
      recipientEmail: "recruiter@example.test",
      subject: "Interview follow-up",
      body,
    });

    expect(result.recipientEmail).toBe("recruiter@example.test");
    expect(harness.exchange.commands).toContain(encodePlainAuthCommand());
    expect(harness.exchange.message).toContain(`From: ${SMTP_FROM_NAME} <${SMTP_USERNAME}>`);
    expect(harness.exchange.message).toContain("To: <recruiter@example.test>");
    expect(harness.exchange.message).toContain("Subject: Interview follow-up");
    expect(harness.exchange.message).toContain("Content-Transfer-Encoding: base64");
    expect(harness.exchange.message).toContain(encodeMessageBody(body));
  });
};

const registerAuthLoginTest = (): void => {
  test("sends a message using AUTH LOGIN", async () => {
    const harness = createSmtpHarness();
    const result = await emailDeliveryService.send(createTransportConfig(harness.port, "login"), {
      recipientEmail: "producer@example.test",
      subject: "Thanks",
      body: "Appreciate the update.",
    });

    expect(result.recipientEmail).toBe("producer@example.test");
    expect(harness.exchange.commands).toContain("AUTH LOGIN");
    expect(harness.exchange.commands).toContain(encodeBase64Utf8(SMTP_USERNAME));
    expect(harness.exchange.username).toBe(SMTP_USERNAME);
    expect(harness.exchange.message).toContain("To: <producer@example.test>");
  });
};

const registerStartTlsFailureTest = (): void => {
  test("fails when STARTTLS is required but missing", async () => {
    const harness = createSmtpHarness({
      capabilityLines: ["smtp.test", "AUTH PLAIN LOGIN"],
    });
    const error = await expectRejectedDelivery(
      emailDeliveryService.send(createTransportConfig(harness.port, "plain", "starttls"), {
        recipientEmail: "starttls@example.test",
        subject: "TLS required",
        body: "Secure message.",
      }),
    );
    expect(error.message).toContain("SMTP server does not support STARTTLS");
  });
};

const registerAuthMismatchFailureTest = (): void => {
  test("fails when requested auth method is not advertised", async () => {
    const harness = createSmtpHarness({
      capabilityLines: ["smtp.test", "STARTTLS", "AUTH PLAIN"],
    });
    const error = await expectRejectedDelivery(
      emailDeliveryService.send(createTransportConfig(harness.port, "login", "plain"), {
        recipientEmail: "login@example.test",
        subject: "Auth mismatch",
        body: "Testing login fallback.",
      }),
    );
    expect(error.message).toContain("SMTP server does not advertise AUTH LOGIN");
  });
};

const registerDisconnectFailureTest = (): void => {
  test("fails when the SMTP connection closes before message delivery completes", async () => {
    const harness = createSmtpHarness({
      closeOnCommand: "MAIL FROM:<mailer@example.test>",
    });
    const error = await expectRejectedDelivery(
      emailDeliveryService.send(createTransportConfig(harness.port, "plain", "plain"), {
        recipientEmail: "disconnect@example.test",
        subject: "Connection closed",
        body: "Testing unexpected disconnect.",
      }),
    );
    expect(error.message).toContain("SMTP connection closed");
    expect(harness.exchange.commands).toContain("MAIL FROM:<mailer@example.test>");
  });
};

describe("email delivery service", () => {
  registerAuthPlainTest();
  registerAuthLoginTest();
  registerStartTlsFailureTest();
  registerAuthMismatchFailureTest();
  registerDisconnectFailureTest();
});
