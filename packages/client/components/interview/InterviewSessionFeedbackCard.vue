<script setup lang="ts">
import type { InterviewQuestion } from "@bao/shared/types/interview";
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  LEADING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

defineProps<{
  currentQuestion: InterviewQuestion | undefined;
  getAlertClass: (score: number) => string;
}>();

const { t } = useI18n();
</script>

<template>
  <UiGlassCard v-if="currentQuestion?.feedback" aria-labelledby="interview-session-feedback-title">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
        <h2 id="interview-session-feedback-title" class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">
          {{ t("interviewSession.feedbackTitle") }}
        </h2>
        <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("interviewSession.feedbackDescription") }}
        </p>
      </div>

      <div 
        class="alert"
        :class="currentQuestion.score !== undefined ? getAlertClass(currentQuestion.score) : 'alert-info'"
        aria-live="polite"
      >
        <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
          <p v-if="currentQuestion.score !== undefined" class="font-semibold">
            {{ t("interviewSession.feedbackScore", { score: currentQuestion.score }) }}
          </p>
          <p :class="[LEADING_TOKEN_CLASS.leading6, TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ currentQuestion.feedback }}
          </p>
        </div>
      </div>
    </div>
  </UiGlassCard>
</template>
