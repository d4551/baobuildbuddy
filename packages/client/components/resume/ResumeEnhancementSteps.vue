<script setup lang="ts">
import { useI18n } from "vue-i18n";

interface ResumeEnhancementStepsProps {
  readonly stepLabels: readonly string[];
  readonly stepIndex: number;
}

defineProps<ResumeEnhancementStepsProps>();

const { t } = useI18n();
</script>

<template>
  <div class="card card-border bg-base-100">
    <div class="card-body py-4">
      <h3 class="mb-2 text-sm font-semibold">{{ t("resumePage.aiEnhancementTitle") }}</h3>
      <ul class="steps steps-horizontal w-full">
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
  </div>
</template>
