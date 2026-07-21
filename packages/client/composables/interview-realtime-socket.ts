import { WS_ENDPOINTS } from "@bao/shared/constants/endpoints";
import { safeParseJson } from "@bao/shared/utils/json";
import { resolveWebSocketEndpoint } from "~/utils/endpoints";

export type InterviewResponseFeedbackPayload = {
  type: "response_feedback";
  sessionId: string;
  feedback: {
    score: number;
    strengths: string[];
    improvements: string[];
    summary: string;
  } | null;
  error: string | null;
  questionIndex: number;
  isComplete: boolean;
  responseIndex: number;
};

type InterviewRealtimeMessage = {
  type: string;
  sessionId?: string;
  content?: string;
};

type InterviewSocketPayload = {
  type?: string;
  sessionId?: string;
  feedback?: InterviewResponseFeedbackPayload["feedback"];
  error?: string | null;
  questionIndex?: number;
  isComplete?: boolean;
  responseIndex?: number;
};

export type InterviewRealtimeSocket = {
  connect: () => void;
  disconnect: () => void;
  send: (payload: InterviewRealtimeMessage) => boolean;
  waitForOpen: () => Promise<boolean>;
  getSocket: () => WebSocket | null;
};

const toResponseFeedbackPayload = (raw: string): InterviewResponseFeedbackPayload | null => {
  const payload = safeParseJson(raw);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const record = payload as InterviewSocketPayload;
  if (record.type !== "response_feedback" || typeof record.sessionId !== "string") {
    return null;
  }
  return {
    type: "response_feedback",
    sessionId: record.sessionId,
    feedback: record.feedback ?? null,
    error: typeof record.error === "string" ? record.error : null,
    questionIndex: typeof record.questionIndex === "number" ? record.questionIndex : 0,
    isComplete: Boolean(record.isComplete),
    responseIndex: typeof record.responseIndex === "number" ? record.responseIndex : 0,
  };
};

/**
 * Low-level interview WS socket with response_feedback capture.
 */
export function createInterviewRealtimeSocket(input: {
  wsBase: string;
  requestUrl: URL;
  connected: Ref<boolean>;
  lastFeedback: Ref<InterviewResponseFeedbackPayload | null>;
}): InterviewRealtimeSocket {
  let socket: WebSocket | null = null;

  const connect = (): void => {
    if (
      socket &&
      (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    const url = resolveWebSocketEndpoint(input.wsBase, input.requestUrl, WS_ENDPOINTS.interview);
    socket = new WebSocket(url);
    socket.onopen = () => {
      input.connected.value = true;
    };
    socket.onmessage = (event) => {
      if (typeof event.data !== "string") {
        return;
      }
      const feedback = toResponseFeedbackPayload(event.data);
      if (feedback) {
        input.lastFeedback.value = feedback;
      }
    };
    socket.onclose = () => {
      input.connected.value = false;
      socket = null;
    };
    socket.onerror = () => {
      input.connected.value = false;
    };
  };

  const send = (payload: InterviewRealtimeMessage): boolean => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    socket.send(JSON.stringify(payload));
    return true;
  };

  const waitForOpen = (): Promise<boolean> =>
    new Promise((resolve) => {
      connect();
      if (socket?.readyState === WebSocket.OPEN) {
        resolve(true);
        return;
      }
      const pending = socket;
      if (!pending) {
        resolve(false);
        return;
      }
      const previousOnOpen = pending.onopen;
      pending.onopen = (event) => {
        if (typeof previousOnOpen === "function") {
          previousOnOpen.call(pending, event);
        }
        input.connected.value = true;
        resolve(true);
      };
      window.setTimeout(() => resolve(socket?.readyState === WebSocket.OPEN), 1500);
    });

  const disconnect = (): void => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
    socket = null;
    input.connected.value = false;
  };

  return {
    connect,
    disconnect,
    send,
    waitForOpen,
    getSocket: () => socket,
  };
}

export async function submitInterviewResponseViaWs(
  socketApi: InterviewRealtimeSocket,
  lastFeedback: Ref<InterviewResponseFeedbackPayload | null>,
  sessionId: string,
  content: string,
): Promise<InterviewResponseFeedbackPayload | null> {
  const opened = await socketApi.waitForOpen();
  if (!opened) {
    return null;
  }
  lastFeedback.value = null;
  if (!socketApi.send({ type: "submit_response", sessionId, content })) {
    return null;
  }
  return await new Promise<InterviewResponseFeedbackPayload | null>((resolve) => {
    const deadline = Date.now() + 20_000;
    const poll = (): void => {
      const feedback = lastFeedback.value;
      if (feedback && feedback.sessionId === sessionId) {
        resolve(feedback);
        return;
      }
      if (Date.now() >= deadline) {
        resolve(null);
        return;
      }
      window.setTimeout(poll, 50);
    };
    poll();
  });
}
