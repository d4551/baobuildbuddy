import type {
  RpaCapabilityAuditEntry,
  RpaCapabilityAuditReport,
} from "@bao/shared/constants/automation";
import type { DashboardStats } from "@bao/shared/types/search";
import { isRecord } from "@bao/shared/utils/type-guards";
import type { Ref } from "vue";
import { computed } from "vue";
import type {
  AutomationHubTranslate,
  AutomationHubUiState,
} from "~/composables/automation-hub-page-contracts";
import { useAutomation } from "~/composables/useAutomation";
import { getErrorMessage } from "~/utils/errors";

const AUTOMATION_HUB_ASYNC_DATA_KEY = "automation-hub-stats";
const AUTOMATION_HUB_CAPABILITIES_ASYNC_DATA_KEY = "automation-hub-capabilities";

const readApiData = <TData>(
  response: {
    data: TData;
    error?: unknown;
  },
  fallbackMessage: string,
): TData => {
  if (!(isRecord(response) && "data" in response)) {
    throw new Error(fallbackMessage);
  }
  if ("error" in response && response.error) {
    throw new Error(getErrorMessage(response.error, fallbackMessage));
  }
  return response.data;
};

const useAutomationHubStatsData = (t: AutomationHubTranslate) => {
  const api = useApi();

  return useAsyncData<DashboardStats | null>(
    AUTOMATION_HUB_ASYNC_DATA_KEY,
    async () => {
      const response = await api.stats.dashboard.get();
      return readApiData(response, t("automation.hub.loadErrorFallback"));
    },
    {
      lazy: false,
      server: true,
    },
  );
};

const useAutomationHubCapabilityData = (
  getRpaCapabilities: () => Promise<RpaCapabilityAuditReport>,
) =>
  useAsyncData<RpaCapabilityAuditReport>(
    AUTOMATION_HUB_CAPABILITIES_ASYNC_DATA_KEY,
    () => getRpaCapabilities(),
    {
      lazy: false,
      server: true,
    },
  );

const createAutomationHubStatsState = (data: Ref<DashboardStats | null | undefined>) => {
  const stats = computed(() => data.value ?? null);
  return {
    stats,
    totalRuns: computed(() => stats.value?.automation.totalRuns ?? 0),
    todayRuns: computed(() => stats.value?.automation.todayRuns ?? 0),
    successRate: computed(() => stats.value?.automation.successRate ?? 0),
  };
};

const createAutomationHubCapabilityState = (
  capabilityAuditData: Ref<RpaCapabilityAuditReport | null | undefined>,
) => {
  const capabilityAudit = computed(() => capabilityAuditData.value ?? null);
  return {
    capabilitySummary: computed(() => capabilityAudit.value?.summary ?? null),
    capabilityEntries: computed<readonly RpaCapabilityAuditEntry[]>(
      () => capabilityAudit.value?.capabilities ?? [],
    ),
  };
};

export const useAutomationHubPageData = (t: AutomationHubTranslate) => {
  const { getRpaCapabilities } = useAutomation();
  const { data, status, error, refresh } = useAutomationHubStatsData(t);
  const {
    data: capabilityAuditData,
    status: capabilityAuditStatus,
    error: capabilityAuditError,
    refresh: refreshCapabilityAudit,
  } = useAutomationHubCapabilityData(getRpaCapabilities);
  const uiState = computed<AutomationHubUiState>(() => {
    if (status.value === "pending") return "loading";
    if (status.value === "error") return "error";
    if (status.value === "idle") return "idle";
    return "success";
  });
  const statsState = createAutomationHubStatsState(data);
  const capabilityState = createAutomationHubCapabilityState(capabilityAuditData);

  return {
    error,
    uiState,
    stats: statsState.stats,
    totalRuns: statsState.totalRuns,
    todayRuns: statsState.todayRuns,
    successRate: statsState.successRate,
    capabilityAuditStatus,
    capabilityAuditError,
    capabilitySummary: capabilityState.capabilitySummary,
    capabilityEntries: capabilityState.capabilityEntries,
    refresh,
    refreshCapabilityAudit,
  };
};
