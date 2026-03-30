<script setup lang="ts">
import { useI18n } from "vue-i18n";

definePageMeta({
  middleware: ["auth"],
});

const { t } = useI18n();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("automation.scraper.title"),
    description: t("automation.scraper.subtitle"),
  });
}

const {
  APP_ROUTE_BUILDERS,
  APP_ROUTES,
  capabilityAuditError,
  capabilityAuditStatus,
  cardDescription,
  cardRunAria,
  cardRunButtonLabel,
  capabilityAvailabilityBadgeClass,
  capabilityAvailabilityLabel,
  getErrorMessage,
  hasJobEnrichment,
  isPendingAction,
  jobsLoading,
  latestRunNoticeText,
  latestRunStatusText,
  latestRuns,
  pendingAction,
  refreshCapabilityAudit,
  refreshScraperJobs,
  relativePostedDate,
  runMessages,
  runScrapeTarget,
  runStateBadgeClass,
  runStateLabel,
  runStates,
  scheduleScrapeRun,
  scheduledRunAt,
  scrapeCapabilities,
  scraperJobsError,
  scraperJobsPending,
  scraperJobsStatus,
  startJobInterview,
  summaryStats,
  topJobs,
  jobInterviewFocusAreas,
} = await useAutomationScraperPage();

function updateScheduledRunAt(target: keyof typeof scheduledRunAt, value: string): void {
  scheduledRunAt[target] = value;
}
</script>

<template>
  <PageScaffold tag="section" width-token="content" labelled-by="automation-scraper-title">
    <PageHeroHeader
      title-id="automation-scraper-title"
      :title="t('automation.scraper.title')"
      :description="t('automation.scraper.subtitle')"
      description-class="text-base-content/70"
      density="compact"
    />

    <div
      role="alert"
      class="alert alert-info alert-soft alert-vertical gap-4 rounded-box border border-info/20 bg-base-100 sm:alert-horizontal"
    >
      <div class="space-y-1">
        <p class="font-display text-sm font-semibold uppercase tracking-widest text-info">
          {{ t("automation.hub.audit.title") }}
        </p>
        <p class="text-sm text-base-content/75">
          {{ t("automation.hub.audit.description") }}
        </p>
      </div>
      <NuxtLink :to="APP_ROUTES.automationRuns" class="btn btn-info btn-soft btn-sm">
        {{ t("automation.hub.viewRunsButton") }}
      </NuxtLink>
    </div>

    <ul
      class="steps steps-vertical w-full rounded-box border border-base-300 bg-base-100 p-4 shadow-sm lg:steps-horizontal"
      :aria-label="t('automation.scraper.stepsAria')"
    >
      <li class="step step-primary">{{ t("automation.scraper.steps.run") }}</li>
      <li class="step">{{ t("automation.scraper.steps.review") }}</li>
      <li class="step">{{ t("automation.scraper.steps.interview") }}</li>
    </ul>

    <LoadingSkeleton
      v-if="capabilityAuditStatus === 'pending' || capabilityAuditStatus === 'idle'"
      :lines="6"
    />

    <BootstrapErrorAlert
      v-else-if="capabilityAuditStatus === 'error'"
      :message="getErrorMessage(capabilityAuditError, t('automation.scraper.errors.capabilitiesLoadFailed'))"
      :retry-label="t('automation.scraper.errors.capabilitiesRetry')"
      :retry-aria-label="t('automation.scraper.errors.capabilitiesRetryAria')"
      @retry="() => refreshCapabilityAudit()"
    />

    <template v-else>
      <BootstrapErrorAlert
        v-if="scraperJobsStatus === 'error'"
        :message="getErrorMessage(scraperJobsError, t('automation.scraper.errors.jobsFeedLoadFailed'))"
        :retry-label="t('automation.scraper.errors.jobsFeedRetry')"
        :retry-aria-label="t('automation.scraper.errors.jobsFeedRetryAria')"
        @retry="() => refreshScraperJobs()"
      />

      <LoadingSkeleton v-if="scraperJobsPending" :lines="6" />

      <template v-else>
        <StatsRow :stats="summaryStats" />

        <AutomationScraperCapabilityGrid
          :capabilities="scrapeCapabilities"
          :run-states="runStates"
          :run-messages="runMessages"
          :scheduled-run-at="scheduledRunAt"
          :latest-runs="latestRuns"
          :pending-action="pendingAction"
          :card-description="cardDescription"
          :card-run-aria="cardRunAria"
          :card-run-button-label="cardRunButtonLabel"
          :capability-availability-label="capabilityAvailabilityLabel"
          :capability-availability-badge-class="capabilityAvailabilityBadgeClass"
          :run-state-label="runStateLabel"
          :run-state-badge-class="runStateBadgeClass"
          :latest-run-notice-text="latestRunNoticeText"
          :latest-run-status-text="latestRunStatusText"
          :is-pending-action="isPendingAction"
          :automation-runs-route="APP_ROUTES.automationRuns"
          :build-run-detail-route="APP_ROUTE_BUILDERS.automationRunDetail"
          @run="runScrapeTarget"
          @schedule="scheduleScrapeRun"
          @update:scheduled-run-at="updateScheduledRunAt"
        />

        <AutomationScraperJobsCard
          :jobs-loading="jobsLoading"
          :top-jobs="topJobs"
          :jobs-route="APP_ROUTES.jobs"
          :has-job-enrichment="hasJobEnrichment"
          :job-interview-focus-areas="jobInterviewFocusAreas"
          :relative-posted-date="relativePostedDate"
          @interview="startJobInterview"
        />
      </template>
    </template>
  </PageScaffold>
</template>
