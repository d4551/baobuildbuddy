/**
 * Automation runs list page: filters, live WS merge, sort, formatters.
 */
import {
  AUTOMATION_RUN_STATUSES,
  AUTOMATION_RUN_TYPES,
  type AutomationRunStatus,
  type AutomationRunType,
} from "@bao/shared/constants/automation";
import type { RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { createAutomationRunsFormatters } from "~/composables/automation-runs-page-format";
import { useAutomationRunsLiveSync } from "~/composables/automation-runs-page-live";
import {
  isLiveRun,
  sortRunsByStatusThenCreated,
} from "~/composables/automation-runs-page-merge";
import { useAutomation } from "~/composables/useAutomation";
import { getErrorMessage } from "~/utils/errors";

export type RunFilterType = "" | AutomationRunType;
export type RunFilterStatus = "" | AutomationRunStatus;

const buildFilterOptions = <T extends string>(
  values: readonly T[],
  t: ReturnType<typeof useI18n>["t"],
  keyPrefix: string,
) =>
  values.map((value) => ({
    value,
    label: t(`${keyPrefix}.${value}`),
  }));

const buildRunsQuery = (
  statusFilter: RunFilterStatus,
  typeFilter: RunFilterType,
): { type?: AutomationRunType; status?: AutomationRunStatus } => {
  const params: { type?: AutomationRunType; status?: AutomationRunStatus } = {};
  if (statusFilter) params.status = statusFilter;
  if (typeFilter) params.type = typeFilter;
  return params;
};

export function useAutomationRunsPage() {
  const { t, locale, fallbackLocale } = useI18n();
  const statusFilter = ref<RunFilterStatus>("");
  const typeFilter = ref<RunFilterType>("");
  const { fetchRuns, subscribeToRun } = useAutomation();
  const liveRunById = ref<Record<string, RpaRunExecutionEnvelope>>({});

  const typeOptions = computed(() =>
    buildFilterOptions(AUTOMATION_RUN_TYPES, t, "automation.runs.typeOptions"),
  );
  const statusOptions = computed(() =>
    buildFilterOptions(AUTOMATION_RUN_STATUSES, t, "automation.runs.statusOptions"),
  );
  const query = computed(() => buildRunsQuery(statusFilter.value, typeFilter.value));

  const { data: runs, status: runFetchStatus, error, refresh } = fetchRuns(query);
  watch(query, () => {
    refresh().then(
      () => undefined,
      () => undefined,
    );
  });
  useAutomationRunsLiveSync(runs, subscribeToRun, liveRunById);

  const isLoading = computed(() => runFetchStatus.value === "pending");
  const errorMessage = computed(() =>
    error.value ? getErrorMessage(error.value, t("automation.runs.loadErrorFallback")) : "",
  );
  const sortedRuns = computed(() =>
    sortRunsByStatusThenCreated((runs.value || []).map((run) => liveRunById.value[run.id] || run)),
  );
  const formatters = createAutomationRunsFormatters(
    t,
    () => locale.value,
    () => fallbackLocale.value,
    () => t("automation.runs.list.notAvailable"),
  );
  const resolveRowClass = (run: RpaRunExecutionEnvelope): Record<string, boolean> => ({
    "bg-base-200": isLiveRun(run),
  });

  return {
    t,
    statusFilter,
    typeFilter,
    typeOptions,
    statusOptions,
    isLoading,
    error,
    errorMessage,
    refresh,
    sortedRuns,
    isLiveRun,
    ...formatters,
    resolveRowClass,
  };
}
