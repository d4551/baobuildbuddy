import { WS_ENDPOINTS } from "@bao/shared/constants/endpoints";
import { safeParseJson } from "@bao/shared/utils/json";
import {
  INTERVIEW_SOCKET_ACK_DEADLINE_MS,
  INTERVIEW_SOCKET_ACK_POLL_MS,
  INTERVIEW_SOCKET_OPEN_WAIT_MS,
} from "~/constants/numeric-ui";
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

function parseResponseFeedback(raw: string): InterviewResponseFeedbackPayload | null {
  const payload = safeParseJson(raw) as InterviewSocketPayload | null;
  if (!payload || typeof payload !== "object" || payload.type !== "response_feedback") {
    return null;
  }
  if (typeof payload.sessionId !== "string") {
    return null;
  }
  return {
    type: "response_feedback",
    sessionId: payload.sessionId,
    feedback: payload.feedback ?? null,
    error: typeof payload.error === "string" ? payload.error : null,
    questionIndex: typeof payload.questionIndex === "number" ? payload.questionIndex : 0,
    isComplete: Boolean(payload.isComplete),
    responseIndex: typeof payload.responseIndex === "number" ? payload.responseIndex : 0,
  };
}

function bindSocketHandlers(
  socket: WebSocket,
  connected: Ref<boolean>,
  lastFeedback: Ref<InterviewResponseFeedbackPayload | null>,
): void {
  socket.onopen = () => {
    connected.value = true;
  };
  socket.onmessage = (event) => {
    if (typeof event.data !== "string") {
      return;
    }
    const feedback = parseResponseFeedback(event.data);
    if (feedback) {
      lastFeedback.value = feedback;
    }
  };
  socket.onclose = () => {
    connected.value = false;
  };
  socket.onerror = () => {
    connected.value = false;
  };
}

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
    bindSocketHandlers(socket, input.connected, input.lastFeedback);
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
      window.setTimeout(
        () => resolve(socket?.readyState === WebSocket.OPEN),
        INTERVIEW_SOCKET_OPEN_WAIT_MS,
      );
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

function waitForSessionFeedback(
  lastFeedback: Ref<InterviewResponseFeedbackPayload | null>,
  sessionId: string,
): Promise<InterviewResponseFeedbackPayload | null> {
  return new Promise<InterviewResponseFeedbackPayload | null>((resolve) => {
    const deadline = Date.now() + INTERVIEW_SOCKET_ACK_DEADLINE_MS;
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
      window.setTimeout(poll, INTERVIEW_SOCKET_ACK_POLL_MS);
    };
    poll();
  });
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
  return await waitForSessionFeedback(lastFeedback, sessionId);
}
