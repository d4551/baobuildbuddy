import { createServerLogger } from "../utils/logger";
import {
  type SmtpResponse,
  SmtpConnectionClosedError,
  SmtpProtocolError,
} from "./email-delivery-contracts";
import { SMTP_LINE_BREAK } from "./email-delivery-message";

const SMTP_RESPONSE_LINE_PATTERN = /^(\d{3})([ -])(.*)$/;

export interface PendingResponseReader {
  reject: (reason?: unknown) => void;
  resolve: (response: SmtpResponse) => void;
}

export interface PendingDrainReader {
  reject: (reason?: unknown) => void;
  resolve: () => void;
}

export interface PendingTlsUpgrade {
  reject: (reason?: unknown) => void;
  resolve: () => void;
}

export interface SmtpConnectionState {
  decoder: TextDecoder;
  encoder: TextEncoder;
  queuedResponses: SmtpResponse[];
  pendingReaders: PendingResponseReader[];
  logger: ReturnType<typeof createServerLogger>;
  currentResponse: SmtpResponse | null;
  buffer: string;
  socket: Bun.Socket<undefined> | null;
  pendingDrain: PendingDrainReader | null;
  pendingTlsUpgrade: PendingTlsUpgrade | null;
  closed: boolean;
}

export const createSmtpConnectionState = (): SmtpConnectionState => ({
  decoder: new TextDecoder(),
  encoder: new TextEncoder(),
  queuedResponses: [],
  pendingReaders: [],
  logger: createServerLogger("smtp-connection"),
  currentResponse: null,
  buffer: "",
  socket: null,
  pendingDrain: null,
  pendingTlsUpgrade: null,
  closed: false,
});

export const readResponse = async (state: SmtpConnectionState): Promise<SmtpResponse> => {
  if (state.queuedResponses.length > 0) {
    const queuedResponse = state.queuedResponses.shift();
    if (queuedResponse) {
      return queuedResponse;
    }
  }

  return new Promise<SmtpResponse>((resolve, reject) => {
    state.pendingReaders.push({ resolve, reject });
  });
};

export const handleData = (state: SmtpConnectionState, data: Uint8Array): void => {
  state.buffer += state.decoder.decode(data, { stream: true });

  for (;;) {
    const lineBreakIndex = state.buffer.indexOf(SMTP_LINE_BREAK);
    if (lineBreakIndex < 0) {
      return;
    }

    const line = state.buffer.slice(0, lineBreakIndex);
    state.buffer = state.buffer.slice(lineBreakIndex + SMTP_LINE_BREAK.length);
    handleResponseLine(state, line);
  }
};

const handleResponseLine = (state: SmtpConnectionState, line: string): void => {
  const parsed = SMTP_RESPONSE_LINE_PATTERN.exec(line);
  if (!parsed) {
    return;
  }

  const code = Number.parseInt(parsed[1] ?? "", 10);
  const separator = parsed[2] ?? " ";
  const message = parsed[3] ?? "";

  if (!state.currentResponse || state.currentResponse.code !== code) {
    state.currentResponse = {
      code,
      lines: [],
    };
  }

  state.currentResponse.lines.push(message);
  if (separator !== " ") {
    return;
  }

  const completedResponse = state.currentResponse;
  state.currentResponse = null;

  const nextReader = state.pendingReaders.shift();
  if (nextReader) {
    nextReader.resolve(completedResponse);
    return;
  }

  state.queuedResponses.push(completedResponse);
};

export const handleClose = (state: SmtpConnectionState, error?: Error): void => {
  state.closed = true;
  rejectAllPending(state, error ?? new SmtpConnectionClosedError("SMTP connection closed"));
};

export const handleHandshake = (
  state: SmtpConnectionState,
  success: boolean,
  authorizationError: Error | null,
): void => {
  if (!state.pendingTlsUpgrade) {
    return;
  }

  const pendingTlsUpgrade = state.pendingTlsUpgrade;
  state.pendingTlsUpgrade = null;

  if (!success && authorizationError) {
    pendingTlsUpgrade.reject(authorizationError);
    return;
  }

  pendingTlsUpgrade.resolve();
};

export const resolvePendingDrain = (state: SmtpConnectionState): void => {
  if (!state.pendingDrain) {
    return;
  }

  const pendingDrain = state.pendingDrain;
  state.pendingDrain = null;
  pendingDrain.resolve();
};

export const rejectAllPending = (state: SmtpConnectionState, reason: unknown): void => {
  const pendingReaders = state.pendingReaders.splice(0);
  for (const pendingReader of pendingReaders) {
    pendingReader.reject(reason);
  }

  if (state.pendingDrain) {
    state.pendingDrain.reject(reason);
    state.pendingDrain = null;
  }

  if (state.pendingTlsUpgrade) {
    state.pendingTlsUpgrade.reject(reason);
    state.pendingTlsUpgrade = null;
  }
};

export const assertExpectedCode = (
  response: SmtpResponse,
  expectedCodes: readonly number[],
  context: string,
): void => {
  if (expectedCodes.some((expectedCode) => expectedCode === response.code)) {
    return;
  }

  throw new SmtpProtocolError(response.code, response.lines, `Unexpected response for ${context}`);
};

export const assertSocket = (state: SmtpConnectionState): Bun.Socket<undefined> => {
  if (!state.socket || state.closed) {
    throw new SmtpConnectionClosedError("SMTP socket is not available");
  }

  return state.socket;
};
