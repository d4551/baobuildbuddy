<script setup lang="ts">
import {
  FLUID_WIDTH_CLASS,
  GHOST_ACTION_CLASS,
  GHOST_ACTION_DENSE_CLASS,
  MARGIN_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

const answers = defineModel<Record<string, string>>("answers", { required: true });

const props = defineProps<{
  aiQuestions: ReadonlyArray<{ id: string; question: string; category: string }>;
  currentQuestionIndex: number;
  errorMessage: string;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}>();

const emit = defineEmits<{
  previous: [];
  next: [];
  changeTarget: [];
}>();

const currentQuestion = computed(() => props.aiQuestions[props.currentQuestionIndex]);
</script>

<template>
  <UiGlassCard>
    <div class="card-body">
      <div class="flex items-center justify-between" :class="[MARGIN_TOKEN_CLASS.mb4]">
        <h2 class="card-title">
          {{
            t("resumeBuildPage.questions.title", {
              current: currentQuestionIndex + 1,
              total: aiQuestions.length,
            })
          }}
        </h2>
        <button type="button" 
          :class="[GHOST_ACTION_DENSE_CLASS]"
          :aria-label="t('resumeBuildPage.questions.changeTargetAria')"
          @click="emit('changeTarget')"
        >
          {{ t("resumeBuildPage.questions.changeTargetButton") }}
        </button>
      </div>

      <fieldset v-if="currentQuestion" class="fieldset">
        <legend class="fieldset-legend">{{ currentQuestion.category }}</legend>
        <label :for="`answer-${currentQuestion.id}`" class="label">
          {{ currentQuestion.question }}
        </label>
        <textarea
          :id="`answer-${currentQuestion.id}`"
          v-model="answers[currentQuestion.id]"
          class="textarea" :class="[FLUID_WIDTH_CLASS]"
          rows="4"
          :placeholder="
            t('resumeBuildPage.questions.answerPlaceholder', {
              question: currentQuestion.question,
            })
          "
          :aria-label="
            t('resumeBuildPage.questions.answerAria', {
              question: currentQuestion.question,
            })
          "
        />
      </fieldset>

      <p v-if="errorMessage" class="text-error" :class="[MARGIN_TOKEN_CLASS.mt2, TYPOGRAPHY_SCALE_CLASS.sm]">{{ errorMessage }}</p>

      <div class="card-actions justify-between" :class="[MARGIN_TOKEN_CLASS.mt6]">
        <button type="button" 
          :class="[GHOST_ACTION_CLASS]"
          :disabled="currentQuestionIndex === 0"
          :aria-label="t('resumeBuildPage.questions.backAria')"
          @click="emit('previous')"
        >
          {{ t("resumeBuildPage.questions.backButton") }}
        </button>
        <button type="button" 
          :class="[PRIMARY_ACTION_CLASS]"
          :disabled="!(answers[currentQuestion?.id ?? ''] ?? '').trim()"
          :aria-label="t('resumeBuildPage.questions.nextAria')"
          @click="emit('next')"
        >
          {{
            currentQuestionIndex < aiQuestions.length - 1
              ? t("resumeBuildPage.questions.nextButton")
              : t("resumeBuildPage.questions.createResumeButton")
          }}
        </button>
      </div>
    </div>
  </UiGlassCard>
</template>
