import { API_ERROR_AI_STREAMING_FAILED } from "@bao/shared/constants/api-errors";
import { WS_ENDPOINTS } from "@bao/shared/constants/endpoints";
import { safeParseJson } from "@bao/shared/utils/json";
import { resolveWebSocketEndpoint } from "~/utils/endpoints";

const CHAT_WS_CONNECTION_FAILED = "chat_ws_connection_failed";
const CHAT_WS_CLOSED_EARLY = "chat_ws_closed_early";

type ChatSocketPayload = {
  type?: string;
  chunk?: string;
  sessionId?: string;
  message?: string;
};

export type ChatRealtimeStreamResult = {
  fullText: string;
  sessionId: string;
};

export type ChatRealtimeStreamInput = {
  content: string;
  sessionId: string;
  onChunk: (chunk: string) => void;
  onSessionId: (sessionId: string) => void;
};

type StreamSession = {
  fullText: string;
  activeSessionId: string;
  settled: boolean;
  finish: (result: ChatRealtimeStreamResult) => void;
  fail: (reason: string) => void;
};

function createStreamSession(
  initialSessionId: string,
  socket: WebSocket,
  resolve: (result: ChatRealtimeStreamResult) => void,
  reject: (reason: Error) => void,
): StreamSession {
  const session: StreamSession = {
    fullText: "",
    activeSessionId: initialSessionId,
    settled: false,
    finish: (result) => {
      if (session.settled) {
        return;
      }
      session.settled = true;
      socket.close();
      resolve(result);
    },
    fail: (reason) => {
      if (session.settled) {
        return;
      }
      session.settled = true;
      socket.close();
      reject(new Error(reason));
    },
  };
  return session;
}

function handleChatSocketMessage(
  event: MessageEvent,
  input: ChatRealtimeStreamInput,
  session: StreamSession,
): void {
  if (typeof event.data !== "string") {
    return;
  }
  const payload = safeParseJson(event.data) as ChatSocketPayload | null;
  if (!payload || typeof payload !== "object") {
    return;
  }
  if (typeof payload.sessionId === "string" && payload.sessionId.length > 0) {
    session.activeSessionId = payload.sessionId;
    input.onSessionId(payload.sessionId);
  }
  switch (payload.type) {
    case "stream_chunk": {
      if (typeof payload.chunk === "string" && payload.chunk.length > 0) {
        session.fullText += payload.chunk;
        input.onChunk(payload.chunk);
      }
      break;
    }
    case "stream_end": {
      session.finish({ fullText: session.fullText, sessionId: session.activeSessionId });
      break;
    }
    case "error": {
      const remoteMessage =
        typeof payload.message === "string" && payload.message.trim().length > 0
          ? payload.message
          : API_ERROR_AI_STREAMING_FAILED;
      session.fail(remoteMessage);
      break;
    }
    default:
      break;
  }
}

/**
 * Opens chat WS and resolves when stream_end arrives (or rejects on error/close).
 */
export function openChatRealtimeStream(
  wsBase: string,
  requestUrl: URL,
  input: ChatRealtimeStreamInput,
): Promise<ChatRealtimeStreamResult> {
  return new Promise((resolve, reject) => {
    const url = resolveWebSocketEndpoint(wsBase, requestUrl, WS_ENDPOINTS.chat);
    const socket = new WebSocket(url);
    const session = createStreamSession(input.sessionId, socket, resolve, reject);

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          content: input.content,
          sessionId: input.sessionId,
        }),
      );
    };
    socket.onmessage = (event) => {
      handleChatSocketMessage(event, input, session);
    };
    socket.onerror = () => {
      session.fail(CHAT_WS_CONNECTION_FAILED);
    };
    socket.onclose = () => {
      if (!session.settled) {
        session.fail(CHAT_WS_CLOSED_EARLY);
      }
    };
  });
}
