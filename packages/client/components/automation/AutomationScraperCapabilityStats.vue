<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  STATS_SHELL_VARIANT_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import type {
  AutomationScraperRunState,
  ScrapeCapabilityCard,
} from "~/types/automation-scraper";

defineProps<{
  capability: ScrapeCapabilityCard;
  runState: AutomationScraperRunState;
  issueCount: number;
  readinessValueClass: string;
  latestRunValueClass: string;
  capabilityAvailabilityLabel: (capability: ScrapeCapabilityCard) => string;
  runStateLabel: (state: AutomationScraperRunState) => string;
  latestRunStatusText: (target: ScrapeCapabilityCard["target"]) => string;
  hasLatestRun: boolean;
}>();

const { t } = useI18n();
</script>

<template>
  <div :class="[STATS_SHELL_VARIANT_CLASS.xl]">
    <div class="stat">
      <div class="stat-title">{{ t("automation.scraper.providerCard.readinessTitle") }}</div>
      <div class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.xl2, readinessValueClass]">
        {{ capabilityAvailabilityLabel(capability) }}
      </div>
      <div class="stat-desc">
        {{ t("automation.scraper.providerCard.readinessDescription") }}
      </div>
    </div>
    <div class="stat">
      <div class="stat-title">{{ t("automation.scraper.providerCard.issuesTitle") }}</div>
      <div
        class="stat-value"
        :class="[TYPOGRAPHY_SCALE_CLASS.xl2, issueCount === 0 ? 'text-success' : 'text-warning']"
      >
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
      <div class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.xl2, latestRunValueClass]">
        {{ runStateLabel(runState) }}
      </div>
      <div class="stat-desc">
        {{
          hasLatestRun
            ? latestRunStatusText(capability.target)
            : t("automation.scraper.providerCard.latestRunDescription")
        }}
      </div>
    </div>
  </div>
</template>
