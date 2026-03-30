import {
  AUTOMATION_SCRAPE_TARGETS,
  type RpaCapabilityAuditEntry,
  type RpaCapabilityAuditReport,
  type RpaRunExecutionEnvelope,
  SCRAPER_JOB_QUERY_LIMIT,
} from "@bao/shared";
import type {
  AutomationRunEnvelope,
  AutomationScraperRunState,
  ScrapeCapabilityCard,
  ScrapePendingAction,
  TargetRecord,
} from "~/types/automation-scraper";

export const DATE_FORMAT_OPTIONS = {
  dateStyle: "medium",
  timeStyle: "short",
} as const satisfies Intl.DateTimeFormatOptions;

export const RUN_STATE_BADGE_CLASS: Record<AutomationScraperRunState, string> = {
  idle: "badge-ghost",
  running: "badge-info",
  success: "badge-success",
  error: "badge-error",
};

const createTargetRecord = <TValue>(factory: () => TValue): TargetRecord<TValue> =>
  Object.fromEntries(AUTOMATION_SCRAPE_TARGETS.map((target) => [target, factory()])) as TargetRecord<TValue>;

export const isScrapeCapabilityCard = (
  capability: RpaCapabilityAuditEntry,
): capability is ScrapeCapabilityCard =>
  capability.category === "scrape" && capability.target !== null;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function resolveScheduledRunAt(run: RpaRunExecutionEnvelope): string {
  const runInput = run.input;
  if (!(runInput && isRecord(runInput))) {
    return run.createdAt;
  }

  const scheduleValue = runInput.schedule;
  if (!isRecord(scheduleValue)) {
    return run.createdAt;
  }

  return typeof scheduleValue.runAt === "string" && scheduleValue.runAt.length > 0
    ? scheduleValue.runAt
    : run.createdAt;
}

export function toIsoTimestamp(dateTimeLocal: string): string | null {
  const parsed = new Date(dateTimeLocal);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
    return null;
  }

  return parsed.toISOString();
}

type AutomationScraperBootstrapInput = {
  getRpaCapabilities: () => Promise<RpaCapabilityAuditReport>;
  searchJobs: (input: { limit: string }) => Promise<void>;
};

export async function useAutomationScraperBootstrap({
  getRpaCapabilities,
  searchJobs,
}: AutomationScraperBootstrapInput) {
  const runStates = reactive(createTargetRecord<AutomationScraperRunState>(() => "idle"));
  const runMessages = reactive(createTargetRecord<string>(() => ""));
  const lastRunAt = reactive(createTargetRecord<string | null>(() => null));
  const scheduledRunAt = reactive(createTargetRecord<string>(() => ""));
  const latestRuns = reactive(createTargetRecord<AutomationRunEnvelope | null>(() => null));
  const pendingAction = ref<ScrapePendingAction | null>(null);

  const {
    data: capabilityAuditData,
    status: capabilityAuditStatus,
    error: capabilityAuditError,
    refresh: refreshCapabilityAudit,
  } = await useAsyncData<RpaCapabilityAuditReport>(
    "automation-scraper-capabilities",
    () => getRpaCapabilities(),
    {
      lazy: false,
      server: true,
    },
  );

  const {
    status: scraperJobsStatus,
    error: scraperJobsError,
    refresh: refreshScraperJobs,
  } = await useAsyncData("automation-scraper-jobs", async () => {
    await searchJobs({ limit: String(SCRAPER_JOB_QUERY_LIMIT) });
    return true;
  });

  const scraperJobsPending = computed(
    () => scraperJobsStatus.value === "pending" || scraperJobsStatus.value === "idle",
  );

  return {
    capabilityAuditData,
    capabilityAuditError,
    capabilityAuditStatus,
    lastRunAt,
    latestRuns,
    pendingAction,
    refreshCapabilityAudit,
    refreshScraperJobs,
    runMessages,
    runStates,
    scheduledRunAt,
    scraperJobsError,
    scraperJobsPending,
    scraperJobsStatus,
  };
}
