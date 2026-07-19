<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { FLUID_WIDTH_CLASS, MARGIN_TOKEN_CLASS } from "~/constants/layout";

defineProps<{
  inputSummary: string;
  outputSummary: string;
  statusText: string;
  progressPercent: number;
  errorMessage: string;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="stats stats-vertical bg-base-200 lg:stats-horizontal" :class="[FLUID_WIDTH_CLASS]">
    <div class="stat">
      <div class="stat-title">{{ t("automation.runDetail.stats.inputTitle") }}</div>
      <div class="stat-value text-base">{{ inputSummary }}</div>
      <div class="stat-desc">{{ t("automation.runDetail.stats.inputDescription") }}</div>
    </div>
    <div class="stat">
      <div class="stat-title">{{ t("automation.runDetail.stats.outputTitle") }}</div>
      <div class="stat-value text-base">{{ outputSummary }}</div>
      <div class="stat-desc">{{ t("automation.runDetail.stats.outputDescription") }}</div>
    </div>
    <div class="stat">
      <div class="stat-title">{{ t("automation.runDetail.stats.statusTitle") }}</div>
      <div class="stat-value text-base">{{ statusText }}</div>
      <div class="stat-desc">
        {{ t("automation.runDetail.progressSummary", { percent: progressPercent }) }}
      </div>
      <progress 
        class="progress progress-primary" :class="[MARGIN_TOKEN_CLASS.mt2]"
        :value="progressPercent"
        max="100"
        :aria-label="t('automation.runDetail.progressAria')"
      ></progress>
    </div>
    <div class="stat">
      <div class="stat-title">{{ t("automation.runDetail.stats.errorTitle") }}</div>
      <div class="stat-value text-base">
        {{
          errorMessage
            ? t("automation.runDetail.stats.errorYes")
            : t("automation.runDetail.stats.errorNo")
        }}
      </div>
      <div class="stat-desc">
        {{ errorMessage || t("automation.runDetail.stats.errorNone") }}
      </div>
    </div>
  </div>
</template>
