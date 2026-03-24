<script setup lang="ts">
import {
  APP_ROUTE_BUILDERS,
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

watch(query, () => {
  void refresh();
});

const isLoading = computed(() => runFetchStatus.value === "pending");
const hasRuns = computed(() => sortedRuns.value.length > 0);
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

    <SectionGrid grid-token="twoColumn">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t("automation.runs.typeLabel") }}</legend>
        <select
          v-model="typeFilter"
          class="select"
          :aria-label="t('automation.runs.typeFilterAria')"
        >
          <option value="">{{ t("automation.runs.allTypes") }}</option>
          <option v-for="option in typeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t("automation.runs.statusLabel") }}</legend>
        <select
          v-model="statusFilter"
          class="select"
          :aria-label="t('automation.runs.statusFilterAria')"
        >
          <option value="">{{ t("automation.runs.allStatuses") }}</option>
          <option v-for="option in statusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </fieldset>
    </SectionGrid>

    <LoadingSkeleton v-if="isLoading && !hasRuns" :lines="6" />

    <BootstrapErrorAlert
      v-else-if="error"
      :title="t('automation.runs.loadErrorTitle')"
      :message="errorMessage"
      :retry-label="t('automation.hub.retryButtonLabel')"
      :retry-aria-label="t('automation.hub.retryAria')"
      @retry="() => refresh()"
    />

    <div v-else class="card card-border bg-base-100">
      <div class="card-body">
        <div class="overflow-x-auto">
          <table class="table table-zebra" :aria-label="t('automation.runs.tableAriaLabel')">
            <thead>
              <tr>
                <th scope="col">{{ t("automation.runs.columns.id") }}</th>
                <th scope="col">{{ t("automation.runs.columns.type") }}</th>
                <th scope="col">{{ t("automation.runs.columns.status") }}</th>
                <th scope="col" class="text-right">{{ t("automation.runs.columns.progress") }}</th>
                <th scope="col">{{ t("automation.runs.columns.job") }}</th>
                <th scope="col">{{ t("automation.runs.columns.updated") }}</th>
                <th scope="col">{{ t("automation.runs.columns.actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="run in sortedRuns" :key="run.id" :class="resolveRowClass(run)">
                <th>{{ run.id }}</th>
                <td>{{ formatRunType(run.type) }}</td>
                <td>
                  <div class="flex items-center gap-2">
                    <span>{{ formatRunStatus(run.status) }}</span>
                    <span
                      v-if="isLiveRun(run)"
                      class="badge badge-info badge-outline"
                      :aria-label="t('automation.runs.liveBadgeAria')"
                    >
                      {{ t("automation.runs.liveBadge") }}
                    </span>
                  </div>
                </td>
                <td class="text-right">{{ formatRunProgress(run) }}</td>
                <td>{{ run.jobId || t("automation.runs.emptyJobId") }}</td>
                <td>{{ formatDate(run.updatedAt) }}</td>
                <td>
                  <NuxtLink
                    :to="APP_ROUTE_BUILDERS.automationRunDetail(run.id)"
                    class="btn btn-xs btn-ghost"
                    :aria-label="t('automation.runs.openRunDetailAria', { id: run.id })"
                  >
                    {{ t("automation.runs.openButton") }}
                  </NuxtLink>
                </td>
              </tr>
              <tr v-if="!isLoading && sortedRuns.length === 0">
                <td colspan="7" class="text-center opacity-60">{{ t("automation.runs.emptyState") }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </PageScaffold>
</template>
