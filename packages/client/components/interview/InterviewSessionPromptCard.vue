<script setup lang="ts">
import type { InterviewQuestion } from "@bao/shared/types/interview";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  currentQuestion: InterviewQuestion | undefined;
}>();

const { t } = useI18n();

const difficultyKeyByValue = {
  easy: "interviewSession.difficulty.easy",
  medium: "interviewSession.difficulty.medium",
  hard: "interviewSession.difficulty.hard",
} as const;

const questionTypeKeyByValue = {
  intro: "interviewSession.questionTypes.intro",
  behavioral: "interviewSession.questionTypes.behavioral",
  technical: "interviewSession.questionTypes.technical",
  "studio-specific": "interviewSession.questionTypes.studio-specific",
  closing: "interviewSession.questionTypes.closing",
} as const;

const promptType = computed(() =>
  props.currentQuestion ? t(questionTypeKeyByValue[props.currentQuestion.type]) : "",
);

const promptDifficulty = computed(() =>
  props.currentQuestion ? t(difficultyKeyByValue[props.currentQuestion.difficulty]) : "",
);

const promptTags = computed(
  () => props.currentQuestion?.tags.filter((entry) => entry.trim().length > 0) ?? [],
);

const promptExpectedMinutes = computed(() => {
  if (!props.currentQuestion) {
    return 0;
  }

  return Math.max(1, Math.round(props.currentQuestion.expectedDuration / 60));
});
</script>

<template>
  <section class="card card-border bg-base-100" aria-labelledby="interview-session-prompt-title">
    <div class="card-body gap-5">
      <div class="space-y-1">
        <h2 id="interview-session-prompt-title" class="card-title text-xl">
          {{ t("interviewSession.promptTitle") }}
        </h2>
        <p class="text-sm text-base-content/60">
          {{ t("interviewSession.promptDescription") }}
        </p>
      </div>

      <div
        v-if="currentQuestion"
        class="rounded-box border border-base-300 bg-base-200/60 p-5"
      >
        <p class="text-xl font-semibold leading-relaxed text-base-content">
          {{ currentQuestion.question }}
        </p>
      </div>

      <div v-if="currentQuestion" class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="rounded-box border border-base-300 bg-base-200/40 p-4">
          <p class="text-sm font-medium text-base-content/70">
            {{ t("interviewSession.promptTypeLabel") }}
          </p>
          <p class="mt-2 text-base font-semibold text-base-content">{{ promptType }}</p>
        </div>

        <div class="rounded-box border border-base-300 bg-base-200/40 p-4">
          <p class="text-sm font-medium text-base-content/70">
            {{ t("interviewSession.promptDifficultyLabel") }}
          </p>
          <p class="mt-2 text-base font-semibold text-base-content">{{ promptDifficulty }}</p>
        </div>

        <div class="rounded-box border border-base-300 bg-base-200/40 p-4">
          <p class="text-sm font-medium text-base-content/70">
            {{ t("interviewSession.promptExpectedDurationLabel") }}
          </p>
          <p class="mt-2 text-base font-semibold text-base-content">
            {{ t("interviewSession.promptExpectedDurationValue", { count: promptExpectedMinutes }) }}
          </p>
        </div>
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium text-base-content/70">
          {{ t("interviewSession.promptTagsLabel") }}
        </p>

        <div v-if="promptTags.length > 0" class="flex flex-wrap gap-2">
          <span
            v-for="tag in promptTags"
            :key="tag"
            class="badge badge-outline badge-primary"
          >
            {{ tag }}
          </span>
        </div>

        <p v-else class="text-sm text-base-content/60">
          {{ t("interviewSession.promptTagsEmpty") }}
        </p>
      </div>
    </div>
  </section>
</template>
