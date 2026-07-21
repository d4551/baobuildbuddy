<script setup lang="ts">
defineOptions({ name: "PagesAutomationScraperPage" });

import { APP_ROUTE_QUERY_KEYS } from "@bao/shared/constants/routes";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  AUTOMATION_SCRAPER_DEFAULT_SECTION_ID,
  AUTOMATION_SCRAPER_SECTION_ITEMS,
  type AutomationScraperSectionId,
  isAutomationScraperSectionId,
} from "~/components/automation/scraper-sections";
import { OUTLINE_ACTION_CLASS, STACK_SPACE_Y_TOKEN_CLASS } from "~/constants/layout";
import { UI_SPACING_CLASS_BY_TOKEN, UI_WIDTH_CLASS_BY_TOKEN } from "~/constants/ui-layout";
import { resolveRouteSectionId } from "~/utils/route-query";

definePageMeta({
  middleware: ["auth"],
});

const { t } = useI18n();
const route = useRoute();

useSeoMeta({
  title: t("automation.scraper.title"),
  description: t("automation.scraper.subtitle"),
});

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
} = useAutomationScraperPage();

const routeSection = computed<AutomationScraperSectionId>(() =>
  resolveRouteSectionId(
    route.query[APP_ROUTE_QUERY_KEYS.section],
    isAutomationScraperSectionId,
    AUTOMATION_SCRAPER_DEFAULT_SECTION_ID,
  ),
);

const activeSection = ref<AutomationScraperSectionId>(routeSection.value);

const scraperSectionBadgeById = computed<Record<AutomationScraperSectionId, number>>(() => ({
  providers: scrapeCapabilities.value.length,
  jobs: topJobs.value.length,
}));
const contentScaffoldClass = computed(() => [
  UI_WIDTH_CLASS_BY_TOKEN.shell,
  UI_SPACING_CLASS_BY_TOKEN.comfortable,
]);

watch(
  routeSection,
  (value) => {
    activeSection.value = value;
  },
  { immediate: true },
);

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
      density="compact"
    >
      <template #actions>
        <NuxtLink :to="APP_ROUTES.automationRuns" :class="[OUTLINE_ACTION_CLASS]">
          {{ t("automation.hub.viewRunsButton") }}
        </NuxtLink>
      </template>
    </PageHeroHeader>

    <div :class="contentScaffoldClass">
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
          <WorkspaceSectionNavigator
            :sections="AUTOMATION_SCRAPER_SECTION_ITEMS"
            :active-section="activeSection"
            v-bind="{ ariaLabelKey: 'automation.scraper.sections.aria' }"
            :build-route="APP_ROUTE_BUILDERS.automationScraperSection"
            :badge-by-id="scraperSectionBadgeById"
          >
            <StatsRow :stats="summaryStats" />

            <template v-if="activeSection === 'providers'">
              <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
                <AutomationScraperOverviewCard :runs-route="APP_ROUTES.automationRuns" />

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
              </div>
            </template>

            <AutomationScraperJobsCard
              v-else
              :jobs-loading="jobsLoading"
              :top-jobs="topJobs"
              :jobs-route="APP_ROUTES.jobs"
              :has-job-enrichment="hasJobEnrichment"
              :job-interview-focus-areas="jobInterviewFocusAreas"
              :relative-posted-date="relativePostedDate"
              @interview="startJobInterview"
            />
          </WorkspaceSectionNavigator>
        </template>
      </template>
    </div>
  </PageScaffold>
</template>
