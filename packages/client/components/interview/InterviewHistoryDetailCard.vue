<script setup lang="ts">
import type { InterviewSession } from "@bao/shared/types/interview";
import { useI18n } from "vue-i18n";
import CloseIcon from "~/components/ui/CloseIcon.vue";
import UiRadialMeter from "~/components/ui/UiRadialMeter.vue";
import {
  FLEX_GAP_TOKEN_CLASS,
  MARGIN_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

defineProps<{
  detailError: string;
  detailLoading: boolean;
  selectedSession: InterviewSession | null;
  formatScore: (value: number | undefined) => string;
  questionScoreText: (value: number | undefined) => number;
  getScoreColorClass: (value: number | undefined) => string;
}>();

const emit = defineEmits<{
  retry: [];
  close: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div>
    <BootstrapErrorAlert
      v-if="detailError"
      :message="detailError"
      :retry-label="t('interviewHistory.retryButtonLabel')"
      :retry-aria-label="t('interviewHistory.retryAria')"
      @retry="emit('retry')"
    />

    <div v-if="detailLoading" class="card bg-base-200">
      <div class="card-body">
        <p role="status" aria-live="polite">{{ t("interviewHistory.loadingDetails") }}</p>
      </div>
    </div>

    <div v-else-if="selectedSession" class="card bg-base-200 sticky top-6">
      <div class="card-body">
        <div class="flex items-center justify-between" :class="[MARGIN_TOKEN_CLASS.mb4]">
          <h3 class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ t("interviewHistory.detailsTitle") }}</h3>
          <button
            type="button"
            class="btn btn-ghost btn-xs btn-circle"
            :aria-label="t('interviewHistory.closeDetailsAria')"
            @click="emit('close')"
          >
            <CloseIcon class="h-4 w-4" />
          </button>
        </div>

        <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
          <div>
            <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ t("interviewHistory.detailStudioLabel") }}</p>
            <p class="font-semibold">{{ selectedSession.studioName }}</p>
          </div>

          <div>
            <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ t("interviewHistory.detailRoleLabel") }}</p>
            <p class="font-semibold">{{ selectedSession.role }}</p>
          </div>

          <div>
            <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ t("interviewHistory.detailScoreLabel") }}</p>
            <div class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
              <UiRadialMeter
                :value="selectedSession.score ?? 0"
                size-class="h-16 w-16"
                fill-class="stroke-primary"
                :aria-label="t('interviewHistory.detailScoreAria', { score: selectedSession.score ?? 0 })"
              >
                <span class="font-bold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ formatScore(selectedSession.score) }}</span>
              </UiRadialMeter>
            </div>
          </div>

          <div>
            <p class="mb-2 text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ t("interviewHistory.questionsLabel") }}</p>
            <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
              <div
                v-for="(question, idx) in selectedSession.questions"
                :key="idx"
                class="collapse collapse-arrow bg-base-100"
              >
                <input
                  type="radio"
                  :name="`question-${selectedSession.id}`"
                  :aria-label="t('interviewHistory.questionAria', { index: idx + 1 })"
                />
                <div class="collapse-title font-medium" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                  {{
                    t("interviewHistory.questionHeader", {
                      index: idx + 1,
                      score: questionScoreText(question.score),
                    })
                  }}
                </div>
                <div class="collapse-content" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
                  <p class="font-semibold" :class="[MARGIN_TOKEN_CLASS.mb1]">{{ question.question }}</p>
                  <p class="mb-2 text-muted">{{ question.response }}</p>
                  <p class="text-secondary">{{ question.feedback }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedSession.overallFeedback">
            <p class="text-muted" :class="[MARGIN_TOKEN_CLASS.mb1, TYPOGRAPHY_SCALE_CLASS.xs]">
              {{ t("interviewHistory.overallFeedbackLabel") }}
            </p>
            <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ selectedSession.overallFeedback }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="card bg-base-200">
      <div class="card-body">
        <EmptyState
          title-key="interviewHistory.selectPromptTitle"
          description-key="interviewHistory.selectPromptDescription"
        />
      </div>
    </div>
  </div>
</template>
