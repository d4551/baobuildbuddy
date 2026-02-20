<script setup lang="ts">
import { APP_ROUTES, APP_ROUTE_QUERY_KEYS, INTERVIEW_MIN_RESPONSE_LENGTH } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { getErrorMessage } from "~/utils/errors";

const route = useRoute();
const router = useRouter();
const { currentSession, loading, getSession, submitResponse, completeSession } = useInterview();
const { $toast } = useNuxtApp();
const { t } = useI18n();
const voiceSettings = computed(() => currentSession.value?.config?.voiceSettings);
const tts = useTTS(voiceSettings);
const stt = useSTT(voiceSettings);

const sessionId = computed(() => {
  const routeSessionId = route.query[APP_ROUTE_QUERY_KEYS.id];
  return typeof routeSessionId === "string" ? routeSessionId : "";
});
const currentQuestionIndex = ref(0);
const response = ref("");
const submitting = ref(false);
const timeElapsed = ref(0);
const timer = ref<ReturnType<typeof setInterval> | null>(null);

const enableVoiceMode = computed(() => currentSession.value?.config?.enableVoiceMode ?? false);
const targetJob = computed(() => currentSession.value?.config?.targetJob);

onMounted(async () => {
  if (sessionId.value) {
    await getSession(sessionId.value);
    startTimer();
  }
});

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

const currentQuestion = computed(() => {
  return currentSession.value?.questions?.[currentQuestionIndex.value];
});

const progress = computed(() => {
  if (!currentSession.value?.questions?.length) return 0;
  return ((currentQuestionIndex.value + 1) / currentSession.value.questions.length) * 100;
});
const elapsedMinutes = computed(() => Math.floor(timeElapsed.value / 60));
const elapsedSeconds = computed(() => timeElapsed.value % 60);

async function handleSubmitResponse() {
  if (!response.value.trim() || !sessionId.value) return;

  if (response.value.trim().length < INTERVIEW_MIN_RESPONSE_LENGTH) {
    $toast.error(
      t("interviewSession.errors.minResponseLength", { count: INTERVIEW_MIN_RESPONSE_LENGTH }),
    );
    return;
  }

  submitting.value = true;
  try {
    await submitResponse(sessionId.value, {
      questionIndex: currentQuestionIndex.value,
      response: response.value,
    });

    $toast.success(t("interviewSession.toasts.responseRecorded"));

    if (currentQuestionIndex.value < (currentSession.value?.questions?.length || 0) - 1) {
      currentQuestionIndex.value++;
      response.value = "";
    } else {
      await handleCompleteInterview();
    }
  } catch (error) {
    $toast.error(getErrorMessage(error, t("interviewSession.errors.submitFailed")));
  } finally {
    submitting.value = false;
  }
}

async function handleCompleteInterview() {
  if (!sessionId.value) return;

  if (timer.value) {
    clearInterval(timer.value);
  }

  try {
    await completeSession(sessionId.value);
    $toast.success(t("interviewSession.toasts.completed"));
    router.push({
      path: APP_ROUTES.interviewHistory,
      query: {
        [APP_ROUTE_QUERY_KEYS.sessionId]: sessionId.value,
      },
    });
  } catch (error) {
    $toast.error(getErrorMessage(error, t("interviewSession.errors.completeFailed")));
  }
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
              {{ t("interviewSession.progressLabel", { current: currentQuestionIndex + 1, total: currentSession.questions?.length || 0 }) }}
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

      <!-- Current Question -->
      <div v-if="currentQuestion" class="card bg-base-200">
        <div class="card-body">
          <div class="flex items-start gap-3">
            <div class="avatar placeholder">
              <div class="bg-primary text-primary-content rounded-full w-12 h-12">
                <span class="text-xl">AI</span>
              </div>
            </div>
            <div class="flex-1">
              <p class="font-semibold mb-2">{{ t("interviewSession.interviewerLabel") }}</p>
              <div class="bg-base-100 p-4 rounded-lg">
                <p class="text-lg">{{ currentQuestion.question }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feedback (if answered) -->
      <div v-if="currentQuestion?.feedback" class="card bg-base-200">
        <div class="card-body">
          <h3 class="card-title text-lg">{{ t("interviewSession.feedbackTitle") }}</h3>
          <div class="alert" :class="{
            'alert-success': currentQuestion.score >= 80,
            'alert-warning': currentQuestion.score >= 60 && currentQuestion.score < 80,
            'alert-error': currentQuestion.score < 60
          }" aria-live="polite">
            <div>
              <p class="font-semibold">{{ t("interviewSession.feedbackScore", { score: currentQuestion.score }) }}</p>
              <p class="text-sm">{{ currentQuestion.feedback }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Response Area -->
      <div class="card bg-base-200">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
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

          <textarea
            v-model="response"
            required
            :minlength="INTERVIEW_MIN_RESPONSE_LENGTH"
            class="textarea textarea-bordered validator w-full"
            rows="8"
            :placeholder="t('interviewSession.responsePlaceholder')"
            :disabled="submitting"
            :aria-label="t('interviewSession.responseAria')"
          ></textarea>
          <p class="validator-hint">
            {{ t("interviewSession.minResponseHint", { count: INTERVIEW_MIN_RESPONSE_LENGTH }) }}
          </p>

          <div class="card-actions justify-between mt-4">
            <button
              type="button"
              class="btn btn-error btn-outline"
              :aria-label="t('interviewSession.endAria')"
              @click="handleCompleteInterview"
            >
              {{ t("interviewSession.endButton") }}
            </button>

            <button
              type="button"
              class="btn btn-primary"
              :aria-label="t('interviewSession.submitAria')"
              :disabled="!response.trim() || submitting"
              @click="handleSubmitResponse"
            >
              <span v-if="submitting" class="loading loading-spinner loading-xs"></span>
              {{
                currentQuestionIndex < (currentSession.questions?.length || 0) - 1
                  ? t("interviewSession.submitNextButton")
                  : t("interviewSession.submitFinishButton")
              }}
            </button>
          </div>
        </div>
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
