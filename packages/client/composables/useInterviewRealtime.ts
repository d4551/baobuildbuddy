import { useRuntimeConfig } from "#imports";
import { useClientApiRequestRuntime } from "~/composables/api-request";
import {
  createInterviewRealtimeSocket,
  type InterviewResponseFeedbackPayload,
  submitInterviewResponseViaWs,
} from "~/composables/interview-realtime-socket";

export type { InterviewResponseFeedbackPayload } from "~/composables/interview-realtime-socket";

/**
 * Interview coaching WS — WS-or-HTTP single path (never both).
 * submitViaWs writes once on the server and returns response_feedback.
 */
export function useInterviewRealtime() {
  const runtime = useClientApiRequestRuntime();
  const config = useRuntimeConfig();
  const wsBase = String(config.public.wsBase || config.public.apiBase || "/");
  const connected = ref(false);
  const lastFeedback = ref<InterviewResponseFeedbackPayload | null>(null);

  const socketApi = createInterviewRealtimeSocket({
    wsBase,
    requestUrl: runtime.requestUrl,
    connected,
    lastFeedback,
  });

  const submitViaWs = (sessionId: string, content: string) =>
    submitInterviewResponseViaWs(socketApi, lastFeedback, sessionId, content);

  onUnmounted(() => {
    socketApi.disconnect();
  });

  return {
    connect: socketApi.connect,
    connected: readonly(connected),
    disconnect: socketApi.disconnect,
    lastFeedback: readonly(lastFeedback),
    submitViaWs,
  };
}
