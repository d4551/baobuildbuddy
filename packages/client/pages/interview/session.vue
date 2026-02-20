<script setup lang="ts">
import type { ChatMessage } from "@bao/shared";
import { APP_ROUTES, APP_ROUTE_QUERY_KEYS, INTERVIEW_MIN_RESPONSE_LENGTH } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { nextTick } from "vue";
import { settlePromise } from "~/composables/async-flow";
import { buildChatMessageRenderRows, createChatMessage } from "~/utils/chat";
import { getErrorMessage } from "~/utils/errors";

const route = useRoute();
const router = useRouter();
const { currentSession, loading, getSession, submitResponse, completeSession } = useInterview();
const { $toast } = useNuxtApp();
const { t, locale } = useI18n();
const voiceSettings = computed(() => currentSession.value?.config?.voiceSettings);
const tts = useTTS(voiceSettings);
const stt = useSTT(voiceSettings);
const conversationLogId = "interview-session-conversation-log";
const responseHintId = "interview-session-response-hint";
const currentLocale = computed(() => locale.value);

const sessionId = computed(() => {
  const routeSessionId = route.query[APP_ROUTE_QUERY_KEYS.id];
  return typeof routeSessionId === "string" ? routeSessionId : "";
});
const currentQuestionIndex = computed(() => currentSession.value?.currentQuestionIndex ?? 0);
const response = ref("");
const submitting = ref(false);
const timeElapsed = ref(0);
const timer = ref<ReturnType<typeof setInterval> | null>(null);
const conversationLogRef = ref<HTMLElement | null>(null);

const enableVoiceMode = computed(() => currentSession.value?.config?.enableVoiceMode ?? false);
const targetJob = computed(() => currentSession.value?.config?.targetJob);
const totalQuestions = computed(() => currentSession.value?.questions.length ?? 0);
const currentQuestion = computed(() =>
  currentSession.value?.questions?.[currentQuestionIndex.value],
);
const hasCurrentQuestion = computed(() => Boolean(currentQuestion.value));
const canSubmit = computed(() => {
  return (
    response.value.trim().length >= INTERVIEW_MIN_RESPONSE_LENGTH &&
    !submitting.value &&
    !loading.value &&
    hasCurrentQuestion.value &&
    sessionId.value.length > 0
  );
});
const progress = computed(() => {
  if (!totalQuestions.value) return 0;
  return ((currentQuestionIndex.value + 1) / totalQuestions.value) * 100;
});
const isLastQuestion = computed(
  () => hasCurrentQuestion.value && currentQuestionIndex.value >= totalQuestions.value - 1,
);

const conversationMessages = computed<ChatMessage[]>(() => {
  const session = currentSession.value;
  if (!session) return [];

  const responseByQuestion = new Map<string, { transcript: string; timestamp: number }>();
  for (const entry of session.responses) {
    responseByQuestion.set(entry.questionId, {
      transcript: entry.transcript,
      timestamp: entry.timestamp,
    });
  }

  return session.questions.flatMap((question) => {
    const messages: ChatMessage[] = [
      createChatMessage({
        id: `interview-question-${question.id}`,
        role: "assistant",
        content: question.question,
        timestamp: new Date(session.startTime).toISOString(),
      }),
    ];

    const responseEntry = responseByQuestion.get(question.id) ?? null;
    const responseText = responseEntry?.transcript ?? question.response;
    if (responseText) {
      messages.push(
        createChatMessage({
          id: `interview-response-${question.id}`,
          role: "user",
          content: responseText,
          ...(responseEntry?.timestamp
            ? { timestamp: new Date(responseEntry.timestamp).toISOString() }
            : {}),
        }),
      );
    }
    return messages;
  });
});
const renderedConversation = computed(() => buildChatMessageRenderRows(conversationMessages.value));

onMounted(async () => {
  if (sessionId.value) {
    await getSession(sessionId.value);
    startTimer();
  }
});

watch(
  renderedConversation,
  async () => {
    await nextTick();
    if (!conversationLogRef.value) return;
    conversationLogRef.value.scrollTop = conversationLogRef.value.scrollHeight;
  },
  { deep: true },
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
  (t) => {
    if (enableVoiceMode.value && t) {
      response.value = t;
    }
  },
);

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value);
  }
  tts.cancel();
  stt.stopListening();
});

function startTimer() {
  timer.value = setInterval(() => {
    timeElapsed.value++;
  }, 1000);
}
const elapsedMinutes = computed(() => Math.floor(timeElapsed.value / 60));
const elapsedSeconds = computed(() => timeElapsed.value % 60);

async function handleSubmitResponse() {
  if (!canSubmit.value) return;

  const responseText = response.value.trim();
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

  $toast.success(t("interviewSession.toasts.responseRecorded"));
  response.value = "";

  if (isLastQuestion.value) {
    await handleCompleteInterview();
    return;
  }
}

async function handleCompleteInterview() {
  if (!sessionId.value) return;

  if (timer.value) {
    clearInterval(timer.value);
  }

  const completionResult = await settlePromise(
    completeSession(sessionId.value),
    t("interviewSession.errors.completeFailed"),
  );
  if (!completionResult.ok) {
    $toast.error(
      getErrorMessage(completionResult.error, t("interviewSession.errors.completeFailed")),
    );
    return;
  }

  $toast.success(t("interviewSession.toasts.completed"));
  router.push({
    path: APP_ROUTES.interviewHistory,
    query: {
      [APP_ROUTE_QUERY_KEYS.sessionId]: sessionId.value,
    },
  });
}
</script>

<template>
  <div>
    <LoadingSkeleton v-if="loading" :lines="8" />

    <div v-else-if="currentSession" class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">{{ t("interviewSession.title") }}</h1>
          <p class="text-base-content/70">
            {{ targetJob?.company || currentSession.studioName }} - {{ targetJob?.title || currentSession.role }}
          </p>
        </div>
        <div class="stats bg-base-200">
          <div class="stat py-3 px-6">
            <div class="stat-title text-xs">{{ t("interviewSession.timeLabel") }}</div>
            <div class="stat-value text-2xl">
              <span class="countdown font-mono text-2xl">
                <span :style="`--value:${elapsedMinutes}; --digits:2;`" aria-live="polite" :aria-label="String(elapsedMinutes)">
                  {{ elapsedMinutes }}
                </span>
                :
                <span :style="`--value:${elapsedSeconds}; --digits:2;`" aria-live="polite" :aria-label="String(elapsedSeconds)">
                  {{ elapsedSeconds }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Progress -->
      <div class="card bg-base-200">
        <div class="card-body">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">
              {{ t("interviewSession.progressLabel", { current: currentQuestionIndex + 1, total: totalQuestions || 0 }) }}
            </span>
            <span class="text-sm text-base-content/60">{{ Math.round(progress) }}%</span>
          </div>
          <progress
            class="progress progress-primary w-full"
            :value="progress"
            max="100"
            :aria-label="t('interviewSession.progressAria')"
          ></progress>
        </div>
      </div>

      <div v-if="targetJob" class="card bg-base-200">
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

      <!-- Transcript -->
      <div class="card bg-base-200">
        <div class="card-body">
          <h3 class="card-title text-lg">{{ t("interviewSession.responseTitle") }}</h3>
          <div
            :id="conversationLogId"
            ref="conversationLogRef"
            class="space-y-4 max-h-[20rem] overflow-y-auto pr-2"
            role="log"
            :aria-label="t('interviewSession.responseTitle')"
            aria-live="polite"
            :aria-busy="loading || submitting"
          >
            <AIChatBubble
              v-for="(messageRow, index) in renderedConversation"
              :key="messageRow.key"
              :assistant-label="t('interviewSession.interviewerLabel')"
              :is-latest-assistant-message="
                index === renderedConversation.length - 1 && messageRow.message.role === 'assistant'
              "
              :is-streaming="false"
              :locale="currentLocale"
              :message="messageRow.message"
              :user-label="t('aiChatPage.youLabel')"
            />
            <p v-if="!renderedConversation.length" class="text-sm text-base-content/70">
              {{ t("interviewSession.minResponseHint", { count: INTERVIEW_MIN_RESPONSE_LENGTH }) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Feedback (if answered) -->
      <div v-if="currentQuestion?.feedback" class="card bg-base-200">
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

      <!-- Response Input -->
      <div class="card bg-base-200">
        <form class="card-body space-y-3" @submit.prevent="handleSubmitResponse">
          <div class="flex items-center justify-between">
            <h3 class="card-title text-lg">{{ t("interviewSession.responseTitle") }}</h3>
            <div v-if="enableVoiceMode && stt.isSupported.value" class="flex items-center gap-2">
              <span class="text-sm opacity-70">
                {{ stt.isListening.value ? t("interviewSession.voice.listening") : t("interviewSession.voice.idle") }}
              </span>
              <button
                type="button"
                class="btn btn-sm"
                :class="stt.isListening.value ? 'btn-error' : 'btn-primary'"
                :title="stt.isListening.value ? t('interviewSession.voice.stopTitle') : t('interviewSession.voice.startTitle')"
                :aria-label="stt.isListening.value ? t('interviewSession.voice.stopAria') : t('interviewSession.voice.startAria')"
                @click="stt.isListening.value ? stt.stopListening() : stt.startListening()"
              >
                {{ stt.isListening.value ? t("interviewSession.voice.stopButton") : t("interviewSession.voice.startButton") }}
              </button>
            </div>
          </div>
          <label :for="`${conversationLogId}-textarea`" class="label">
            <span class="label-text">
              {{ t("interviewSession.progressLabel", { current: currentQuestionIndex + 1, total: totalQuestions || 0 }) }}
            </span>
            <span class="label-text-alt">{{ t("interviewSession.progressAria") }}</span>
          </label>
          <textarea
            :id="`${conversationLogId}-textarea`"
            v-model="response"
            required
            :minlength="INTERVIEW_MIN_RESPONSE_LENGTH"
            class="textarea textarea-bordered validator w-full"
            rows="6"
            :placeholder="t('interviewSession.responsePlaceholder')"
            :disabled="submitting || loading"
            :aria-label="t('interviewSession.responseAria')"
            :aria-describedby="responseHintId"
            @keydown.ctrl.enter.prevent="handleSubmitResponse"
            @keydown.meta.enter.prevent="handleSubmitResponse"
          ></textarea>
          <p :id="responseHintId" class="validator-hint">
            {{ t("interviewSession.minResponseHint", { count: INTERVIEW_MIN_RESPONSE_LENGTH }) }}
          </p>
          <div class="card-actions justify-between">
            <button
              type="button"
              class="btn btn-error btn-outline"
              :aria-label="t('interviewSession.endAria')"
              @click="handleCompleteInterview"
            >
              {{ t("interviewSession.endButton") }}
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :aria-label="t('interviewSession.submitAria')"
              :disabled="!canSubmit"
            >
              <span v-if="submitting || loading" class="loading loading-spinner loading-xs"></span>
              {{ isLastQuestion ? t("interviewSession.submitFinishButton") : t("interviewSession.submitNextButton") }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-else class="alert alert-error">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ t("interviewSession.notFound") }}</span>
    </div>
  </div>
</template>
