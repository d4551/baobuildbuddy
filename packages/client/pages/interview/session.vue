<script setup lang="ts">
import { getErrorMessage } from "~/utils/errors";

const route = useRoute();
const router = useRouter();
const { currentSession, loading, getSession, submitResponse, completeSession } = useInterview();
const { $toast } = useNuxtApp();
const voiceSettings = computed(() => currentSession.value?.config?.voiceSettings);
const tts = useTTS(voiceSettings);
const stt = useSTT(voiceSettings);

const sessionId = computed(() => route.query.id as string);
const currentQuestionIndex = ref(0);
const response = ref("");
const submitting = ref(false);
const timeElapsed = ref(0);
const timer = ref<ReturnType<typeof setInterval> | null>(null);

const enableVoiceMode = computed(() => currentSession.value?.config?.enableVoiceMode ?? false);

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

async function handleSubmitResponse() {
  if (!response.value.trim() || !sessionId.value) return;

  if (response.value.trim().length < 10) {
    $toast.error("Response must be at least 10 characters");
    return;
  }

  submitting.value = true;
  try {
    await submitResponse(sessionId.value, {
      questionIndex: currentQuestionIndex.value,
      response: response.value,
    });

    $toast.success("Response recorded");

    if (currentQuestionIndex.value < (currentSession.value?.questions?.length || 0) - 1) {
      currentQuestionIndex.value++;
      response.value = "";
    } else {
      await handleCompleteInterview();
    }
  } catch (error: unknown) {
    $toast.error(getErrorMessage(error, "Failed to submit response"));
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
    $toast.success("Interview completed");
    router.push(`/interview/history?session=${sessionId.value}`);
  } catch (error: unknown) {
    $toast.error(getErrorMessage(error, "Failed to complete interview"));
  }
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
</script>

<template>
  <div>
    <LoadingSkeleton v-if="loading" :lines="8" />

    <div v-else-if="currentSession" class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">Interview Practice</h1>
          <p class="text-base-content/70">
            {{ currentSession.studioName }} - {{ currentSession.role }}
          </p>
        </div>
        <div class="stats bg-base-200">
          <div class="stat py-3 px-6">
            <div class="stat-title text-xs">Time</div>
            <div class="stat-value text-2xl">{{ formatTime(timeElapsed) }}</div>
          </div>
        </div>
      </div>

      <!-- Progress -->
      <div class="card bg-base-200">
        <div class="card-body">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">
              Question {{ currentQuestionIndex + 1 }} of {{ currentSession.questions?.length || 0 }}
            </span>
            <span class="text-sm text-base-content/60">{{ Math.round(progress) }}%</span>
          </div>
          <progress class="progress progress-primary w-full" :value="progress" max="100" aria-label="Progress progress"></progress>
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
              <p class="font-semibold mb-2">Interviewer</p>
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
          <h3 class="card-title text-lg">Feedback</h3>
          <div class="alert" :class="{
            'alert-success': currentQuestion.score >= 80,
            'alert-warning': currentQuestion.score >= 60 && currentQuestion.score < 80,
            'alert-error': currentQuestion.score < 60
          }">
            <div>
              <p class="font-semibold">Score: {{ currentQuestion.score }}%</p>
              <p class="text-sm">{{ currentQuestion.feedback }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Response Area -->
      <div class="card bg-base-200">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h3 class="card-title text-lg">Your Response</h3>
            <div v-if="enableVoiceMode && stt.isSupported.value" class="flex items-center gap-2">
              <span class="text-sm opacity-70">{{ stt.isListening.value ? "Listening..." : "Voice input" }}</span>
              <button
                type="button"
                class="btn btn-sm"
                :class="stt.isListening.value ? 'btn-error' : 'btn-primary'"
                :title="stt.isListening.value ? 'Stop listening' : 'Start voice input'"
                @click="stt.isListening.value ? stt.stopListening() : stt.startListening()"
              >
                {{ stt.isListening.value ? "Stop" : "Mic" }}
              </button>
            </div>
          </div>

          <textarea
            v-model="response"
            class="textarea textarea-bordered w-full"
            rows="8"
            placeholder="Type your answer here..."
            :disabled="submitting"
            aria-label="Type your answer here..."></textarea>

          <div class="card-actions justify-between mt-4">
            <button
              class="btn btn-error btn-outline"
              @click="handleCompleteInterview"
            >
              End Interview
            </button>

            <button
              class="btn btn-primary"
              :disabled="!response.trim() || submitting"
              @click="handleSubmitResponse"
            >
              <span v-if="submitting" class="loading loading-spinner loading-xs"></span>
              {{ currentQuestionIndex < (currentSession.questions?.length || 0) - 1 ? 'Submit & Next' : 'Submit & Finish' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="alert alert-error">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Session not found. Please start a new interview.</span>
    </div>
  </div>
</template>
