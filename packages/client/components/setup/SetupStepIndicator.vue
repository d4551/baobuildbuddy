<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  FLUID_WIDTH_CLASS,
  MARGIN_TOKEN_CLASS,
} from "~/constants/layout";
import { SETUP_WIZARD_FINAL_STEP } from "~/constants/numeric-ui";
import type { SetupStep } from "./setup-page-contracts";

defineProps<{
  currentStep: SetupStep;
}>();

const { t } = useI18n();
</script>

<template>
  <ul class="steps steps-horizontal" :class="[FLUID_WIDTH_CLASS, MARGIN_TOKEN_CLASS.mb8]" :aria-label="t('setup.stepsAriaLabel')">
    <li class="step" :class="{ 'step-primary': currentStep >= 1 }" :data-content="currentStep > 1 ? '✓' : '1'">
      {{ t("setup.steps.profile") }}
    </li>
    <li class="step" :class="{ 'step-primary': currentStep >= 2 }" :data-content="currentStep > 2 ? '✓' : '2'">
      {{ t("setup.steps.localAi") }}
    </li>
    <li class="step" :class="{ 'step-primary': currentStep >= SETUP_WIZARD_FINAL_STEP }" :data-content="currentStep >= SETUP_WIZARD_FINAL_STEP ? '✓' : String(SETUP_WIZARD_FINAL_STEP)">
      {{ t("setup.steps.done") }}
    </li>
  </ul>
</template>
