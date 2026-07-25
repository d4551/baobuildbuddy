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

  const typeOptions = computed(() =>
    AUTOMATION_RUN_TYPES.map((runType) => ({
      value: runType,
      label: t(`automation.runs.typeOptions.${runType}`),
    })),
  );
  const statusOptions = computed(() =>
    AUTOMATION_RUN_STATUSES.map((runStatus) => ({
      value: runStatus,
      label: t(`automation.runs.statusOptions.${runStatus}`),
    })),
  );

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
    refresh().then(() => undefined, () => undefined);
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
