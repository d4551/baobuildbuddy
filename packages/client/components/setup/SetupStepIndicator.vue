<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  FLUID_WIDTH_CLASS,
  MARGIN_TOKEN_CLASS,
} from "~/constants/layout";
import type { SetupStep } from "./setup-page-contracts";

defineProps<{
  currentStep: SetupStep;
}>();

const { t } = useI18n();
</script>

<template>
 <ul class="steps steps-horizontal" :aria-label="t('setup.stepsAriaLabel')" :class="[MARGIN_TOKEN_CLASS.mb8, FLUID_WIDTH_CLASS]">
    <li class="step" :class="{ 'step-primary': currentStep >= 1 }" :data-content="currentStep > 1 ? '✓' : '1'">
      {{ t("setup.steps.profile") }}
    </li>
    <li class="step" :class="{ 'step-primary': currentStep >= 2 }" :data-content="currentStep > 2 ? '✓' : '2'">
      {{ t("setup.steps.localAi") }}
    </li>
    <li class="step" :class="{ 'step-primary': currentStep >= 3 }" :data-content="currentStep >= 3 ? '✓' : '3'">
      {{ t("setup.steps.done") }}
    </li>
  </ul>
</template>
