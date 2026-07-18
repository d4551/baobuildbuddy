<script setup lang="ts">
import { FLEX_GAP_TOKEN_CLASS, FLUID_WIDTH_CLASS, MARGIN_TOKEN_CLASS, PADDING_TOKEN_CLASS, STACK_SPACE_Y_TOKEN_CLASS, TYPOGRAPHY_SCALE_CLASS } from "~/constants/layout";
import { useI18n } from "vue-i18n";

defineProps<{
  runsRoute: string;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="card card-border bg-base-100">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
        <p class="font-semibold uppercase tracking-widest text-primary" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
          {{ t("automation.scraper.overview.eyebrow") }}
        </p>
        <h2 class="card-title">{{ t("automation.scraper.overview.title") }}</h2>
        <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("automation.scraper.overview.description") }}
        </p>
      </div>

      <ul
        class="steps steps-vertical" :class="[FLUID_WIDTH_CLASS]"
        :aria-label="t('automation.scraper.stepsAria')"
      >
        <li class="step step-primary">{{ t("automation.scraper.steps.run") }}</li>
        <li class="step">{{ t("automation.scraper.steps.review") }}</li>
        <li class="step">{{ t("automation.scraper.steps.interview") }}</li>
      </ul>

      <div class="rounded-box border border-base-300 bg-base-200" :class="[PADDING_TOKEN_CLASS.p4]">
        <p class="font-medium text-base-content" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("automation.scraper.overview.workflowTitle") }}
        </p>
        <p class="text-secondary" :class="[MARGIN_TOKEN_CLASS.mt1, TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("automation.scraper.overview.workflowDescription") }}
        </p>
      </div>

      <div class="card-actions justify-start">
        <NuxtLink :to="runsRoute" class="btn btn-outline btn-sm">
          {{ t("automation.hub.viewRunsButton") }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
