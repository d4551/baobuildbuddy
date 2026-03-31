<script setup lang="ts">
import {
  APP_ROUTES,
  AUTOMATION_RUN_STATUSES,
  AUTOMATION_RUN_TYPES,
  type AutomationRunStatus,
  type AutomationRunType,
  type RpaRunEvent,
  type RpaRunExecutionEnvelope,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { useAutomation } from "~/composables/useAutomation";
import { getErrorMessage } from "~/utils/errors";
import { formatDateWithLocale } from "~/utils/locale-format";

type RunFilterType = "" | AutomationRunType;
type RunFilterStatus = "" | AutomationRunStatus;

const [RUN_STATUS_PENDING, RUN_STATUS_RUNNING, RUN_STATUS_SUCCESS, RUN_STATUS_ERROR] =
  AUTOMATION_RUN_STATUSES;
const RUN_STATUS_ORDER: Record<AutomationRunStatus, number> = {
  [RUN_STATUS_RUNNING]: 0,
  [RUN_STATUS_PENDING]: 1,
  [RUN_STATUS_ERROR]: 2,
  [RUN_STATUS_SUCCESS]: 3,
};

const EMPTY_VALUE = "—";
const DATE_FORMAT_OPTIONS = {
  dateStyle: "medium",
  timeStyle: "short",
} as const satisfies Intl.DateTimeFormatOptions;

const { t, locale, fallbackLocale } = useI18n();
const statusFilter = ref<RunFilterStatus>("");
const typeFilter = ref<RunFilterType>("");
const { fetchRuns, subscribeToRun } = useAutomation();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("automation.runs.title"),
    description: t("automation.hub.cards.runHistory.description"),
  });
}

const activeSubscriptions = new Map<string, () => void>();
const liveRunById = ref<Record<string, RpaRunExecutionEnvelope>>({});

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
watch(query, () => void refresh());
const isLoading = computed(() => runFetchStatus.value === "pending");
const errorMessage = computed(() =>
  error.value ? getErrorMessage(error.value, t("automation.runs.loadErrorFallback")) : "",
);

const isLiveRun = (run: RpaRunExecutionEnvelope): boolean =>
  run.status === RUN_STATUS_PENDING || run.status === RUN_STATUS_RUNNING;

const computeProgressFromSteps = (
  currentStep: number | null,
  totalSteps: number | null,
): number => {
  if (
    typeof currentStep !== "number" ||
    typeof totalSteps !== "number" ||
    totalSteps <= 0 ||
    !Number.isFinite(currentStep) ||
    !Number.isFinite(totalSteps)
  ) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((currentStep / totalSteps) * 100)));
};

const mergeRunWithEvent = (
  run: RpaRunExecutionEnvelope,
  event: RpaRunEvent,
): RpaRunExecutionEnvelope => {
  if (event.eventType === "progress") {
    const currentStep = typeof event.step === "number" ? event.step : run.currentStep;
    const totalSteps = typeof event.totalSteps === "number" ? event.totalSteps : run.totalSteps;
    const progress =
      typeof run.progress === "number" && Number.isFinite(run.progress)
        ? run.progress
        : computeProgressFromSteps(currentStep ?? null, totalSteps ?? null);
    return {
      ...run,
      status: event.status,
      currentStep: currentStep ?? null,
      totalSteps: totalSteps ?? null,
      progress,
      updatedAt: event.timestamp,
    };
  }

  if (event.eventType === "result") {
    const outputSteps = event.result.steps.length;
    return {
      ...run,
      status: event.result.success ? RUN_STATUS_SUCCESS : RUN_STATUS_ERROR,
      output: event.result,
      error: event.result.success ? null : event.result.error,
      progress: 100,
      currentStep: outputSteps,
      totalSteps: outputSteps,
      completedAt: event.timestamp,
      updatedAt: event.timestamp,
    };
  }

  return {
    ...run,
    status: RUN_STATUS_ERROR,
    error: event.error,
    completedAt: event.timestamp,
    updatedAt: event.timestamp,
  };
};

const unsubscribeRun = (runId: string): void => {
  const unsubscribe = activeSubscriptions.get(runId);
  if (!unsubscribe) {
    return;
  }
  unsubscribe();
  activeSubscriptions.delete(runId);
};

const clearSubscriptions = (): void => {
  for (const [runId, unsubscribe] of activeSubscriptions.entries()) {
    unsubscribe();
    activeSubscriptions.delete(runId);
  }
};

const subscribeRun = (run: RpaRunExecutionEnvelope): void => {
  if (!isLiveRun(run) || activeSubscriptions.has(run.id)) {
    return;
  }
  const unsubscribe = subscribeToRun(run.id, (event) => {
    const currentRun =
      liveRunById.value[event.runId] || runs.value?.find((item) => item.id === event.runId);
    if (!currentRun) {
      return;
    }
    const mergedRun = mergeRunWithEvent(currentRun, event);
    liveRunById.value = {
      ...liveRunById.value,
      [event.runId]: mergedRun,
    };
    if (!isLiveRun(mergedRun)) {
      unsubscribeRun(event.runId);
    }
  });
  activeSubscriptions.set(run.id, unsubscribe);
};

const mergedRuns = computed<RpaRunExecutionEnvelope[]>(() =>
  (runs.value || []).map((run) => liveRunById.value[run.id] || run),
);

watch(
  mergedRuns,
  (nextRuns) => {
    const liveRunIds = new Set(nextRuns.filter((run) => isLiveRun(run)).map((run) => run.id));
    for (const runId of activeSubscriptions.keys()) {
      if (!liveRunIds.has(runId)) {
        unsubscribeRun(runId);
      }
    }
    for (const run of nextRuns) {
      subscribeRun(run);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  clearSubscriptions();
});

const sortedRuns = computed<RpaRunExecutionEnvelope[]>(() =>
  [...mergedRuns.value].sort((left, right) => {
    const statusDiff = RUN_STATUS_ORDER[left.status] - RUN_STATUS_ORDER[right.status];
    if (statusDiff !== 0) {
      return statusDiff;
    }
    const createdDiff = Date.parse(right.createdAt) - Date.parse(left.createdAt);
    if (Number.isFinite(createdDiff) && createdDiff !== 0) {
      return createdDiff;
    }
    return left.id.localeCompare(right.id);
  }),
);

const formatDate = (value: string): string => {
  const formattedDate = formatDateWithLocale(
    value,
    locale.value,
    fallbackLocale.value,
    DATE_FORMAT_OPTIONS,
  );
  return formattedDate ?? value;
};

const formatRunType = (runType: AutomationRunType): string =>
  t(`automation.runs.typeOptions.${runType}`);
const formatRunStatus = (runStatus: AutomationRunStatus): string =>
  t(`automation.runs.statusOptions.${runStatus}`);

const formatRunProgress = (run: RpaRunExecutionEnvelope): string => {
  if (typeof run.progress === "number" && Number.isFinite(run.progress)) {
    return `${Math.max(0, Math.min(100, Math.round(run.progress)))}%`;
  }
  return EMPTY_VALUE;
};

const resolveRowClass = (run: RpaRunExecutionEnvelope): Record<string, boolean> => ({
  "bg-base-200": isLiveRun(run),
});
</script>

<template>
  <PageScaffold tag="section" width-token="content" labelled-by="automation-runs-title">
    <PageHeroHeader
      title-id="automation-runs-title"
      :title="t('automation.runs.title')"
      :description="t('automation.hub.cards.runHistory.description')"
    >
      <template #actions>
        <NuxtLink
          :to="APP_ROUTES.automation"
          class="btn btn-outline"
          :aria-label="t('automation.runs.backToAutomation')"
        >
          {{ t("automation.runs.backButton") }}
        </NuxtLink>
      </template>
    </PageHeroHeader>

    <AutomationRunsFilters
      v-model:type-filter="typeFilter"
      v-model:status-filter="statusFilter"
      :type-options="typeOptions"
      :status-options="statusOptions"
      :t="t"
    />

    <LoadingSkeleton v-if="isLoading && sortedRuns.length === 0" :lines="6" />

    <BootstrapErrorAlert
      v-else-if="error"
      :title="t('automation.runs.loadErrorTitle')"
      :message="errorMessage"
      :retry-label="t('automation.hub.retryButtonLabel')"
      :retry-aria-label="t('automation.hub.retryAria')"
      @retry="() => refresh()"
    />

    <AutomationRunsTable
      v-else
      :runs="sortedRuns"
      :is-loading="isLoading"
      :t="t"
      :is-live-run="isLiveRun"
      :format-run-type="formatRunType"
      :format-run-status="formatRunStatus"
      :format-run-progress="formatRunProgress"
      :format-date="formatDate"
      :resolve-row-class="resolveRowClass"
    />
  </PageScaffold>
</template>
