<script setup lang="ts">
import {
  FLUID_WIDTH_CLASS,
  MARGIN_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

const answers = defineModel<Record<string, string>>("answers", { required: true });

defineProps<{
  aiQuestions: ReadonlyArray<{ id: string; question: string; category: string }>;
  currentQuestionIndex: number;
  errorMessage: string;
  t: (key: string, values?: Record<string, unknown>) => string;
}>();

const emit = defineEmits<{
  previous: [];
  next: [];
  changeTarget: [];
}>();
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
        <button 
          :class="[TOUCH_TARGET_MIN_CLASS, 'btn btn-ghost btn-sm']"
          :aria-label="t('resumeBuildPage.questions.changeTargetAria')"
          @click="emit('changeTarget')"
        >
          {{ t("resumeBuildPage.questions.changeTargetButton") }}
        </button>
      </div>

      <fieldset v-if="aiQuestions[currentQuestionIndex]" class="fieldset">
        <legend class="fieldset-legend">{{ aiQuestions[currentQuestionIndex]?.category }}</legend>
        <label :for="`answer-${aiQuestions[currentQuestionIndex]?.id}`" class="label">
          {{ aiQuestions[currentQuestionIndex]?.question }}
        </label>
        <textarea 
          :id="`answer-${aiQuestions[currentQuestionIndex]?.id}`"
          v-model="answers[aiQuestions[currentQuestionIndex]!.id]"
          class="textarea" :class="[FLUID_WIDTH_CLASS]"
          rows="4"
          :placeholder="
            t('resumeBuildPage.questions.answerPlaceholder', {
              question: aiQuestions[currentQuestionIndex]?.question,
            })
          "
          :aria-label="
            t('resumeBuildPage.questions.answerAria', {
              question: aiQuestions[currentQuestionIndex]?.question,
            })
          "
        />
      </fieldset>

      <p v-if="errorMessage" class="text-error" :class="[MARGIN_TOKEN_CLASS.mt2, TYPOGRAPHY_SCALE_CLASS.sm]">{{ errorMessage }}</p>

      <div class="card-actions justify-between" :class="[MARGIN_TOKEN_CLASS.mt6]">
        <button 
          class="btn btn-ghost"
          :disabled="currentQuestionIndex === 0"
          :aria-label="t('resumeBuildPage.questions.backAria')"
          @click="emit('previous')"
        >
          {{ t("resumeBuildPage.questions.backButton") }}
        </button>
        <button 
          :class="[PRIMARY_ACTION_CLASS]"
          :disabled="!(answers[aiQuestions[currentQuestionIndex]?.id ?? ''] ?? '').trim()"
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
