<script setup lang="ts">
import { APP_ROUTES, APP_ROUTE_QUERY_KEYS, INTERVIEW_MIN_RESPONSE_LENGTH } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { onUnmounted } from "vue";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";

type InterviewSessionFlowState =
  | "idle"
  | "loading"
  | "ready"
  | "submitting"
  | "completing"
  | "completed"
  | "error";

const SESSION_TIMER_INTERVAL_MS = 1000;
const SECONDS_PER_MINUTE = 60;
const DEFAULT_TIMER_VALUE = 0;
const TIMER_DISPLAY_DIGITS = 2;
const TIMER_DURATION_PREFIX = "PT";
const TIMER_MINUTE_SUFFIX = "M";
const TIMER_SECOND_SUFFIX = "S";

const route = useRoute();
const router = useRouter();
const { currentSession, loading, getSession, submitResponse, completeSession } = useInterview();
const { $toast } = useNuxtApp();
const { t } = useI18n();
const sessionId = computed(() => normalizeSessionIdFromQuery(route.query[APP_ROUTE_QUERY_KEYS.id]));
const voiceSettings = computed(() => currentSession.value?.config?.voiceSettings);
const tts = useTTS(voiceSettings);
const stt = useSTT(voiceSettings);

const currentSessionLoadId = ref(0);
const sessionLoadError = ref("");
const response = ref("");
const submitting = ref(false);
const completing = ref(false);
const timeElapsed = ref(DEFAULT_TIMER_VALUE);
const timer = ref<ReturnType<typeof setInterval> | null>(null);

const activeSession = computed(() => {
  const id = sessionId.value;
  if (!id) return null;

  const session = currentSession.value;
  if (!session || session.id !== id) return null;

  return session;
});
const enableVoiceMode = computed(() => activeSession.value?.config?.enableVoiceMode ?? false);
const targetJob = computed(() => activeSession.value?.config?.targetJob);
const totalQuestions = computed(() => activeSession.value?.questions.length ?? 0);
const currentQuestionIndex = computed(() => activeSession.value?.currentQuestionIndex ?? 0);
const currentQuestion = computed(() =>
  activeSession.value?.questions?.[Math.max(0, currentQuestionIndex.value)],
);
const hasCurrentQuestion = computed(() => Boolean(currentQuestion.value));
const activeSessionComplete = computed(() => activeSession.value?.status === "completed");
const activeSessionReady = computed(() =>
  activeSession.value !== null &&
  activeSession.value.status !== "cancelled" &&
  activeSession.value.status !== "completed",
);
const isBusy = computed(
  () => loading.value || submitting.value || completing.value || stt.isListening.value,
);

const progress = computed(() => {
  if (!totalQuestions.value || !activeSession.value) return 0;
  const current = Math.min(currentQuestionIndex.value, totalQuestions.value - 1);
  return ((current + 1) / totalQuestions.value) * 100;
});
const isLastQuestion = computed(
  () => hasCurrentQuestion.value && currentQuestionIndex.value >= totalQuestions.value - 1,
);

const completionState = computed<InterviewSessionFlowState>(() => {
  if (!sessionId.value) return "idle";
  if (sessionLoadError.value.length > 0) return "error";
  if (!activeSession.value) return loading.value ? "loading" : "error";
  if (activeSessionComplete.value) return "completed";
  if (completing.value) return "completing";
  if (submitting.value) return "submitting";
  return "ready";
});

const canSubmit = computed(() => {
  return (
    hasCurrentQuestion.value &&
    response.value.trim().length >= INTERVIEW_MIN_RESPONSE_LENGTH &&
    !isBusy.value &&
    activeSessionReady.value
  );
});
const canComplete = computed(() => activeSession.value !== null && !activeSessionComplete.value && !isBusy.value);
const canUseVoice = computed(() => enableVoiceMode.value && stt.isSupported.value);
const elapsedMinutes = computed(() => Math.floor(timeElapsed.value / SECONDS_PER_MINUTE));
const elapsedSeconds = computed(() => timeElapsed.value % SECONDS_PER_MINUTE);
const formattedElapsedMinutes = computed(() =>
  String(elapsedMinutes.value).padStart(TIMER_DISPLAY_DIGITS, "0"),
);
const formattedElapsedSeconds = computed(() =>
  String(elapsedSeconds.value).padStart(TIMER_DISPLAY_DIGITS, "0"),
);
const elapsedTimeText = computed(
  () => `${formattedElapsedMinutes.value}:${formattedElapsedSeconds.value}`,
);
const elapsedTimeAriaLabel = computed(() =>
  t("interviewSession.timeAria", {
    minutes: elapsedMinutes.value,
    seconds: elapsedSeconds.value,
  }),
);
const elapsedTimeDuration = computed(
  () =>
    `${TIMER_DURATION_PREFIX}${elapsedMinutes.value}${TIMER_MINUTE_SUFFIX}${elapsedSeconds.value}${TIMER_SECOND_SUFFIX}`,
);
const displayQuestionIndex = computed(() =>
  totalQuestions.value === 0 ? 0 : Math.min(currentQuestionIndex.value + 1, totalQuestions.value),
);

const chatQuestions = computed<{ id: string; text: string }[]>(() => {
  const session = activeSession.value;
  if (!session) {
    return [];
  }

  return session.questions.map((question) => ({
    id: question.id,
    text: question.question,
  }));
});
const chatResponses = computed(() => {
  type SessionChatResponse = {
    questionId: string;
    text: string;
  };

  const session = activeSession.value;
  if (!session) {
    return [] as SessionChatResponse[];
  }

  const responseByQuestion = new Map<string, string>();
  for (const response of session.responses) {
    responseByQuestion.set(response.questionId, response.transcript);
  }

  const responses: SessionChatResponse[] = [];
  for (const question of session.questions) {
    const responseText = responseByQuestion.get(question.id);
    if (responseText) {
      responses.push({ questionId: question.id, text: responseText });
    }
  }

  return responses;
});
const submitButtonLabelKey = computed(() =>
  isLastQuestion.value ? "interviewSession.submitFinishButton" : "interviewSession.submitNextButton",
);
const chatSubmitHint = computed(() =>
  t("interviewSession.minResponseHint", {
    count: INTERVIEW_MIN_RESPONSE_LENGTH,
  }),
);
const sessionProgressLabel = computed(() =>
  t("interviewSession.progressLabel", {
    current: displayQuestionIndex.value,
    total: totalQuestions.value,
  }),
);

async function retryLoadSession() {
  await loadSession(sessionId.value);
}

async function loadSession(nextSessionId: string) {
  if (!nextSessionId) {
    stopTimer();
    sessionLoadError.value = t("interviewSession.notFound");
    return;
  }

  const requestId = ++currentSessionLoadId.value;
  sessionLoadError.value = "";
  response.value = "";

  const sessionResult = await settlePromise(
    getSession(nextSessionId),
    t("interviewSession.notFound"),
  );
  if (requestId !== currentSessionLoadId.value) {
    return;
  }

  if (!sessionResult.ok) {
    sessionLoadError.value = getErrorMessage(sessionResult.error, t("interviewSession.notFound"));
    stopTimer();
    return;
  }

  const loadedSession = sessionResult.value;
  if (!loadedSession || loadedSession.id !== nextSessionId) {
    sessionLoadError.value = t("interviewSession.notFound");
    stopTimer();
    return;
  }

  if (loadedSession.status === "completed" || loadedSession.status === "cancelled") {
    stopTimer();
    timeElapsed.value = estimateElapsedTime(DEFAULT_TIMER_VALUE, loadedSession.startTime, loadedSession.endTime);
    return;
  }

  startTimer();
}

watch(
  () => sessionId.value,
  (nextSessionId) => {
    void loadSession(nextSessionId);
  },
  { immediate: true },
);

watch(
  () => activeSession.value?.status,
  (status) => {
    if (!status || status === "completed" || status === "cancelled") {
      stopTimer();
      return;
    }
    if (status === "active" || status === "preparing" || status === "paused") {
      startTimer();
    }
  },
);

watch(
  () => currentQuestion.value?.question,
  (question) => {
    if (enableVoiceMode.value && question && tts.isSupported.value) {
      tts.speak(question);
    }
  },
  { immediate: true },
);

watch(
  () => stt.fullTranscript.value,
  (transcript) => {
    if (canUseVoice.value && transcript) {
      response.value = transcript;
    }
  },
);

onUnmounted(() => {
  stopTimer();
  tts.cancel();
  stt.stopListening();
});

function normalizeSessionIdFromQuery(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const firstValue = value[0];
    return typeof firstValue === "string" ? firstValue.trim() : "";
  }

  return "";
}

function estimateElapsedTime(
  fallbackSeconds: number,
  startTime: number | undefined,
  endTime?: number | null,
): number {
  if (!startTime) {
    return fallbackSeconds;
  }

  const start = Number.isFinite(startTime) ? startTime : fallbackSeconds;
  const end = Number.isFinite(endTime ?? Number.NaN) ? endTime : Date.now();
  const rawSeconds = Math.floor((end - start) / 1000);
  return Math.max(0, rawSeconds);
}

function stopTimer() {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
}

function startTimer() {
  stopTimer();
  const session = activeSession.value;
  if (!session) return;

  const shouldNotRun = session.status === "completed" || session.status === "cancelled";
  if (shouldNotRun) return;

  timeElapsed.value = estimateElapsedTime(DEFAULT_TIMER_VALUE, session.startTime);
  timer.value = setInterval(() => {
    const current = activeSession.value;
    if (!current) {
      stopTimer();
      return;
    }

    if (current.status === "completed" || current.status === "cancelled") {
      timeElapsed.value = estimateElapsedTime(DEFAULT_TIMER_VALUE, current.startTime, current.endTime);
      stopTimer();
      return;
    }

    timeElapsed.value = estimateElapsedTime(DEFAULT_TIMER_VALUE, current.startTime);
  }, SESSION_TIMER_INTERVAL_MS);
}

function goToHistory() {
  if (!sessionId.value) return;
  router.push({
    path: APP_ROUTES.interviewHistory,
    query: {
      [APP_ROUTE_QUERY_KEYS.sessionId]: sessionId.value,
    },
  });
}

async function handleSubmitResponse(submittedResponse?: string) {
  if (!canSubmit.value || !sessionId.value) return;

  const responseText =
    typeof submittedResponse === "string" ? submittedResponse.trim() : response.value.trim();
  if (responseText.length < INTERVIEW_MIN_RESPONSE_LENGTH) {
    $toast.error(
      t("interviewSession.errors.minResponseLength", { count: INTERVIEW_MIN_RESPONSE_LENGTH }),
    );
    return;
  }

  submitting.value = true;
  const submitResult = await settlePromise(
    submitResponse(sessionId.value, {
      questionIndex: currentQuestionIndex.value,
      response: responseText,
    }),
    t("interviewSession.errors.submitFailed"),
  );
  submitting.value = false;

  if (!submitResult.ok) {
    $toast.error(getErrorMessage(submitResult.error, t("interviewSession.errors.submitFailed")));
    return;
  }

  stt.stopListening();
  response.value = "";
  $toast.success(t("interviewSession.toasts.responseRecorded"));

  if (submitResult.value?.status === "completed") {
    $toast.success(t("interviewSession.toasts.completed"));
    goToHistory();
  } else if (isLastQuestion.value) {
    await handleCompleteInterview();
  }
}

async function handleCompleteInterview() {
  if (!canComplete.value || !sessionId.value) return;

  stopTimer();
  completing.value = true;
  const completionResult = await settlePromise(
    completeSession(sessionId.value),
    t("interviewSession.errors.completeFailed"),
  );
  completing.value = false;

  if (!completionResult.ok) {
    $toast.error(
      getErrorMessage(
        completionResult.error,
        t("interviewSession.errors.completeFailed"),
      ),
    );
    startTimer();
    return;
  }

  $toast.success(t("interviewSession.toasts.completed"));
  goToHistory();
}
</script>

<template>
  <div>
    <LoadingSkeleton v-if="completionState === 'loading'" :lines="8" />

    <div v-else-if="completionState === 'error'" role="alert" class="alert alert-error">
      <span>{{ sessionLoadError }}</span>
      <button
        type="button"
        class="btn btn-sm btn-outline"
        :aria-label="t('interviewSession.notFound')"
        @click="retryLoadSession"
      >
        {{ t("dashboard.retryButtonLabel") }}
      </button>
    </div>

    <div v-else-if="activeSession">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">{{ t("interviewSession.title") }}</h1>
          <p class="text-base-content/70">
            {{ targetJob?.company || activeSession?.studioName }} -
            {{ targetJob?.title || activeSession?.role }}
          </p>
        </div>
        <div class="stats bg-base-200">
          <div class="stat py-3 px-6">
            <div class="stat-title text-xs">{{ t("interviewSession.timeLabel") }}</div>
            <div class="stat-value text-2xl">
              <time
                class="font-mono text-2xl tabular-nums"
                :datetime="elapsedTimeDuration"
                :aria-label="elapsedTimeAriaLabel"
                aria-live="polite"
              >
                {{ elapsedTimeText }}
              </time>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="completionState === 'completed'"
        class="alert alert-success mt-4"
        role="status"
        aria-live="polite"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="m5 13 4 4L19 7"
          />
        </svg>
        <span>{{ t("interviewSession.toasts.completed") }}</span>
        <button
          type="button"
          class="btn btn-sm btn-success"
          :aria-label="t('interviewHistory.viewSessionAria', { id: sessionId })"
          @click="goToHistory"
        >
          {{ t("interviewHistory.viewButton") }}
        </button>
      </div>

      <div class="card bg-base-200 mt-4">
        <div class="card-body">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">
              {{ sessionProgressLabel }}
            </span>
            <span class="text-sm text-base-content/60">{{ Math.round(progress) }}%</span>
          </div>
          <progress
            class="progress progress-primary w-full"
            :value="progress"
            max="100"
            :aria-label="t('interviewSession.progressAria')"
            :aria-valuenow="Math.round(progress)"
            aria-valuemin="0"
            aria-valuemax="100"
          ></progress>
        </div>
      </div>

      <div v-if="targetJob" class="card bg-base-200 mt-4">
        <div class="card-body">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="card-title text-lg">{{ targetJob.title }}</h2>
              <p class="text-sm text-base-content/70">{{ targetJob.company }} · {{ targetJob.location }}</p>
            </div>
            <span class="badge badge-primary badge-outline">{{ t("interviewSession.jobTargetBadge") }}</span>
          </div>
        </div>
      </div>

      <div
        v-if="completionState === 'ready' || completionState === 'submitting' || completionState === 'completing'"
        class="card bg-base-200 mt-4"
      >
        <div class="card-body">
          <div v-if="canUseVoice" class="mb-3 flex items-center justify-between gap-2">
            <span class="text-sm opacity-80">
              {{ stt.isListening.value ? t("interviewSession.voice.listening") : t("interviewSession.voice.idle") }}
            </span>
            <button
              type="button"
              class="btn btn-sm"
              :class="stt.isListening.value ? 'btn-error' : 'btn-primary'"
              :disabled="completionState !== 'ready' || !canUseVoice"
              :title="
                stt.isListening.value ? t('interviewSession.voice.stopTitle') : t('interviewSession.voice.startTitle')
              "
              :aria-label="
                stt.isListening.value ? t('interviewSession.voice.stopAria') : t('interviewSession.voice.startAria')
              "
              @click="stt.isListening.value ? stt.stopListening() : stt.startListening()"
            >
              {{ stt.isListening.value ? t("interviewSession.voice.stopButton") : t("interviewSession.voice.startButton") }}
            </button>
          </div>

          <InterviewChat
            v-model:response="response"
            :questions="chatQuestions"
            :responses="chatResponses"
            :current-index="currentQuestionIndex"
            :min-response-length="INTERVIEW_MIN_RESPONSE_LENGTH"
            :disabled="completionState !== 'ready'"
            :is-submitting="submitting || completionState === 'completing'"
            :response-label-key="'interviewSession.responseTitle'"
            :response-placeholder-key="'interviewSession.responsePlaceholder'"
            :response-aria-key="'interviewSession.responseAria'"
            :response-hint-text="chatSubmitHint"
            :submit-button-label-key="submitButtonLabelKey"
            :submit-button-aria-label-key="'interviewSession.submitAria'"
            :progress-label-key="'interviewSession.progressLabel'"
            :complete-message-key="'interviewChatComponent.completeMessage'"
            @respond="handleSubmitResponse"
          />

          <div class="mt-3 flex justify-end">
            <button
              type="button"
              class="btn btn-error btn-outline"
              :disabled="!canComplete || completionState !== 'ready'"
              :aria-label="t('interviewSession.endAria')"
              @click="handleCompleteInterview"
            >
              <span v-if="completing" class="loading loading-spinner loading-xs"></span>
              {{ t("interviewSession.endButton") }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="currentQuestion?.feedback" class="card bg-base-200 mt-4">
        <div class="card-body">
          <h3 class="card-title text-lg">{{ t("interviewSession.feedbackTitle") }}</h3>
          <div
            class="alert"
            :class="{
              'alert-success': currentQuestion.score >= 80,
              'alert-warning': currentQuestion.score >= 60 && currentQuestion.score < 80,
              'alert-error': currentQuestion.score < 60,
            }"
            aria-live="polite"
          >
            <div>
              <p class="font-semibold">{{ t("interviewSession.feedbackScore", { score: currentQuestion.score }) }}</p>
              <p class="text-sm">{{ currentQuestion.feedback }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="alert alert-error">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{{ t("interviewSession.notFound") }}</span>
    </div>
  </div>
</template>
