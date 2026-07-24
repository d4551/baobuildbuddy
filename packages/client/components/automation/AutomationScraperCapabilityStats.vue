<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { STATS_SHELL_VARIANT_CLASS, TYPOGRAPHY_SCALE_CLASS } from "~/constants/layout";

defineProps<{
  readinessLabel: string;
  readinessColorClass: string;
  issueCount: number;
  latestRunStateLabel: string;
  latestRunColorClass: string;
  latestRunDescription: string;
}>();

const { t } = useI18n();
</script>

<template>
  <div :class="[STATS_SHELL_VARIANT_CLASS.xl]">
    <div class="stat">
      <div class="stat-title">{{ t("automation.scraper.providerCard.readinessTitle") }}</div>
      <div class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.xl2, readinessColorClass]">
        {{ readinessLabel }}
      </div>
      <div class="stat-desc">
        {{ t("automation.scraper.providerCard.readinessDescription") }}
      </div>
    </div>
    <div class="stat">
      <div class="stat-title">{{ t("automation.scraper.providerCard.issuesTitle") }}</div>
      <div class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.xl2, issueCount === 0 ? 'text-success' : 'text-warning']">
        {{ issueCount }}
      </div>
      <div class="stat-desc">
        {{
          issueCount === 0
            ? t("automation.scraper.providerCard.issuesReady")
            : t("automation.scraper.providerCard.issuesNeedsAttention")
        }}
      </div>
    </div>
    <div class="stat">
      <div class="stat-title">{{ t("automation.scraper.providerCard.latestRunTitle") }}</div>
      <div class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.xl2, latestRunColorClass]">
        {{ latestRunStateLabel }}
      </div>
      <div class="stat-desc">
        {{ latestRunDescription }}
      </div>
    </div>
  </div>
</template>
