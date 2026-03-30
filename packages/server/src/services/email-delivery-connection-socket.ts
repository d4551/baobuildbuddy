import { settle } from "@bao/shared";
import {
  type EmailTransportRuntimeConfig,
  SmtpConnectionClosedError,
} from "./email-delivery-contracts";
import type { PendingDrainReader, SmtpConnectionState } from "./email-delivery-connection-state";
import {
  assertExpectedCode,
  handleClose,
  handleData,
  handleHandshake,
  readResponse,
  rejectAllPending,
  resolvePendingDrain,
} from "./email-delivery-connection-state";

const createSocketLifecycle = (state: SmtpConnectionState) => ({
  binaryType: "uint8array" as const,
  close: (_socket: Bun.Socket<undefined>, error?: Error) => {
    handleClose(state, error);
  },
  connectError: (_socket: Bun.Socket<undefined>, error: Error) => {
    rejectAllPending(state, error);
  },
  data: (_socket: Bun.Socket<undefined>, data: Uint8Array) => {
    handleData(state, data);
  },
  drain: () => {
    resolvePendingDrain(state);
  },
  error: (_socket: Bun.Socket<undefined>, error: Error) => {
    rejectAllPending(state, error);
  },
  handshake: (_socket: Bun.Socket<undefined>, success: boolean, authorizationError: Error | null) => {
    handleHandshake(state, success, authorizationError);
  },
  timeout: (socket: Bun.Socket<undefined>) => {
    const timeoutError = new SmtpConnectionClosedError("SMTP connection timed out");
    rejectAllPending(state, timeoutError);
    socket.close();
  },
});

export const connectSmtpSocket = async (
  state: SmtpConnectionState,
  config: EmailTransportRuntimeConfig,
): Promise<void> => {
  const socketResult = await settle(
    Bun.connect({
      hostname: config.host,
      port: config.port,
      tls: config.security === "tls",
      socket: createSocketLifecycle(state),
    }),
  );

  if (socketResult.status === "rejected") {
    throw socketResult.reason;
  }

  state.socket = socketResult.value;
  state.socket.timeout(config.connectionTimeoutSeconds);
  const greeting = await readResponse(state);
  assertExpectedCode(greeting, [220], "SMTP greeting");
};

const waitForTlsUpgrade = async (
  state: SmtpConnectionState,
  upgrade: () => [Bun.Socket<undefined>, Bun.Socket<undefined>] | undefined,
): Promise<Bun.Socket<undefined>> => {
  const tlsPromise = new Promise<void>((resolve, reject) => {
    state.pendingTlsUpgrade = { resolve, reject };
  });
  const upgradedSocket = upgrade();
  if (!upgradedSocket) {
    state.pendingTlsUpgrade = null;
    throw new SmtpConnectionClosedError("SMTP socket is not available");
  }

  const [, tlsSocket] = upgradedSocket;
  const tlsResult = await settle(tlsPromise);
  if (tlsResult.status === "rejected") {
    throw tlsResult.reason;
  }

  return tlsSocket;
};

export const upgradeSmtpSocket = async (
  state: SmtpConnectionState,
  _config: EmailTransportRuntimeConfig,
  socket: Bun.Socket<undefined>,
): Promise<Bun.Socket<undefined>> =>
  waitForTlsUpgrade(state, () =>
    socket.upgradeTLS({
      tls: true,
      socket: createSocketLifecycle(state),
    }),
  );

export const writeBytes = async (
  state: SmtpConnectionState,
  socket: Bun.Socket<undefined>,
  bytes: Uint8Array,
  offset: number,
): Promise<void> => {
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
    state.pendingDrain = { resolve, reject } satisfies PendingDrainReader;
  });
  await writeBytes(state, socket, bytes, offset + written);
};
