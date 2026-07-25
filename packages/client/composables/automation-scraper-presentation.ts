import type { AutomationScrapeTarget } from "@bao/shared/constants/automation";
import { formatRelativeTimeForDate } from "@bao/shared/utils/date-helpers";
import type { ComputedRef, Ref } from "vue";
import type { ComposerTranslation } from "vue-i18n";
import { RUN_STATE_BADGE_CLASS } from "~/composables/automation-scraper-bootstrap";
import { DATE_FORMAT_OPTIONS, resolveScheduledRunAt } from "~/composables/schedule-timestamp";
import type {
  AutomationRunEnvelope,
  AutomationScraperRunState,
  AutomationScraperSummaryStat,
  ScrapeCapabilityCard,
} from "~/types/automation-scraper";
import { formatDateWithLocale } from "~/utils/locale-format";

function createAutomationDateFormatting(
  input: {
    fallbackLocale: Ref<unknown>;
    locale: Ref<string>;
  },
  t: ComposerTranslation,
) {
  const formatRunTime = (value: string | null): string => {
    if (!value) {
      return t("automation.scraper.notRunYet");
    }

    const formattedDate = formatDateWithLocale(
      value,
      input.locale.value,
      input.fallbackLocale.value,
      DATE_FORMAT_OPTIONS,
    );
    return formattedDate ?? t("automation.scraper.notRunYet");
  };

  const toLocalizedDateTime = (value: string): string => {
    const formattedDate = formatDateWithLocale(
      value,
      input.locale.value,
      input.fallbackLocale.value,
      DATE_FORMAT_OPTIONS,
    );
    return formattedDate ?? value;
  };

  return {
    formatRunTime,
    toLocalizedDateTime,
  };
}

function createCapabilityPresentation(t: ComposerTranslation) {
  return {
    capabilityAvailabilityBadgeClass(capability: ScrapeCapabilityCard): string {
      if (capability.configured) {
        return "badge-success";
      }
      if (capability.enabled) {
        return "badge-warning";
      }
      return "badge-error";
    },
    capabilityAvailabilityLabel(capability: ScrapeCapabilityCard): string {
      if (capability.configured) {
        return t("automation.hub.audit.available");
      }
      if (capability.enabled) {
        return t("automation.hub.audit.needsConfig");
      }
      return t("automation.hub.audit.unavailable");
    },
  };
}

function createScraperCardPresentation(t: ComposerTranslation) {
  return {
    cardDescription(target: AutomationScrapeTarget): string {
      return target === "studios"
        ? t("automation.scraper.studioCard.description")
        : t("automation.scraper.jobCard.description");
    },
    cardRunAria(target: AutomationScrapeTarget): string {
      return target === "studios"
        ? t("automation.scraper.studioCard.runAria")
        : t("automation.scraper.jobCard.runAria");
    },
    cardRunButtonLabel(target: AutomationScrapeTarget): string {
      return target === "studios"
        ? t("automation.scraper.studioCard.runButton")
        : t("automation.scraper.jobCard.runButton");
    },
  };
}

function createJobPresentation() {
  return {
    hasJobEnrichment(job: {
      readonly enrichment?: {
        readonly summary?: string;
        readonly interviewFocusAreas: readonly string[];
      };
    }): boolean {
      return typeof job.enrichment?.summary === "string" && job.enrichment.summary.length > 0;
    },
    jobInterviewFocusAreas(job: {
      readonly enrichment?: {
        readonly summary?: string;
        readonly interviewFocusAreas: readonly string[];
      };
    }): string[] {
      return [...(job.enrichment?.interviewFocusAreas.slice(0, 2) ?? [])];
    },
  };
}

function createAutomationRunPresentation(
  input: {
    lastRunAt: Record<AutomationScrapeTarget, string | null>;
    latestRuns: Record<AutomationScrapeTarget, AutomationRunEnvelope | null>;
  },
  formatting: ReturnType<typeof createAutomationDateFormatting>,
  t: ComposerTranslation,
) {
  return {
    latestRunNoticeText(target: AutomationScrapeTarget): string {
      const run = input.latestRuns[target];
      if (!run) {
        return "";
      }
      if (run.status === "pending") {
        return t("automation.scraper.schedule.scheduledForLabel", {
          date: formatting.toLocalizedDateTime(resolveScheduledRunAt(run)),
        });
      }
      return t("automation.scraper.lastRunLabel", {
        value: formatting.formatRunTime(input.lastRunAt[target]),
      });
    },
    latestRunStatusText(target: AutomationScrapeTarget): string {
      const run = input.latestRuns[target];
      if (!run) {
        return "";
      }
      return t("automation.scraper.schedule.statusLabel", {
        status: run.status,
      });
    },
    relativePostedDate(date: string): string {
      return formatRelativeTimeForDate(date, t, {
        keyPrefix: "automation.scraper",
        unknownKey: "automation.scraper.unknownPostedDate",
      });
    },
    runStateBadgeClass(state: AutomationScraperRunState): string {
      return RUN_STATE_BADGE_CLASS[state];
    },
    runStateLabel(state: AutomationScraperRunState): string {
      if (state === "running") return t("automation.scraper.state.running");
      if (state === "success") return t("automation.scraper.state.success");
      if (state === "error") return t("automation.scraper.state.error");
      return t("automation.scraper.state.idle");
    },
  };
}

export function createAutomationPresentation(
  input: {
    fallbackLocale: Ref<unknown>;
    lastRunAt: Record<AutomationScrapeTarget, string | null>;
    latestRuns: Record<AutomationScrapeTarget, AutomationRunEnvelope | null>;
    locale: Ref<string>;
  },
  t: ComposerTranslation,
) {
  const formatting = createAutomationDateFormatting(input, t);

  return {
    ...createCapabilityPresentation(t),
    ...createScraperCardPresentation(t),
    ...createJobPresentation(),
    ...createAutomationRunPresentation(input, formatting, t),
  };
}

export function createAutomationSummaryStats(
  capabilityState: {
    scrapeCapabilities: ComputedRef<readonly ScrapeCapabilityCard[]>;
    configuredCapabilityCount: ComputedRef<number>;
    overallJobState: ComputedRef<AutomationScraperRunState>;
  },
  jobFeed: {
    jobCount: ComputedRef<number>;
    enrichedJobCount: ComputedRef<number>;
  },
  presentation: Pick<ReturnType<typeof createAutomationPresentation>, "runStateLabel">,
) {
  return computed<readonly AutomationScraperSummaryStat[]>(() => [
    {
      titleKey: "automation.hub.audit.summary.total",
      value: capabilityState.scrapeCapabilities.value.length,
      valueClass: "text-primary",
      descKey: "automation.hub.audit.summary.totalDesc",
    },
    {
      titleKey: "automation.hub.audit.summary.configured",
      value: capabilityState.configuredCapabilityCount.value,
      valueClass: "text-secondary",
      descKey: "automation.hub.audit.summary.configuredDesc",
    },
    {
      titleKey: "automation.scraper.stats.availableJobsTitle",
      value: jobFeed.jobCount.value,
      valueClass: "text-primary",
      descKey: "automation.scraper.stats.availableJobsDescription",
    },
    {
      titleKey: "automation.scraper.stats.enrichedJobsTitle",
      value: jobFeed.enrichedJobCount.value,
      valueClass: "text-secondary",
      descKey: "automation.scraper.stats.enrichedJobsDescription",
    },
    {
      titleKey: "automation.scraper.stats.jobStatusTitle",
      value: presentation.runStateLabel(capabilityState.overallJobState.value),
      valueClass: "text-base-content",
      descKey: "automation.scraper.stats.jobStatusDescription",
    },
  ]);
}
