import {
  AUTOMATION_SCRAPE_TARGETS,
  type RpaCapabilityAuditEntry,
  type RpaCapabilityAuditReport,
} from "@bao/shared/constants/automation";
import { SCRAPER_JOB_QUERY_LIMIT } from "@bao/shared/constants/interview";
import {
  BADGE_ERROR_SM_CLASS,
  BADGE_GHOST_SM_CLASS,
  BADGE_INFO_SM_CLASS,
  BADGE_SUCCESS_SM_CLASS,
} from "~/constants/layout-badges";
import type {
  AutomationRunEnvelope,
  AutomationScraperRunState,
  ScrapeCapabilityCard,
  ScrapePendingAction,
  TargetRecord,
} from "~/types/automation-scraper";

export const RUN_STATE_BADGE_CLASS: Record<AutomationScraperRunState, string> = {
  idle: BADGE_GHOST_SM_CLASS,
  running: BADGE_INFO_SM_CLASS,
  success: BADGE_SUCCESS_SM_CLASS,
  error: BADGE_ERROR_SM_CLASS,
};

const createTargetRecord = <TValue>(factory: () => TValue): TargetRecord<TValue> => {
  const entries = AUTOMATION_SCRAPE_TARGETS.map((target) => [target, factory()] as const);
  return Object.fromEntries(entries) as TargetRecord<TValue>;
};

export const isScrapeCapabilityCard = (
  capability: RpaCapabilityAuditEntry,
): capability is ScrapeCapabilityCard =>
  capability.category === "scrape" && capability.target !== null;

type AutomationScraperBootstrapInput = {
  getRpaCapabilities: () => Promise<RpaCapabilityAuditReport>;
  searchJobs: (input: { limit: string }) => Promise<void>;
};

export function useAutomationScraperBootstrap({
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
  } = useAsyncData<RpaCapabilityAuditReport>(
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
  } = useAsyncData("automation-scraper-jobs", async () => {
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
