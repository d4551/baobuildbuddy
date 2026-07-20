import { WS_ENDPOINTS } from "@bao/shared/constants/endpoints";
import { useRuntimeConfig } from "#imports";
import { useClientApiRequestRuntime } from "~/composables/api-request";
import { resolveWebSocketEndpoint } from "~/utils/endpoints";

type InterviewRealtimeMessage = {
  type: string;
  sessionId?: string;
  content?: string;
};

/**
 * Thin interview coaching WS client — fabric for WS_ENDPOINTS.interview.
 * HTTP remains source of truth; WS mirrors submit/end for live coaching.
 */
export function useInterviewRealtime() {
  const runtime = useClientApiRequestRuntime();
  const config = useRuntimeConfig();
  const wsBase = String(config.public.wsBase || config.public.apiBase || "/");
  let socket: WebSocket | null = null;
  const connected = ref(false);

  const connect = (): void => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const url = resolveWebSocketEndpoint(wsBase, runtime.requestUrl, WS_ENDPOINTS.interview);
    socket = new WebSocket(url);
    socket.onopen = () => {
      connected.value = true;
    };
    socket.onclose = () => {
      connected.value = false;
      socket = null;
    };
    socket.onerror = () => {
      connected.value = false;
    };
  };

  const send = (payload: InterviewRealtimeMessage): boolean => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    socket.send(JSON.stringify(payload));
    return true;
  };

  const mirrorSubmitResponse = (sessionId: string, content: string): void => {
    connect();
    if (send({ type: "submit_response", sessionId, content })) {
      return;
    }
    // Socket still opening — queue one retry after open.
    const pending = socket;
    if (!pending) {
      return;
    }
    const previousOnOpen = pending.onopen;
    pending.onopen = (event) => {
      if (typeof previousOnOpen === "function") {
        previousOnOpen.call(pending, event);
      }
      connected.value = true;
      send({ type: "submit_response", sessionId, content });
    };
  };

  const mirrorEndSession = (sessionId: string): void => {
    connect();
    send({ type: "end_session", sessionId });
  };

  const disconnect = (): void => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
    socket = null;
    connected.value = false;
  };

  onUnmounted(() => {
    disconnect();
  });

  return {
    connect,
    connected: readonly(connected),
    disconnect,
    mirrorEndSession,
    mirrorSubmitResponse,
  };
}
