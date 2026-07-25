<script setup lang="ts">
import AppProseField from "~/components/ui/AppProseField.vue";
import {
  GHOST_ACTION_CLASS,
  GHOST_ACTION_DENSE_CLASS,
  MARGIN_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

defineProps<{
  aiQuestions: ReadonlyArray<{ id: string; question: string; category: string }>;
  currentQuestionIndex: number;
  errorMessage: string;
  t: (key: string, values?: Record<string, unknown>) => string;
}>();

const answers = defineModel<Record<string, string>>("answers", { required: true });

const emit = defineEmits<{
  previous: [];
  next: [];
  changeTarget: [];
}>();
</script>

<template>
  <div :class="SURFACE_GLASS_CARD_CLASS">
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
          :class="[TOUCH_TARGET_MIN_CLASS, GHOST_ACTION_DENSE_CLASS]"
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
        <AppProseField
          :id="`answer-${aiQuestions[currentQuestionIndex]?.id}`"
          v-model="answers[aiQuestions[currentQuestionIndex]!.id]"
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
          :class="GHOST_ACTION_CLASS"
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
  </div>
</template>
