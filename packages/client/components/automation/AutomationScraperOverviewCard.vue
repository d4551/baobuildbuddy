<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
  runsRoute: string;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="card card-border bg-base-100">
    <div class="card-body gap-4">
      <div class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-widest text-primary">
          {{ t("automation.scraper.overview.eyebrow") }}
        </p>
        <h2 class="card-title">{{ t("automation.scraper.overview.title") }}</h2>
        <p class="text-sm text-secondary">
          {{ t("automation.scraper.overview.description") }}
        </p>
      </div>

      <ul
        class="steps steps-vertical w-full"
        :aria-label="t('automation.scraper.stepsAria')"
      >
        <li class="step step-primary">{{ t("automation.scraper.steps.run") }}</li>
        <li class="step">{{ t("automation.scraper.steps.review") }}</li>
        <li class="step">{{ t("automation.scraper.steps.interview") }}</li>
      </ul>

      <div class="rounded-box border border-base-300 bg-base-200 p-4">
        <p class="text-sm font-medium text-base-content">
          {{ t("automation.scraper.overview.workflowTitle") }}
        </p>
        <p class="mt-1 text-sm text-secondary">
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
