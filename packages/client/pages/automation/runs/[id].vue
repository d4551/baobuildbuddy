<script setup lang="ts">
import { APP_ROUTES, buildAutomationScreenshotEndpoint } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { useAutomation } from "~/composables/useAutomation";
import { resolveApiEndpoint } from "~/utils/endpoints";
import { getErrorMessage } from "~/utils/errors";

const { t } = useI18n();
const route = useRoute();
const { fetchRun } = useAutomation();
const runId = computed(() => {
  const rawId = route.params.id;
  return Array.isArray(rawId) ? String(rawId[0] || "") : String(rawId || "");
});
const { data: run, error } = await fetchRun(runId.value);
const requestUrl = useRequestURL();
const apiBase = String(useRuntimeConfig().public.apiBase || "/");

const screenshotUrls = computed(() =>
  (run.value?.screenshots || []).filter((value) => typeof value === "string" && value.length > 0),
);
const screenshotEndpoint = (index: number): string => {
  const currentRunId = run.value?.id || runId.value;
  return resolveApiEndpoint(
    apiBase,
    requestUrl,
    buildAutomationScreenshotEndpoint(currentRunId, index),
  );
};
const statusText = computed(() => {
  if (!run.value) {
    return t("automation.runDetail.loadingStatus");
  }
  return t(`automation.runs.statusOptions.${run.value.status}`);
});
const inputSummary = computed(() => {
  if (!run.value?.input || typeof run.value.input !== "object") {
    return t("automation.runDetail.inputSummaryEmpty");
  }
  const size = Object.keys(run.value.input).length;
  return t("automation.runDetail.inputSummary", { count: size });
});
const outputSummary = computed(() => {
  if (!run.value?.output) {
    return t("automation.runDetail.outputSummaryEmpty");
  }
  return t("automation.runDetail.outputSummaryPresent");
});
const hasError = computed(() => Boolean(run.value?.error));
const errorMessage = computed(() =>
  error.value ? getErrorMessage(error.value, t("automation.runDetail.loadErrorFallback")) : "",
);

const formattedInput = computed(() =>
  run.value?.input
    ? JSON.stringify(run.value.input, null, 2)
    : t("automation.runDetail.noInputPayload"),
);
const formattedOutput = computed(() =>
  run.value?.output
    ? JSON.stringify(run.value.output, null, 2)
    : t("automation.runDetail.noOutputPayload"),
);
const breadcrumbs = computed(() => [
  { label: t("automation.runDetail.breadcrumbs.dashboard"), to: APP_ROUTES.dashboard },
  { label: t("automation.runDetail.breadcrumbs.runs"), to: APP_ROUTES.automationRuns },
  { label: run.value?.id || runId.value || t("automation.runDetail.breadcrumbs.detailFallback") },
]);
</script>

<template>
  <div>
    <div class="mb-6 space-y-3">
      <AppBreadcrumbs :crumbs="breadcrumbs" />
      <h1 class="text-3xl font-bold">{{ t("automation.runDetail.title") }}</h1>
    </div>

    <div v-if="error" role="alert" class="alert alert-error mb-6">
      <h3 class="font-semibold">{{ t("automation.runDetail.loadErrorTitle") }}</h3>
      <p>{{ errorMessage }}</p>
    </div>

    <template v-else-if="run">
      <div class="stats w-full mb-6">
        <div class="stat">
          <div class="stat-title">{{ t("automation.runDetail.stats.inputTitle") }}</div>
          <div class="stat-value">{{ inputSummary }}</div>
          <div class="stat-desc">{{ t("automation.runDetail.stats.inputDescription") }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("automation.runDetail.stats.outputTitle") }}</div>
          <div class="stat-value">{{ outputSummary }}</div>
          <div class="stat-desc">{{ t("automation.runDetail.stats.outputDescription") }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("automation.runDetail.stats.statusTitle") }}</div>
          <div class="stat-value">{{ statusText }}</div>
          <div class="stat-desc">{{ t("automation.runDetail.stats.typeDescription", { type: run.type }) }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("automation.runDetail.stats.errorTitle") }}</div>
          <div class="stat-value">
            {{ hasError ? t("automation.runDetail.stats.errorYes") : t("automation.runDetail.stats.errorNo") }}
          </div>
          <div class="stat-desc">{{ run.error || t("automation.runDetail.stats.errorNone") }}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h2 class="card-title">{{ t("automation.runDetail.inputPayloadTitle") }}</h2>
            <pre class="text-sm whitespace-pre-wrap">{{ formattedInput }}</pre>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h2 class="card-title">{{ t("automation.runDetail.outputPayloadTitle") }}</h2>
            <pre class="text-sm whitespace-pre-wrap">{{ formattedOutput }}</pre>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow-sm mt-6">
        <div class="card-body">
          <h2 class="card-title">{{ t("automation.runDetail.screenshotsTitle") }}</h2>
          <div v-if="screenshotUrls.length === 0" class="text-sm opacity-70">
            {{ t("automation.runDetail.noScreenshots") }}
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div
              v-for="(screenshot, index) in screenshotUrls"
              :key="screenshot"
              class="card bg-base-200"
            >
              <figure class="px-4 pt-4">
                <img
                  :src="screenshotEndpoint(index)"
                  class="rounded-lg"
                  :alt="t('automation.runDetail.screenshotAlt', { index: index + 1 })"
                />
              </figure>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="loading loading-spinner loading-lg" :aria-label="t('automation.runDetail.loadingAria')"></div>
  </div>
</template>
