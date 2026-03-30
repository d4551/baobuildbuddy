import {
  APP_ROUTE_QUERY_KEYS,
  APP_ROUTES,
  INTERVIEW_MIN_RESPONSE_LENGTH,
} from "@bao/shared";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";

export type InterviewSessionFlowState =
  | "idle"
  | "loading"
  | "ready"
  | "submitting"
  | "completing"
  | "completed"
  | "error";

interface TimedInterviewSession {
  endTime?: number | null;
  id: string;
  startTime: number;
  status: string;
}

type Translate = (key: string, params?: Record<string, unknown>) => string;

type InterviewSessionActionsInput = {
  canComplete: ComputedRef<boolean>;
  canSubmit: ComputedRef<boolean>;
  completeSession: ReturnType<typeof useInterview>["completeSession"];
  completing: Ref<boolean>;
  currentQuestionIndex: ComputedRef<number>;
  currentSessionLoadId: Ref<number>;
  getSession: ReturnType<typeof useInterview>["getSession"];
  isLastQuestion: ComputedRef<boolean>;
  response: Ref<string>;
  router: ReturnType<typeof useRouter>;
  sessionId: ComputedRef<string>;
  sessionLoadError: Ref<string>;
  stt: ReturnType<typeof useSTT>;
  stopTimer: () => void;
  submitResponse: ReturnType<typeof useInterview>["submitResponse"];
  submitting: Ref<boolean>;
  syncCompletedSessionTime: (session: TimedInterviewSession) => void;
  startTimer: () => void;
  t: Translate;
  toast: ReturnType<typeof useNuxtApp>["$toast"];
};

export function normalizeSessionIdFromQuery(
  value: string | null | Array<string | null> | undefined,
): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (Array.isArray(value)) {
    const [firstValue] = value;
    return typeof firstValue === "string" ? firstValue.trim() : "";
  }
  return "";
}

function createInterviewHistoryAction(input: InterviewSessionActionsInput) {
  return async function goToHistory() {
    if (!input.sessionId.value) {
      return;
    }
    await input.router.push({
      path: APP_ROUTES.interviewHistory,
      query: {
        [APP_ROUTE_QUERY_KEYS.sessionId]: input.sessionId.value,
      },
    });
  };
}

function createInterviewLoadActions(input: InterviewSessionActionsInput) {
  async function loadSession(nextSessionId: string) {
    if (!nextSessionId) {
      input.stopTimer();
      input.sessionLoadError.value = input.t("interviewSession.notFound");
      return;
    }

    const requestId = ++input.currentSessionLoadId.value;
    input.sessionLoadError.value = "";
    input.response.value = "";

    const sessionResult = await settlePromise(
      input.getSession(nextSessionId),
      input.t("interviewSession.notFound"),
    );
    if (requestId !== input.currentSessionLoadId.value) {
      return;
    }

    if (!sessionResult.ok) {
      input.sessionLoadError.value = getErrorMessage(
        sessionResult.error,
        input.t("interviewSession.notFound"),
      );
      input.stopTimer();
      return;
    }

    const loadedSession = sessionResult.value;
    if (!loadedSession || loadedSession.id !== nextSessionId) {
      input.sessionLoadError.value = input.t("interviewSession.notFound");
      input.stopTimer();
      return;
    }

    if (loadedSession.status === "completed" || loadedSession.status === "cancelled") {
      input.stopTimer();
      input.syncCompletedSessionTime(loadedSession);
      return;
    }

    input.startTimer();
  }

  async function retryLoadSession() {
    await loadSession(input.sessionId.value);
  }

  return {
    loadSession,
    retryLoadSession,
  };
}

function createInterviewCompletionAction(
  input: InterviewSessionActionsInput,
  goToHistory: () => Promise<void>,
) {
  return async function handleCompleteInterview() {
    if (!(input.canComplete.value && input.sessionId.value)) {
      return;
    }

    input.stopTimer();
    input.completing.value = true;
    const completionResult = await settlePromise(
      input.completeSession(input.sessionId.value),
      input.t("interviewSession.errors.completeFailed"),
    );
    input.completing.value = false;

    if (!completionResult.ok) {
      input.toast.error(
        getErrorMessage(completionResult.error, input.t("interviewSession.errors.completeFailed")),
      );
      input.startTimer();
      return;
    }

    input.toast.success(input.t("interviewSession.toasts.completed"));
    await goToHistory();
  };
}

function createInterviewSubmissionAction(input: {
  actions: InterviewSessionActionsInput;
  goToHistory: () => Promise<void>;
  handleCompleteInterview: () => Promise<void>;
}) {
  return async function handleSubmitResponse(submittedResponse?: string) {
    if (!(input.actions.canSubmit.value && input.actions.sessionId.value)) {
      return;
    }

    const responseText =
      typeof submittedResponse === "string"
        ? submittedResponse.trim()
        : input.actions.response.value.trim();
    if (responseText.length < INTERVIEW_MIN_RESPONSE_LENGTH) {
      input.actions.toast.error(
        input.actions.t("interviewSession.errors.minResponseLength", {
          count: INTERVIEW_MIN_RESPONSE_LENGTH,
        }),
      );
      return;
    }

    input.actions.submitting.value = true;
    const submitResult = await settlePromise(
      input.actions.submitResponse(input.actions.sessionId.value, {
        questionIndex: input.actions.currentQuestionIndex.value,
        response: responseText,
      }),
      input.actions.t("interviewSession.errors.submitFailed"),
    );
    input.actions.submitting.value = false;

    if (!submitResult.ok) {
      input.actions.toast.error(
        getErrorMessage(
          submitResult.error,
          input.actions.t("interviewSession.errors.submitFailed"),
        ),
      );
      return;
    }

    input.actions.stt.stopListening();
    input.actions.response.value = "";
    input.actions.toast.success(input.actions.t("interviewSession.toasts.responseRecorded"));

    if (submitResult.value?.status === "completed") {
      input.actions.toast.success(input.actions.t("interviewSession.toasts.completed"));
      await input.goToHistory();
      return;
    }

    if (input.actions.isLastQuestion.value) {
      await input.handleCompleteInterview();
    }
  };
}

export function createInterviewSessionActions(input: InterviewSessionActionsInput) {
  const goToHistory = createInterviewHistoryAction(input);
  const loadActions = createInterviewLoadActions(input);
  const handleCompleteInterview = createInterviewCompletionAction(input, goToHistory);
  const handleSubmitResponse = createInterviewSubmissionAction({
    actions: input,
    goToHistory,
    handleCompleteInterview,
  });

  return {
    goToHistory,
    handleCompleteInterview,
    handleSubmitResponse,
    loadSession: loadActions.loadSession,
    retryLoadSession: loadActions.retryLoadSession,
  };
}
