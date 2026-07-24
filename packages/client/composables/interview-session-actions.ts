import { INTERVIEW_MIN_RESPONSE_LENGTH } from "@bao/shared/constants/interview";
import { APP_ROUTE_QUERY_KEYS, APP_ROUTES } from "@bao/shared/constants/routes";
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

type Translate = (key: string, params?: Record<string, string | number>) => string;

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
  /** WS-first submit; returns true when WS path handled the write. */
  submitViaWs?: (sessionId: string, content: string) => Promise<boolean>;
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

    // HTTP complete is sole path — never also WS end_session (double-complete ban).
    input.toast.success(input.t("interviewSession.toasts.completed"));
    await goToHistory();
  };
}

const submitInterviewResponseHttp = async (
  actions: InterviewSessionActionsInput,
  responseText: string,
): Promise<"failed" | "completed" | "continued"> => {
  const submitResult = await settlePromise(
    actions.submitResponse(actions.sessionId.value, {
      questionIndex: actions.currentQuestionIndex.value,
      response: responseText,
    }),
    actions.t("interviewSession.errors.submitFailed"),
  );
  if (!submitResult.ok) {
    actions.toast.error(
      getErrorMessage(submitResult.error, actions.t("interviewSession.errors.submitFailed")),
    );
    return "failed";
  }
  return submitResult.value?.status === "completed" ? "completed" : "continued";
};

const refreshInterviewSessionAfterWs = async (
  actions: InterviewSessionActionsInput,
): Promise<void> => {
  await settlePromise(
    actions.getSession(actions.sessionId.value),
    actions.t("interviewSession.errors.submitFailed"),
  );
};

const resolveInterviewResponseText = (
  actions: InterviewSessionActionsInput,
  submittedResponse?: string,
): string =>
  typeof submittedResponse === "string" ? submittedResponse.trim() : actions.response.value.trim();

const deliverInterviewResponse = async (
  actions: InterviewSessionActionsInput,
  responseText: string,
): Promise<"failed" | "completed" | "continued"> => {
  const wsHandled = actions.submitViaWs
    ? await actions.submitViaWs(actions.sessionId.value, responseText)
    : false;
  if (wsHandled) {
    await refreshInterviewSessionAfterWs(actions);
    return "continued";
  }
  return submitInterviewResponseHttp(actions, responseText);
};

const finishInterviewSubmission = async (input: {
  actions: InterviewSessionActionsInput;
  goToHistory: () => Promise<void>;
  handleCompleteInterview: () => Promise<void>;
  completedViaHttp: boolean;
}): Promise<void> => {
  input.actions.stt.stopListening();
  input.actions.response.value = "";
  input.actions.toast.success(input.actions.t("interviewSession.toasts.responseRecorded"));
  if (input.completedViaHttp) {
    input.actions.toast.success(input.actions.t("interviewSession.toasts.completed"));
    await input.goToHistory();
    return;
  }
  if (input.actions.isLastQuestion.value) {
    await input.handleCompleteInterview();
  }
};

function createInterviewSubmissionAction(input: {
  actions: InterviewSessionActionsInput;
  goToHistory: () => Promise<void>;
  handleCompleteInterview: () => Promise<void>;
}) {
  return async function handleSubmitResponse(submittedResponse?: string) {
    if (!(input.actions.canSubmit.value && input.actions.sessionId.value)) {
      return;
    }

    const responseText = resolveInterviewResponseText(input.actions, submittedResponse);
    if (responseText.length < INTERVIEW_MIN_RESPONSE_LENGTH) {
      input.actions.toast.error(
        input.actions.t("interviewSession.errors.minResponseLength", {
          count: INTERVIEW_MIN_RESPONSE_LENGTH,
        }),
      );
      return;
    }

    input.actions.submitting.value = true;
    const deliverResult = await deliverInterviewResponse(input.actions, responseText);
    if (deliverResult === "failed") {
      input.actions.submitting.value = false;
      return;
    }
    input.actions.submitting.value = false;

    await finishInterviewSubmission({
      actions: input.actions,
      goToHistory: input.goToHistory,
      handleCompleteInterview: input.handleCompleteInterview,
      completedViaHttp: deliverResult === "completed",
    });
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
