const SMTP_LINE_BREAK = "\r\n" as const;
const SMTP_TEXT_DECODER = new TextDecoder();

/**
 * Captured SMTP session details from the verification harness.
 */
export interface CapturedSmtpExchange {
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

type SmtpProcessingContext = {
  closeOnCommand: string | null;
  handlers: readonly SmtpLineHandler[];
  session: SmtpSessionState;
  socket: Bun.Socket<undefined>;
};

/**
 * SMTP harness capabilities and failure injection options.
 */
export interface SmtpHarnessOptions {
  capabilityLines?: readonly string[];
  closeOnCommand?: string;
}

/**
 * Running SMTP verification harness.
 */
export interface SmtpHarnessHandle {
  exchange: CapturedSmtpExchange;
  port: number;
  stop(): void;
}

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
    const line = readNextBufferedLine(session);
    if (line === undefined) {
      return lines;
    }

    lines.push(line);
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

const buildEhloResponder =
  (capabilities: readonly string[]): SmtpLineHandler =>
  (socket, _session, line) => {
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

const processSmtpData = (context: SmtpProcessingContext, data: Uint8Array): void => {
  const { closeOnCommand, handlers, session, socket } = context;
  session.buffer += SMTP_TEXT_DECODER.decode(data, { stream: true });

  for (const line of readBufferedLines(session)) {
    if (handleDataModeLine(socket, session, line)) {
      continue;
    }

    session.exchange.commands.push(line);
    if (closeOnCommand !== null && line === closeOnCommand) {
      socket.end();
      return;
    }

    for (const handler of handlers) {
      if (handler(socket, session, line)) {
        break;
      }
    }
  }
};

/**
 * Create an in-process SMTP harness for deterministic integration testing.
 *
 * @param options Capability and disconnect behavior overrides.
 * @returns Running harness handle.
 */
export function createSmtpHarness(options: SmtpHarnessOptions = {}): SmtpHarnessHandle {
  const exchange: CapturedSmtpExchange = {
    commands: [],
    message: "",
  };
  const sessions = new WeakMap<Bun.Socket<undefined>, SmtpSessionState>();
  const handlers: readonly SmtpLineHandler[] = [
    handleAwaitingLoginUsername,
    handleAwaitingLoginPassword,
    buildEhloResponder(options.capabilityLines ?? ["smtp.test", "STARTTLS", "AUTH PLAIN LOGIN"]),
    handleAuthPlainLine,
    handleAuthLoginCommand,
    handleMailFromLine,
    handleRecipientLine,
    handleDataCommand,
    handleQuitCommand,
  ];

  const listener = Bun.listen({
    hostname: "127.0.0.1",
    port: 0,
    socket: {
      binaryType: "uint8array",
      open(socket) {
        sessions.set(socket, createSessionState(exchange));
        socket.write(`220 smtp.test ESMTP${SMTP_LINE_BREAK}`);
      },
      data(socket, data) {
        const session = sessions.get(socket);
        if (!session) {
          return;
        }

        processSmtpData(
          {
            closeOnCommand: options.closeOnCommand ?? null,
            handlers,
            session,
            socket,
          },
          data,
        );
      },
    },
  });

  return {
    exchange,
    port: listener.port,
    stop(): void {
      listener.stop(true);
    },
  };
}
