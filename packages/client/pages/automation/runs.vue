<script setup lang="ts">
import {
  APP_ROUTE_BUILDERS,
  APP_ROUTES,
  AUTOMATION_RUN_STATUSES,
  AUTOMATION_RUN_TYPES,
  type AutomationRunStatus,
  type AutomationRunType,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { useAutomation } from "~/composables/useAutomation";
import { getErrorMessage } from "~/utils/errors";

type RunFilterType = "" | AutomationRunType;
type RunFilterStatus = "" | AutomationRunStatus;
const RUNNING_STATUS = AUTOMATION_RUN_STATUSES[1];

const { t } = useI18n();
const statusFilter = ref<RunFilterStatus>("");
const typeFilter = ref<RunFilterType>("");
const { fetchRuns } = useAutomation();

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
const errorMessage = computed(() =>
  error.value ? getErrorMessage(error.value, t("automation.runs.loadErrorFallback")) : "",
);

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function formatRunType(runType: AutomationRunType): string {
  return t(`automation.runs.typeOptions.${runType}`);
}

function formatRunStatus(runStatus: AutomationRunStatus): string {
  return t(`automation.runs.statusOptions.${runStatus}`);
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-3xl font-bold">{{ t("automation.runs.title") }}</h1>
      <NuxtLink :to="APP_ROUTES.automation" class="btn btn-outline" :aria-label="t('automation.runs.backToAutomation')">
        {{ t("automation.runs.backButton") }}
      </NuxtLink>
    </div>

    <div class="mb-4 flex flex-wrap gap-4">
      <label class="form-control">
        <span class="mb-1 text-sm">{{ t("automation.runs.typeLabel") }}</span>
        <select
          v-model="typeFilter"
          class="select select-bordered"
          :aria-label="t('automation.runs.typeFilterAria')"
        >
          <option value="">{{ t("automation.runs.allTypes") }}</option>
          <option v-for="option in typeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>

      <label class="form-control">
        <span class="mb-1 text-sm">{{ t("automation.runs.statusLabel") }}</span>
        <select
          v-model="statusFilter"
          class="select select-bordered"
          :aria-label="t('automation.runs.statusFilterAria')"
        >
          <option value="">{{ t("automation.runs.allStatuses") }}</option>
          <option v-for="option in statusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>

    <div class="overflow-x-auto">
      <table class="table table-zebra" :aria-label="t('automation.runs.tableAriaLabel')">
        <thead>
          <tr>
            <th>{{ t("automation.runs.columns.id") }}</th>
            <th>{{ t("automation.runs.columns.type") }}</th>
            <th>{{ t("automation.runs.columns.status") }}</th>
            <th>{{ t("automation.runs.columns.job") }}</th>
            <th>{{ t("automation.runs.columns.created") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="run in runs || []"
            :key="run.id"
            :class="{ 'bg-base-200': run.status === RUNNING_STATUS }"
          >
            <th>
              <NuxtLink
                :to="APP_ROUTE_BUILDERS.automationRunDetail(run.id)"
                class="link link-hover"
                :aria-label="t('automation.runs.openRunDetailAria', { id: run.id })"
              >
                {{ run.id }}
              </NuxtLink>
            </th>
            <td>{{ formatRunType(run.type) }}</td>
            <td>{{ formatRunStatus(run.status) }}</td>
            <td>{{ run.jobId || t("automation.runs.emptyJobId") }}</td>
            <td>{{ formatDate(run.createdAt) }}</td>
          </tr>
          <tr v-if="!isLoading && (!runs || runs.length === 0)">
            <td colspan="5" class="text-center opacity-60">{{ t("automation.runs.emptyState") }}</td>
          </tr>
        </tbody>
      </table>

      <p v-if="isLoading" class="mt-4 text-sm opacity-70" role="status" aria-live="polite">
        {{ t("automation.runs.loadingLabel") }}
      </p>
      <div v-else-if="error" role="alert" class="alert alert-error mt-4">
        <h3 class="font-semibold">{{ t("automation.runs.loadErrorTitle") }}</h3>
        <p>{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>
