import type {
  AutomationScrapeTarget,
  RpaCapabilityAuditReport,
} from "@bao/shared/constants/automation";
import { JOB_PREVIEW_LIMIT } from "@bao/shared/constants/interview";
import type { Ref } from "vue";
import type { ComposerTranslation } from "vue-i18n";
import { isScrapeCapabilityCard } from "~/composables/automation-scraper-bootstrap";
import {
  createAutomationPresentation,
  createAutomationSummaryStats,
} from "~/composables/automation-scraper-presentation";
import type {
  AutomationRunEnvelope,
  AutomationScraperRunState,
  ScrapeCapabilityCard,
} from "~/types/automation-scraper";

type AutomationScraperJobView = {
  readonly id: string;
  readonly title: string;
  readonly company: string;
  readonly location: string;
  readonly postedDate: string;
  readonly enrichment?: {
    readonly summary?: string;
    readonly interviewFocusAreas: readonly string[];
  };
};

type AutomationScraperDerivedInput = {
  capabilityAuditData: Ref<RpaCapabilityAuditReport | null | undefined>;
  fallbackLocale: Readonly<{
    value: string | boolean | readonly string[] | Record<string, readonly string[]>;
  }>;
  jobs: Ref<readonly AutomationScraperJobView[]>;
  lastRunAt: Record<AutomationScrapeTarget, string | null>;
  latestRuns: Record<AutomationScrapeTarget, AutomationRunEnvelope | null>;
  locale: Ref<string>;
  runStates: Record<AutomationScrapeTarget, AutomationScraperRunState>;
};

function useAutomationJobFeedDerived(jobs: Ref<readonly AutomationScraperJobView[]>) {
  const sortedJobs = computed(() => {
    const rows = [...jobs.value];
    rows.sort((left, right) => {
      const leftTime = new Date(left.postedDate).getTime();
      const rightTime = new Date(right.postedDate).getTime();
      return rightTime - leftTime;
    });
    return rows;
  });

  return {
    enrichedJobCount: computed(
      () => sortedJobs.value.filter((job) => typeof job.enrichment?.summary === "string").length,
    ),
    jobCount: computed(() => sortedJobs.value.length),
    topJobs: computed(() => sortedJobs.value.slice(0, JOB_PREVIEW_LIMIT)),
  };
}

function useAutomationCapabilityDerived(
  capabilityAuditData: Ref<RpaCapabilityAuditReport | null | undefined>,
  runStates: Record<AutomationScrapeTarget, AutomationScraperRunState>,
) {
  const capabilityAudit = computed(() => capabilityAuditData.value ?? null);
  const scrapeCapabilities = computed<readonly ScrapeCapabilityCard[]>(() =>
    (capabilityAudit.value?.capabilities ?? []).filter(isScrapeCapabilityCard),
  );

  return {
    availableManualRunCount: computed(
      () => scrapeCapabilities.value.filter((capability) => capability.manualRunAvailable).length,
    ),
    configuredCapabilityCount: computed(
      () => scrapeCapabilities.value.filter((capability) => capability.configured).length,
    ),
    overallJobState: computed<AutomationScraperRunState>(() => {
      const jobTargets = scrapeCapabilities.value.filter(
        (capability) => capability.target !== "studios",
      );
      if (jobTargets.some((capability) => runStates[capability.target] === "running")) {
        return "running";
      }
      if (jobTargets.some((capability) => runStates[capability.target] === "error")) {
        return "error";
      }
      if (jobTargets.some((capability) => runStates[capability.target] === "success")) {
        return "success";
      }
      return "idle";
    }),
    scrapeCapabilities,
  };
}

export function useAutomationScraperDerived(
  {
    capabilityAuditData,
    fallbackLocale,
    jobs,
    lastRunAt,
    latestRuns,
    locale,
    runStates,
  }: AutomationScraperDerivedInput,
  t: ComposerTranslation,
) {
  const jobFeed = useAutomationJobFeedDerived(jobs);
  const capabilityState = useAutomationCapabilityDerived(capabilityAuditData, runStates);
  const presentation = createAutomationPresentation(
    { fallbackLocale, lastRunAt, latestRuns, locale },
    t,
  );
  const summaryStats = createAutomationSummaryStats(capabilityState, jobFeed, presentation);

  return {
    availableManualRunCount: capabilityState.availableManualRunCount,
    capabilityAvailabilityBadgeClass: (capability: ScrapeCapabilityCard) =>
      presentation.capabilityAvailabilityBadgeClass(capability),
    capabilityAvailabilityLabel: (capability: ScrapeCapabilityCard) =>
      presentation.capabilityAvailabilityLabel(capability),
    cardDescription: (target: AutomationScrapeTarget) => presentation.cardDescription(target),
    cardRunAria: (target: AutomationScrapeTarget) => presentation.cardRunAria(target),
    cardRunButtonLabel: (target: AutomationScrapeTarget) => presentation.cardRunButtonLabel(target),
    configuredCapabilityCount: capabilityState.configuredCapabilityCount,
    hasJobEnrichment: (job: AutomationScraperJobView) => presentation.hasJobEnrichment(job),
    jobCount: jobFeed.jobCount,
    jobInterviewFocusAreas: (job: AutomationScraperJobView) =>
      presentation.jobInterviewFocusAreas(job),
    latestRunNoticeText: (target: AutomationScrapeTarget) =>
      presentation.latestRunNoticeText(target),
    latestRunStatusText: (target: AutomationScrapeTarget) =>
      presentation.latestRunStatusText(target),
    relativePostedDate: (date: string) => presentation.relativePostedDate(date),
    runStateBadgeClass: (state: AutomationScraperRunState) =>
      presentation.runStateBadgeClass(state),
    runStateLabel: (state: AutomationScraperRunState) => presentation.runStateLabel(state),
    scrapeCapabilities: capabilityState.scrapeCapabilities,
    summaryStats,
    topJobs: jobFeed.topJobs,
  };
}
