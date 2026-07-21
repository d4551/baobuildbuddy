<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  FLUID_WIDTH_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

interface ResumeEnhancementStepsProps {
  readonly stepLabels: readonly string[];
  readonly stepIndex: number;
}

defineProps<ResumeEnhancementStepsProps>();

const { t } = useI18n();
</script>

<template>
  <UiGlassCard>
    <div class="card-body" :class="[PADDING_TOKEN_CLASS.py4]">
      <h3 class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm, MARGIN_TOKEN_CLASS.mb2]">{{ t("resumePage.aiEnhancementTitle") }}</h3>
      <ul class="steps steps-horizontal" :class="[FLUID_WIDTH_CLASS]">
        <li 
          v-for="(stepLabel, index) in stepLabels"
          :key="stepLabel"
          class="step"
          :class="{ 'step-primary': index <= stepIndex }"
        >
          {{ stepLabel }}
        </li>
      </ul>
    </div>
  </UiGlassCard>
</template>
