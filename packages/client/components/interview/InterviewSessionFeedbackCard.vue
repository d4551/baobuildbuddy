<script setup lang="ts">
import type { InterviewQuestion } from "@bao/shared/types/interview";
import { useI18n } from "vue-i18n";

defineProps<{
  currentQuestion: InterviewQuestion | undefined;
  getAlertClass: (score: number) => string;
}>();

const { t } = useI18n();
</script>

<template>
  <section
    v-if="currentQuestion?.feedback"
    class="card card-border bg-base-100"
    aria-labelledby="interview-session-feedback-title"
  >
    <div class="card-body gap-4">
      <div class="space-y-1">
        <h2 id="interview-session-feedback-title" class="card-title text-lg">
          {{ t("interviewSession.feedbackTitle") }}
        </h2>
        <p class="text-sm text-muted">
          {{ t("interviewSession.feedbackDescription") }}
        </p>
      </div>

      <div
        class="alert"
        :class="currentQuestion.score !== undefined ? getAlertClass(currentQuestion.score) : 'alert-info'"
        aria-live="polite"
      >
        <div class="space-y-2">
          <p v-if="currentQuestion.score !== undefined" class="font-semibold">
            {{ t("interviewSession.feedbackScore", { score: currentQuestion.score }) }}
          </p>
          <p class="text-sm leading-6">
            {{ currentQuestion.feedback }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
