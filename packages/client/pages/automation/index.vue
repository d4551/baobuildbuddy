<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared";
import { getErrorMessage } from "~/utils/errors";
const {
  t,
  error,
  uiState,
  totalRuns,
  todayRuns,
  successRate,
  pipelineSteps,
  nextPipelineStepLabel,
  capabilityAuditStatus,
  capabilityAuditError,
  capabilitySummary,
  capabilityEntries,
  orderedCards,
  primaryCardId,
  retryLoad,
  refreshCapabilityAudit,
  capabilityStatusClass,
  capabilityStatusLabel,
} = await useAutomationHubPage();

useServerSeoMeta({
  title: t("automation.hub.pageTitle"),
  description: t("automation.hub.pageDescription"),
});
</script>

<template>
  <PageScaffold tag="section" labelled-by="automation-hub-title">
    <PageHeroHeader
      title-id="automation-hub-title"
      :title="t('automation.hub.title')"
      :description="t('automation.hub.pageDescription')"
    >
      <template #actions>
        <NuxtLink
          :to="APP_ROUTES.automationRuns"
          class="btn btn-outline"
          :aria-label="t('automation.hub.viewRunsButton')"
        >
          {{ t("automation.hub.viewRunsButton") }}
        </NuxtLink>
      </template>
    </PageHeroHeader>

    <LoadingSkeleton v-if="uiState === 'loading' || uiState === 'idle'" variant="stats" :lines="4" />

    <BootstrapErrorAlert
      v-else-if="uiState === 'error'"
      :message="getErrorMessage(error, t('automation.hub.loadErrorFallback'))"
      :retry-label="t('automation.hub.retryButtonLabel')"
      :retry-aria-label="t('automation.hub.retryAria')"
      @retry="retryLoad"
    />

    <EmptyState
      v-else-if="uiState === 'empty'"
      title-key="automation.hub.emptyStateTitle"
      description-key="automation.hub.emptyStateDescription"
      cta-label-key="automation.hub.emptyStateCta"
      :cta-to="APP_ROUTES.automationScraper"
    />

    <template v-else>
      <StatsRow
        background-class="border border-base-300 bg-base-200"
        :stats="[
          { titleKey: 'automation.hub.stats.totalRunsTitle', value: totalRuns, descKey: 'automation.hub.stats.totalRunsDescription' },
          { titleKey: 'automation.hub.stats.todayRunsTitle', value: todayRuns, descKey: 'automation.hub.stats.todayRunsDescription' },
          { titleKey: 'automation.hub.stats.successRateTitle', value: `${successRate}%`, descKey: 'automation.hub.stats.successRateDescription' },
        ]"
      />

      <WorkPipeline
        v-bind="{
          title: t('automation.hub.pipelineTitle'),
          description: t('automation.hub.pipelineDescription'),
          ariaLabel: t('automation.hub.pipelineAria'),
          steps: pipelineSteps,
          nextStepLabel: nextPipelineStepLabel,
        }"
      />

      <AutomationHubAuditCard
        :capability-audit-status="capabilityAuditStatus"
        :capability-audit-error="capabilityAuditError"
        :capability-summary="capabilitySummary"
        :capability-entries="capabilityEntries"
        :capability-status-class="capabilityStatusClass"
        :capability-status-label="capabilityStatusLabel"
        @retry="refreshCapabilityAudit"
      />

      <AutomationHubActionGrid
        :ordered-cards="orderedCards"
        :primary-card-id="primaryCardId"
      />
    </template>
  </PageScaffold>
</template>
