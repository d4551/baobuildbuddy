<script setup lang="ts">
import type { InterviewQuestion } from "@bao/shared/types/interview";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import {
  FLEX_GAP_TOKEN_CLASS,
  LEADING_TOKEN_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
  SURFACE_GLASS_SUBTLE_CLASS,
} from "~/constants/layout";

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
  <section :class="SURFACE_GLASS_CARD_CLASS" aria-labelledby="interview-session-prompt-title">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap5]">
      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
        <h2 class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.xl]" id="interview-session-prompt-title">
          {{ t("interviewSession.promptTitle") }}
        </h2>
        <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("interviewSession.promptDescription") }}
        </p>
      </div>

      <div class="rounded-box border border-base-300" :class="[SURFACE_GLASS_SUBTLE_CLASS, PADDING_TOKEN_CLASS.p5]" v-if="currentQuestion">
        <p class="font-semibold text-base-content" :class="[LEADING_TOKEN_CLASS.relaxed, TYPOGRAPHY_SCALE_CLASS.xl]">
          {{ currentQuestion.question }}
        </p>
      </div>

      <SectionGrid v-if="currentQuestion" grid-token="threeColumnMd">
        <div class="rounded-box border border-base-300" :class="[SURFACE_GLASS_SUBTLE_CLASS, PADDING_TOKEN_CLASS.p4]">
          <p class="font-medium text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("interviewSession.promptTypeLabel") }}
          </p>
          <p class="text-base font-semibold text-base-content" :class="[MARGIN_TOKEN_CLASS.mt2]">{{ promptType }}</p>
        </div>

        <div class="rounded-box border border-base-300" :class="[SURFACE_GLASS_SUBTLE_CLASS, PADDING_TOKEN_CLASS.p4]">
          <p class="font-medium text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("interviewSession.promptDifficultyLabel") }}
          </p>
          <p class="text-base font-semibold text-base-content" :class="[MARGIN_TOKEN_CLASS.mt2]">{{ promptDifficulty }}</p>
        </div>

        <div class="rounded-box border border-base-300" :class="[SURFACE_GLASS_SUBTLE_CLASS, PADDING_TOKEN_CLASS.p4]">
          <p class="font-medium text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("interviewSession.promptExpectedDurationLabel") }}
          </p>
          <p class="text-base font-semibold text-base-content" :class="[MARGIN_TOKEN_CLASS.mt2]">
            {{ t("interviewSession.promptExpectedDurationValue", { count: promptExpectedMinutes }) }}
          </p>
        </div>
      </SectionGrid>

      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
        <p class="font-medium text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("interviewSession.promptTagsLabel") }}
        </p>

        <div v-if="promptTags.length > 0" class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
          <span 
            v-for="tag in promptTags"
            :key="tag"
            class="badge badge-outline badge-primary"
          >
            {{ tag }}
          </span>
        </div>

        <p v-else class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("interviewSession.promptTagsEmpty") }}
        </p>
      </div>
    </div>
  </section>
</template>
