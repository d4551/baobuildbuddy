import { WS_ENDPOINTS } from "@bao/shared/constants/endpoints";
import { safeParseJson } from "@bao/shared/utils/json";
import { useRuntimeConfig } from "#imports";
import { useClientApiRequestRuntime } from "~/composables/api-request";
import { resolveWebSocketEndpoint } from "~/utils/endpoints";

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

/**
 * Live chat WebSocket client for WS_ENDPOINTS.chat.
 * Streams assistant tokens into the UI; HTTP remains fallback when WS is unavailable.
 */
export function useChatRealtime() {
  const runtime = useClientApiRequestRuntime();
  const config = useRuntimeConfig();
  const wsBase = String(config.public.wsBase || config.public.apiBase || "/");

  const sendStreamingMessage = (input: {
    content: string;
    sessionId: string;
    onChunk: (chunk: string) => void;
    onSessionId: (sessionId: string) => void;
  }): Promise<ChatRealtimeStreamResult> =>
    new Promise((resolve, reject) => {
      const url = resolveWebSocketEndpoint(wsBase, runtime.requestUrl, WS_ENDPOINTS.chat);
      const socket = new WebSocket(url);
      let fullText = "";
      let activeSessionId = input.sessionId;
      let settled = false;

      const finish = (result: ChatRealtimeStreamResult): void => {
        if (settled) {
          return;
        }
        settled = true;
        socket.close();
        resolve(result);
      };

      const fail = (reason: string): void => {
        if (settled) {
          return;
        }
        settled = true;
        socket.close();
        reject(new Error(reason));
      };

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            content: input.content,
            sessionId: input.sessionId,
          }),
        );
      };

      socket.onmessage = (event) => {
        if (typeof event.data !== "string") {
          return;
        }
        const payload = safeParseJson(event.data) as ChatSocketPayload | null;
        if (!payload || typeof payload !== "object") {
          return;
        }
        if (typeof payload.sessionId === "string" && payload.sessionId.length > 0) {
          activeSessionId = payload.sessionId;
          input.onSessionId(payload.sessionId);
        }
        switch (payload.type) {
          case "stream_chunk": {
            if (typeof payload.chunk === "string" && payload.chunk.length > 0) {
              fullText += payload.chunk;
              input.onChunk(payload.chunk);
            }
            break;
          }
          case "stream_end": {
            finish({ fullText, sessionId: activeSessionId });
            break;
          }
          case "error": {
            fail(typeof payload.message === "string" ? payload.message : "Chat stream failed");
            break;
          }
          default:
            break;
        }
      };

      socket.onerror = () => {
        fail("Chat WebSocket connection failed");
      };

      socket.onclose = () => {
        if (!settled) {
          fail("Chat WebSocket closed before stream completed");
        }
      };
    });

  return {
    sendStreamingMessage,
  };
}
