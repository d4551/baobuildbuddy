<script setup lang="ts">
import { type AutomationRun, useAutomation } from "~/composables/useAutomation";

const { fetchRuns } = useAutomation();
const { data: runs } = fetchRuns();

const today = new Date();

const isToday = (value: string) => {
  const created = new Date(value);
  return (
    created.getFullYear() === today.getFullYear() &&
    created.getMonth() === today.getMonth() &&
    created.getDate() === today.getDate()
  );
};

const rows = computed<AutomationRun[]>(() => runs.value || []);
const todayRuns = computed(() => rows.value.filter((run) => isToday(run.createdAt)).length);

const completedRuns = computed(() =>
  rows.value.filter((run) => run.status === "success" || run.status === "error"),
);

const successRuns = computed(
  () => completedRuns.value.filter((run) => run.status === "success").length,
);

const successRate = computed(() => {
  if (completedRuns.value.length === 0) return 0;
  return Math.round((successRuns.value / completedRuns.value.length) * 100);
});

const totalRuns = computed(() => rows.value.length);

if (import.meta.server) {
  useServerSeoMeta({
    title: "Automation Hub",
    description: "Run and track automation workflows across scrapers and job applications.",
  });
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">Automation</h1>
      <NuxtLink to="/automation/runs" class="btn btn-outline">View Runs</NuxtLink>
    </div>

    <div class="stats w-full">
      <div class="stat">
        <div class="stat-title">Total Runs</div>
        <div class="stat-value">{{ totalRuns }}</div>
        <div class="stat-desc">Tracked automation executions</div>
      </div>
      <div class="stat">
        <div class="stat-title">Today's Runs</div>
        <div class="stat-value">{{ todayRuns }}</div>
        <div class="stat-desc">Started today</div>
      </div>
      <div class="stat">
        <div class="stat-title">Success Rate</div>
        <div class="stat-value">{{ successRate }}%</div>
        <div class="stat-desc">Completed job applications run history</div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">Scraper Workflows</h2>
          <p class="text-sm">Run studio and job scrapers to refresh discovery data.</p>
          <div class="card-actions justify-end mt-4">
            <NuxtLink to="/automation/scraper" class="btn btn-primary">Open Scraper Hub</NuxtLink>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">Job Apply</h2>
          <p class="text-sm">Start a RPA job application using your saved resume and cover letter.</p>
          <div class="card-actions justify-end mt-4">
            <NuxtLink to="/automation/job-apply" class="btn btn-primary">Start Job Apply</NuxtLink>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">Run History</h2>
          <p class="text-sm">Inspect full payloads, screenshots, and execution output.</p>
          <div class="card-actions justify-end mt-4">
            <NuxtLink to="/automation/runs" class="btn btn-primary">Open Run History</NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
