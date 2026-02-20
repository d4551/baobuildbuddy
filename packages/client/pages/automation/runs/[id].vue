<script setup lang="ts">
import { useAutomation } from "~/composables/useAutomation";

const route = useRoute();
const { fetchRun } = useAutomation();
const runId = computed(() => {
  const rawId = route.params.id;
  return Array.isArray(rawId) ? String(rawId[0] || "") : String(rawId || "");
});
const { data: run, error } = await fetchRun(runId.value);
const requestUrl = useRequestURL();
const apiBase = String(useRuntimeConfig().public.apiBase || "/");
const resolvedApiBase = new URL(apiBase, requestUrl).toString().replace(/\/$/, "");
const isApiBase = /\/api\/?$/i.test(new URL(resolvedApiBase).pathname);

const screenshotUrls = computed(() =>
  (run.value?.screenshots || []).filter((value) => typeof value === "string" && value.length > 0),
);
const screenshotEndpoint = (index: number): string => {
  const resolvedPath = `/automation/screenshots/${encodeURIComponent(run.value?.id || runId.value)}/${index}`;
  return isApiBase ? `${resolvedApiBase}${resolvedPath}` : `/api${resolvedPath}`;
};
const statusText = computed(() => {
  if (!run.value) return "Loading...";
  return run.value.status;
});
const inputSummary = computed(() => {
  if (!run.value?.input) return "No input recorded";
  const size = Object.keys(run.value.input).length;
  return `${size} field${size === 1 ? "" : "s"}`;
});
const outputSummary = computed(() => {
  if (!run.value?.output) return "No output";
  return "Output received";
});
const hasError = computed(() => Boolean(run.value?.error));

const formattedInput = computed(() =>
  run.value?.input ? JSON.stringify(run.value.input, null, 2) : "No input payload",
);
const formattedOutput = computed(() =>
  run.value?.output ? JSON.stringify(run.value.output, null, 2) : "No output payload",
);
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">Automation Run Detail</h1>
      <NuxtLink to="/automation/runs" class="btn btn-outline">Back</NuxtLink>
    </div>

    <div v-if="error" role="alert" class="alert alert-error mb-6">
      <h3 class="font-semibold">Failed to load run</h3>
      <p>{{ error.message || "Could not load automation run." }}</p>
    </div>

    <template v-else-if="run">
      <div class="stats w-full mb-6">
        <div class="stat">
          <div class="stat-title">Input</div>
          <div class="stat-value">{{ inputSummary }}</div>
          <div class="stat-desc">Payload fields</div>
        </div>
        <div class="stat">
          <div class="stat-title">Output</div>
          <div class="stat-value">{{ outputSummary }}</div>
          <div class="stat-desc">Automation result snapshot</div>
        </div>
        <div class="stat">
          <div class="stat-title">Status</div>
          <div class="stat-value">{{ statusText }}</div>
          <div class="stat-desc">Type: {{ run.type }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">Error</div>
          <div class="stat-value">{{ hasError ? "Yes" : "No" }}</div>
          <div class="stat-desc">{{ run.error || "No error" }}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h2 class="card-title">Input Payload</h2>
            <pre class="text-sm whitespace-pre-wrap">{{ formattedInput }}</pre>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h2 class="card-title">Output Payload</h2>
            <pre class="text-sm whitespace-pre-wrap">{{ formattedOutput }}</pre>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow-sm mt-6">
        <div class="card-body">
          <h2 class="card-title">Screenshots</h2>
          <div v-if="screenshotUrls.length === 0" class="text-sm opacity-70">
            No screenshots available.
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div v-for="(screenshot, index) in screenshotUrls" :key="screenshot" class="card bg-base-200">
              <figure class="px-4 pt-4">
                <img
                  :src="screenshotEndpoint(index)"
                  class="rounded-lg"
                  :alt="`Automation screenshot ${index + 1}`"
                />
              </figure>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="loading loading-spinner loading-lg"></div>
  </div>
</template>
