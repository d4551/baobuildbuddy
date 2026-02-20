<script setup lang="ts">
import { useAutomation } from "~/composables/useAutomation";

const statusFilter = ref("");
const typeFilter = ref("");
const { fetchRuns } = useAutomation();

const query = computed(() => ({
  status: statusFilter.value || undefined,
  type: typeFilter.value || undefined,
}));

const { data: runs, status: runFetchStatus, error, refresh } = fetchRuns(query);

watch(query, () => {
  void refresh();
});

const isLoading = computed(() => runFetchStatus.value === "pending");

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleString();
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">Automation Runs</h1>
      <NuxtLink to="/automation" class="btn btn-outline">Back to Automation</NuxtLink>
    </div>

    <div class="flex flex-wrap gap-4 mb-4">
      <label class="form-control">
        <span class="mb-1 text-sm">Type</span>
        <select v-model="typeFilter" class="select select-bordered" aria-label="Type Filter">
          <option value="">All</option>
          <option value="job_apply">Job Apply</option>
          <option value="scrape">Scraper</option>
          <option value="email">Email</option>
        </select>
      </label>

      <label class="form-control">
        <span class="mb-1 text-sm">Status</span>
        <select v-model="statusFilter" class="select select-bordered" aria-label="Status Filter">
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
        </select>
      </label>
    </div>

    <div class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Run ID</th>
            <th>Type</th>
            <th>Status</th>
            <th>Job</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="run in runs || []"
            :key="run.id"
            :class="{ 'bg-base-200': run.status === 'running' }"
          >
            <th>
              <NuxtLink :to="`/automation/runs/${encodeURIComponent(run.id)}`" class="link link-hover">
                {{ run.id }}
              </NuxtLink>
            </th>
            <td>{{ run.type }}</td>
            <td>{{ run.status }}</td>
            <td>{{ run.jobId || "—" }}</td>
            <td>{{ formatDate(run.createdAt) }}</td>
          </tr>
          <tr v-if="!isLoading && (!runs || runs.length === 0)">
            <td colspan="5" class="text-center opacity-60">No runs found.</td>
          </tr>
        </tbody>
      </table>

      <p v-if="isLoading" class="mt-4 text-sm opacity-70">Loading runs…</p>
      <div v-else-if="error" role="alert" class="alert alert-error mt-4">
        <h3 class="font-semibold">Unable to load runs</h3>
        <p>{{ error.message || "Could not load run history." }}</p>
      </div>
    </div>
  </div>
</template>
