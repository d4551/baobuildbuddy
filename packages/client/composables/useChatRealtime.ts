import { useRuntimeConfig } from "#imports";
import { useClientApiRequestRuntime } from "~/composables/api-request";
import {
  type ChatRealtimeStreamInput,
  type ChatRealtimeStreamResult,
  openChatRealtimeStream,
} from "~/composables/chat-realtime-stream";

/**
 * Live chat WebSocket client for WS_ENDPOINTS.chat.
 * Streams assistant tokens into the UI; HTTP remains fallback when WS is unavailable.
 */
export function useChatRealtime() {
  const runtime = useClientApiRequestRuntime();
  const config = useRuntimeConfig();
  const wsBase = String(config.public.wsBase || config.public.apiBase || "/");

  const sendStreamingMessage = (
    input: ChatRealtimeStreamInput,
  ): Promise<ChatRealtimeStreamResult> => openChatRealtimeStream(wsBase, runtime.requestUrl, input);

  return {
    sendStreamingMessage,
  };
}
