<script setup lang="ts">
import {
  INTERVIEW_MIN_RESPONSE_LENGTH,
  INTERVIEW_PROGRESS_MAX,
  INTERVIEW_PROGRESS_MIN,
} from "@bao/shared/constants/interview";
import type {
  InterviewQuestion,
  InterviewSession,
  InterviewTargetJob,
} from "@bao/shared/types/interview";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";

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
  <div class="space-y-6">
    <InterviewSessionOverviewCard
      :active-session="activeSession"
      :can-use-voice="canUseVoice"
      :elapsed-time-aria-label="elapsedTimeAriaLabel"
      :elapsed-time-duration="elapsedTimeDuration"
      :elapsed-time-text="elapsedTimeText"
      :progress="progress"
      :session-progress-label="sessionProgressLabel"
      :target-job="targetJob"
    />

    <div
      v-if="completionState === 'completed'"
      class="alert alert-success"
      role="status"
      aria-live="polite"
    >
      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 13 4 4L19 7" />
      </svg>
      <span>{{ t("interviewSession.toasts.completed") }}</span>
      <button
        type="button"
        class="btn btn-success btn-sm"
        :aria-label="t('interviewHistory.viewSessionAria', { id: sessionId })"
        @click="$emit('history')"
      >
        {{ t("interviewHistory.viewButton") }}
      </button>
    </div>

    <div class="card card-border bg-base-100">
      <div class="card-body gap-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-base-content/70">
            {{ sessionProgressLabel }}
          </span>
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

    <SectionGrid grid-token="twoColumnWide" extra-class="items-start">
      <div class="space-y-6">
        <InterviewSessionPromptCard :current-question="currentQuestion" />
        <InterviewSessionFeedbackCard
          :current-question="currentQuestion"
          :get-alert-class="getAlertClass"
        />
      </div>

      <div
        v-if="completionState === 'ready' || completionState === 'submitting' || completionState === 'completing'"
        class="space-y-4"
      >
        <div
          v-if="canUseVoice"
          class="card card-border bg-base-100"
          :aria-label="t('interviewSession.voice.idle')"
        >
          <div class="card-body flex-row items-center justify-between gap-4">
            <div class="space-y-1">
              <p class="text-sm font-medium text-base-content/70">
                {{ t("interviewSession.voiceTitle") }}
              </p>
              <p class="text-sm text-base-content/60">
                {{ stt.isListening.value ? t("interviewSession.voice.listening") : t("interviewSession.voice.idle") }}
              </p>
            </div>
            <button
              type="button"
              class="btn btn-primary"
              :class="{ 'btn-error': stt.isListening.value }"
              :disabled="completionState !== 'ready' || !canUseVoice"
              :title="stt.isListening.value ? t('interviewSession.voice.stopTitle') : t('interviewSession.voice.startTitle')"
              :aria-label="stt.isListening.value ? t('interviewSession.voice.stopAria') : t('interviewSession.voice.startAria')"
              @click="stt.isListening.value ? stt.stopListening() : stt.startListening()"
            >
              {{ stt.isListening.value ? t("interviewSession.voice.stopButton") : t("interviewSession.voice.startButton") }}
            </button>
          </div>
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

        <div class="flex justify-end">
          <button
            type="button"
            class="btn btn-outline btn-error"
            :disabled="!canComplete || completionState !== 'ready'"
            :aria-label="t('interviewSession.endAria')"
            @click="$emit('complete')"
          >
            <span v-if="completing" class="loading loading-spinner loading-xs"></span>
            {{ t("interviewSession.endButton") }}
          </button>
        </div>
      </div>
    </SectionGrid>
  </div>
</template>
