import {
  AUTOMATION_RUN_STATUSES,
  AUTOMATION_RUN_TYPES,
  type AutomationRunStatus,
  type AutomationRunType,
} from "@bao/shared/constants/automation";
import { computed, ref, watch } from "vue";
import type { useI18n } from "vue-i18n";
import { useAutomation } from "~/composables/useAutomation";
import { getErrorMessage } from "~/utils/errors";

type RunFilterType = "" | AutomationRunType;
type RunFilterStatus = "" | AutomationRunStatus;
type Translate = ReturnType<typeof useI18n>["t"];

export function createAutomationRunsPageQuery(t: Translate) {
  const statusFilter = ref<RunFilterStatus>("");
  const typeFilter = ref<RunFilterType>("");
  const { fetchRuns, subscribeToRun } = useAutomation();

  const typeOptions = computed(() => {
    const options: Array<{ value: AutomationRunType; label: string }> = [];
    for (const runType of AUTOMATION_RUN_TYPES) {
      options.push({
        value: runType,
        label: t(`automation.runs.typeOptions.${runType as string}`),
      });
    }
    return options;
  });
  const statusOptions = computed(() => {
    const options: Array<{ value: AutomationRunStatus; label: string }> = [];
    for (const runStatus of AUTOMATION_RUN_STATUSES) {
      options.push({
        value: runStatus,
        label: t(`automation.runs.statusOptions.${runStatus as string}`),
      });
    }
    return options;
  });

  const query = computed(() => {
    const params: { type?: AutomationRunType; status?: AutomationRunStatus } = {};
    if (statusFilter.value) {
      params.status = statusFilter.value;
    }
    if (typeFilter.value) {
      params.type = typeFilter.value;
    }
    return params;
  });

  const { data: runs, status: runFetchStatus, error, refresh } = fetchRuns(query);
  watch(query, () => {
    refresh().then(
      () => undefined,
      () => undefined,
    );
  });

  const isLoading = computed(() => runFetchStatus.value === "pending");
  const errorMessage = computed(() =>
    error.value ? getErrorMessage(error.value, t("automation.runs.loadErrorFallback")) : "",
  );

  return {
    statusFilter,
    typeFilter,
    typeOptions,
    statusOptions,
    runs,
    subscribeToRun,
    isLoading,
    error,
    errorMessage,
    refresh,
  };
}
