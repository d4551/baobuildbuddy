<script setup lang="ts">
import { INTERVIEW_MIN_RESPONSE_LENGTH, INTERVIEW_PROGRESS_MAX, INTERVIEW_PROGRESS_MIN } from "@bao/shared/constants/interview";
import type { InterviewQuestion, InterviewSession, InterviewTargetJob } from "@bao/shared/types/interview";
import { useI18n } from "vue-i18n";

type InterviewCompletionState =
  | "idle"
  | "loading"
  | "ready"
  | "submitting"
  | "completing"
  | "completed"
  | "error";

defineProps<{
  activeSession: InterviewSession;
  canComplete: boolean;
  canUseVoice: boolean;
  chatQuestions: { id: string; text: string }[];
  chatResponses: { questionId: string; text: string }[];
  chatSubmitHint: string;
  completing: boolean;
  completionState: InterviewCompletionState;
  currentQuestion: InterviewQuestion | undefined;
  currentQuestionIndex: number;
  elapsedTimeAriaLabel: string;
  elapsedTimeDuration: string;
  elapsedTimeText: string;
  getAlertClass: (score: number) => string;
  progress: number;
  response: string;
  sessionId: string;
  sessionProgressLabel: string;
  stt: ReturnType<typeof useSTT>;
  submitButtonLabelKey: string;
  submitting: boolean;
  targetJob: InterviewTargetJob | undefined;
}>();

const emit = defineEmits<{
  complete: [];
  history: [];
  submit: [value?: string];
  "update:response": [value: string];
}>();

const { t } = useI18n();
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-semibold">{{ sessionProgressLabel }}</h2>
        <p class="text-base-content/70">
          {{ targetJob?.company || activeSession.studioName }} -
          {{ targetJob?.title || activeSession.role }}
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
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 13 4 4L19 7" />
      </svg>
      <span>{{ t("interviewSession.toasts.completed") }}</span>
      <button
        type="button"
        class="btn btn-sm btn-success"
        :aria-label="t('interviewHistory.viewSessionAria', { id: sessionId })"
        @click="$emit('history')"
      >
        {{ t("interviewHistory.viewButton") }}
      </button>
    </div>

    <div class="card bg-base-200 mt-4">
      <div class="card-body">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium">{{ sessionProgressLabel }}</span>
          <span class="text-sm text-base-content/60">{{ Math.round(progress) }}%</span>
        </div>
        <progress
          class="progress progress-primary w-full"
          :value="progress"
          :max="INTERVIEW_PROGRESS_MAX"
          :aria-label="t('interviewSession.progressAria')"
          :aria-valuenow="Math.round(progress)"
          :aria-valuemin="INTERVIEW_PROGRESS_MIN"
          :aria-valuemax="INTERVIEW_PROGRESS_MAX"
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
            class="btn btn-sm btn-primary"
            :class="{ 'btn-error': stt.isListening.value }"
            :disabled="completionState !== 'ready' || !canUseVoice"
            :title="stt.isListening.value ? t('interviewSession.voice.stopTitle') : t('interviewSession.voice.startTitle')"
            :aria-label="stt.isListening.value ? t('interviewSession.voice.stopAria') : t('interviewSession.voice.startAria')"
            @click="stt.isListening.value ? stt.stopListening() : stt.startListening()"
          >
            {{ stt.isListening.value ? t("interviewSession.voice.stopButton") : t("interviewSession.voice.startButton") }}
          </button>
        </div>

        <InterviewChat
          :response="response"
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
          @update:response="$emit('update:response', $event)"
          @respond="emit('submit', $event)"
        />

        <div class="mt-3 flex justify-end">
          <button
            type="button"
            class="btn btn-error btn-outline"
            :disabled="!canComplete || completionState !== 'ready'"
            :aria-label="t('interviewSession.endAria')"
            @click="$emit('complete')"
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
          v-if="currentQuestion.score !== undefined"
          class="alert"
          :class="getAlertClass(currentQuestion.score)"
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
</template>
