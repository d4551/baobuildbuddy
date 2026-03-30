import { APP_ROUTE_QUERY_KEYS, INTERVIEW_MIN_RESPONSE_LENGTH } from "@bao/shared";
import { onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import {
  createInterviewSessionActions,
  normalizeSessionIdFromQuery,
  type InterviewSessionFlowState as SessionFlowState,
} from "~/composables/interview-session-actions";
import { createInterviewSessionTimer } from "~/composables/interview-session-timer";

function createInterviewSessionState() {
  const route = useRoute();
  const router = useRouter();
  const { currentSession, loading, getSession, submitResponse, completeSession } = useInterview();
  const { $toast } = useNuxtApp();
  const { t } = useI18n();
  const { getAlertClass } = useScoreColor();

  const voiceSettings = computed(() => currentSession.value?.config?.voiceSettings);
  const tts = useTTS(voiceSettings);
  const stt = useSTT(voiceSettings);
  const currentSessionLoadId = ref(0);
  const sessionLoadError = ref("");
  const response = ref("");
  const submitting = ref(false);
  const completing = ref(false);

  return {
    completeSession,
    completing,
    currentSession,
    currentSessionLoadId,
    getAlertClass,
    getSession,
    loading,
    response,
    route,
    router,
    sessionLoadError,
    stt,
    submitResponse,
    submitting,
    t,
    targetJob: computed(() => currentSession.value?.config?.targetJob),
    toast: $toast,
    tts,
  };
}

function createInterviewSessionQuestions(
  activeSession: ComputedRef<ReturnType<typeof useInterview>["currentSession"]["value"] | null>,
  currentQuestionIndex: ComputedRef<number>,
) {
  const currentQuestion = computed(
    () => activeSession.value?.questions?.[Math.max(0, currentQuestionIndex.value)],
  );
  const hasCurrentQuestion = computed(() => Boolean(currentQuestion.value));
  const chatQuestions = computed<{ id: string; text: string }[]>(() => {
    const session = activeSession.value;
    return session
      ? session.questions.map((question) => ({ id: question.id, text: question.question }))
      : [];
  });
  const chatResponses = computed(() => {
    const session = activeSession.value;
    if (!session) {
      return [] as { questionId: string; text: string }[];
    }

    const responseByQuestion = new Map<string, string>();
    for (const sessionResponse of session.responses) {
      responseByQuestion.set(sessionResponse.questionId, sessionResponse.transcript);
    }

    return session.questions.flatMap((question) => {
      const responseText = responseByQuestion.get(question.id);
      return responseText ? [{ questionId: question.id, text: responseText }] : [];
    });
  });

  return {
    chatQuestions,
    chatResponses,
    currentQuestion,
    hasCurrentQuestion,
  };
}

function createInterviewSessionStatus(input: {
  activeSession: ComputedRef<ReturnType<typeof useInterview>["currentSession"]["value"] | null>;
  currentQuestionIndex: ComputedRef<number>;
  loading: Ref<boolean>;
  response: Ref<string>;
  sessionId: ComputedRef<string>;
  sessionLoadError: Ref<string>;
  stt: ReturnType<typeof useSTT>;
  submitting: Ref<boolean>;
  completing: Ref<boolean>;
  t: ReturnType<typeof useI18n>["t"];
  totalQuestions: ComputedRef<number>;
  hasCurrentQuestion: ComputedRef<boolean>;
}) {
  const activeSessionComplete = computed(() => input.activeSession.value?.status === "completed");
  const activeSessionReady = computed(
    () =>
      input.activeSession.value !== null &&
      input.activeSession.value.status !== "cancelled" &&
      input.activeSession.value.status !== "completed",
  );
  const isBusy = computed(
    () =>
      input.loading.value ||
      input.submitting.value ||
      input.completing.value ||
      input.stt.isListening.value,
  );
  const isLastQuestion = computed(
    () =>
      input.hasCurrentQuestion.value &&
      input.currentQuestionIndex.value >= input.totalQuestions.value - 1,
  );
  const completionState = computed<SessionFlowState>(() => {
    if (!input.sessionId.value) return "idle";
    if (input.sessionLoadError.value.length > 0) return "error";
    if (!input.activeSession.value) return input.loading.value ? "loading" : "error";
    if (activeSessionComplete.value) return "completed";
    if (input.completing.value) return "completing";
    if (input.submitting.value) return "submitting";
    return "ready";
  });
  const canSubmit = computed(
    () =>
      input.hasCurrentQuestion.value &&
      input.response.value.trim().length >= INTERVIEW_MIN_RESPONSE_LENGTH &&
      !isBusy.value &&
      activeSessionReady.value,
  );
  const canComplete = computed(
    () => input.activeSession.value !== null && !activeSessionComplete.value && !isBusy.value,
  );

  return {
    canComplete,
    canSubmit,
    completionState,
    isLastQuestion,
  };
}

function createInterviewSessionDerivedState(input: ReturnType<typeof createInterviewSessionState>) {
  const sessionState = createInterviewSessionIdentity(input);
  const questionState = createInterviewSessionQuestions(
    sessionState.activeSession,
    sessionState.currentQuestionIndex,
  );
  const statusState = createInterviewSessionStatus({
    activeSession: sessionState.activeSession,
    completing: input.completing,
    currentQuestionIndex: sessionState.currentQuestionIndex,
    hasCurrentQuestion: questionState.hasCurrentQuestion,
    loading: input.loading,
    response: input.response,
    sessionId: sessionState.sessionId,
    sessionLoadError: input.sessionLoadError,
    stt: input.stt,
    submitting: input.submitting,
    t: input.t,
    totalQuestions: sessionState.totalQuestions,
  });
  const progressState = createInterviewSessionProgressState({
    activeSession: sessionState.activeSession,
    currentQuestionIndex: sessionState.currentQuestionIndex,
    isLastQuestion: statusState.isLastQuestion,
    t: input.t,
    totalQuestions: sessionState.totalQuestions,
  });

  return {
    ...questionState,
    ...progressState,
    activeSession: sessionState.activeSession,
    canComplete: statusState.canComplete,
    canSubmit: statusState.canSubmit,
    canUseVoice: sessionState.canUseVoice,
    completionState: statusState.completionState,
    currentQuestionIndex: sessionState.currentQuestionIndex,
    enableVoiceMode: sessionState.enableVoiceMode,
    isLastQuestion: statusState.isLastQuestion,
    sessionId: sessionState.sessionId,
    totalQuestions: sessionState.totalQuestions,
  };
}

function createInterviewSessionIdentity(input: ReturnType<typeof createInterviewSessionState>) {
  const sessionId = computed(() =>
    normalizeSessionIdFromQuery(input.route.query[APP_ROUTE_QUERY_KEYS.id]),
  );
  const activeSession = computed(() => {
    const id = sessionId.value;
    if (!id) {
      return null;
    }
    const session = input.currentSession.value;
    if (!session || session.id !== id) {
      return null;
    }
    return session;
  });
  const enableVoiceMode = computed(() => activeSession.value?.config?.enableVoiceMode ?? false);
  const totalQuestions = computed(() => activeSession.value?.questions.length ?? 0);
  const currentQuestionIndex = computed(() => activeSession.value?.currentQuestionIndex ?? 0);
  const canUseVoice = computed(() => enableVoiceMode.value && input.stt.isSupported.value);

  return {
    activeSession,
    canUseVoice,
    currentQuestionIndex,
    enableVoiceMode,
    sessionId,
    totalQuestions,
  };
}

function createInterviewSessionProgressState(input: {
  activeSession: ComputedRef<ReturnType<typeof useInterview>["currentSession"]["value"] | null>;
  currentQuestionIndex: ComputedRef<number>;
  isLastQuestion: ComputedRef<boolean>;
  t: ReturnType<typeof useI18n>["t"];
  totalQuestions: ComputedRef<number>;
}) {
  const progress = computed(() => {
    if (!(input.totalQuestions.value && input.activeSession.value)) {
      return 0;
    }
    const current = Math.min(input.currentQuestionIndex.value, input.totalQuestions.value - 1);
    return ((current + 1) / input.totalQuestions.value) * 100;
  });
  const displayQuestionIndex = computed(() =>
    input.totalQuestions.value === 0
      ? 0
      : Math.min(input.currentQuestionIndex.value + 1, input.totalQuestions.value),
  );
  const submitButtonLabelKey = computed(() =>
    input.isLastQuestion.value
      ? "interviewSession.submitFinishButton"
      : "interviewSession.submitNextButton",
  );
  const chatSubmitHint = computed(() =>
    input.t("interviewSession.minResponseHint", { count: INTERVIEW_MIN_RESPONSE_LENGTH }),
  );
  const sessionProgressLabel = computed(() =>
    input.t("interviewSession.progressLabel", {
      current: displayQuestionIndex.value,
      total: input.totalQuestions.value,
    }),
  );

  return {
    chatSubmitHint,
    displayQuestionIndex,
    progress,
    sessionProgressLabel,
    submitButtonLabelKey,
  };
}

function registerInterviewSessionWatchers(input: {
  actions: ReturnType<typeof createInterviewSessionActions>;
  derived: ReturnType<typeof createInterviewSessionDerivedState>;
  response: Ref<string>;
  stt: ReturnType<typeof useSTT>;
  timer: ReturnType<typeof createInterviewSessionTimer>;
  tts: ReturnType<typeof useTTS>;
}) {
  watch(
    () => input.derived.sessionId.value,
    async (nextSessionId) => {
      await input.actions.loadSession(nextSessionId);
    },
    { immediate: true },
  );
  watch(
    () => input.derived.activeSession.value?.status,
    (status) => {
      if (!status || status === "completed" || status === "cancelled") {
        input.timer.stopTimer();
        return;
      }
      if (status === "active" || status === "preparing" || status === "paused") {
        input.timer.startTimer();
      }
    },
  );
  watch(
    () => input.derived.currentQuestion.value?.question,
    (question) => {
      if (input.derived.enableVoiceMode.value && question && input.tts.isSupported.value) {
        input.tts.speak(question);
      }
    },
    { immediate: true },
  );
  watch(
    () => input.stt.fullTranscript.value,
    (transcript) => {
      if (input.derived.canUseVoice.value && transcript) {
        input.response.value = transcript;
      }
    },
  );
}

function buildInterviewSessionViewModel(input: {
  actions: ReturnType<typeof createInterviewSessionActions>;
  derived: ReturnType<typeof createInterviewSessionDerivedState>;
  state: ReturnType<typeof createInterviewSessionState>;
  timer: ReturnType<typeof createInterviewSessionTimer>;
}) {
  return {
    activeSession: input.derived.activeSession,
    canComplete: input.derived.canComplete,
    canUseVoice: input.derived.canUseVoice,
    chatQuestions: input.derived.chatQuestions,
    chatResponses: input.derived.chatResponses,
    chatSubmitHint: input.derived.chatSubmitHint,
    completing: input.state.completing,
    completionState: input.derived.completionState,
    currentQuestion: input.derived.currentQuestion,
    currentQuestionIndex: input.derived.currentQuestionIndex,
    elapsedTimeAriaLabel: input.timer.elapsedTimeAriaLabel,
    elapsedTimeDuration: input.timer.elapsedTimeDuration,
    elapsedTimeText: input.timer.elapsedTimeText,
    getAlertClass: input.state.getAlertClass,
    goToHistory: input.actions.goToHistory,
    handleCompleteInterview: input.actions.handleCompleteInterview,
    handleSubmitResponse: input.actions.handleSubmitResponse,
    progress: input.derived.progress,
    response: input.state.response,
    retryLoadSession: input.actions.retryLoadSession,
    sessionId: input.derived.sessionId,
    sessionLoadError: input.state.sessionLoadError,
    sessionProgressLabel: input.derived.sessionProgressLabel,
    stt: input.state.stt,
    submitButtonLabelKey: input.derived.submitButtonLabelKey,
    submitting: input.state.submitting,
    targetJob: input.state.targetJob,
    tts: input.state.tts,
  };
}

export function useInterviewSessionPage() {
  const state = createInterviewSessionState();
  const derived = createInterviewSessionDerivedState(state);
  const timer = createInterviewSessionTimer({
    activeSession: derived.activeSession,
    t: state.t,
  });
  const actions = createInterviewSessionActions({
    canComplete: derived.canComplete,
    canSubmit: derived.canSubmit,
    completeSession: state.completeSession,
    completing: state.completing,
    currentQuestionIndex: derived.currentQuestionIndex,
    currentSessionLoadId: state.currentSessionLoadId,
    getSession: state.getSession,
    isLastQuestion: derived.isLastQuestion,
    response: state.response,
    router: state.router,
    sessionId: derived.sessionId,
    sessionLoadError: state.sessionLoadError,
    stt: state.stt,
    stopTimer: timer.stopTimer,
    submitResponse: state.submitResponse,
    submitting: state.submitting,
    syncCompletedSessionTime: timer.syncCompletedSessionTime,
    startTimer: timer.startTimer,
    t: state.t,
    toast: state.toast,
  });

  registerInterviewSessionWatchers({
    actions,
    derived,
    response: state.response,
    stt: state.stt,
    timer,
    tts: state.tts,
  });

  onUnmounted(() => {
    timer.stopTimer();
    state.tts.cancel();
    state.stt.stopListening();
  });

  return buildInterviewSessionViewModel({
    actions,
    derived,
    state,
    timer,
  });
}
