<script setup lang="ts">
import { APP_ROUTE_BUILDERS } from "@bao/shared/constants/routes";
import type { RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";

defineProps<{
  runs: ReadonlyArray<RpaRunExecutionEnvelope>;
  isLoading: boolean;
  t: (key: string, values?: Record<string, unknown>) => string;
  isLiveRun: (run: RpaRunExecutionEnvelope) => boolean;
  formatRunType: (runType: RpaRunExecutionEnvelope["type"]) => string;
  formatRunStatus: (runStatus: RpaRunExecutionEnvelope["status"]) => string;
  formatRunProgress: (run: RpaRunExecutionEnvelope) => string;
  formatDate: (value: string) => string;
  resolveRowClass: (run: RpaRunExecutionEnvelope) => Record<string, boolean>;
}>();
</script>

<template>
  <div class="card card-border bg-base-100">
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
            <tr v-for="run in runs" :key="run.id" :class="resolveRowClass(run)">
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
            <tr v-if="!isLoading && runs.length === 0">
              <td colspan="7" class="text-center opacity-60">{{ t("automation.runs.emptyState") }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
