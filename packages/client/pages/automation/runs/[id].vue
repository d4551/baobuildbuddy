<script setup lang="ts">
import {
  APP_ROUTES,
  buildAutomationScreenshotEndpoint,
  type RpaRunEvent,
  type RpaRunExecutionEnvelope,
  type RpaRunResult,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { useAutomationRunStream } from "~/composables/useAutomationRunStream";
import { resolveApiEndpoint } from "~/utils/endpoints";

type TimelineStatus = "pending" | "running" | "success" | "error";
type TimelineEntry = {
  id: string;
  timestamp: string;
  stage: string;
  status: TimelineStatus;
  message: string;
};

const DATE_FORMAT_OPTIONS = {
  dateStyle: "medium",
  timeStyle: "short",
} as const satisfies Intl.DateTimeFormatOptions;

const { t } = useI18n();
const route = useRoute();
const requestUrl = useRequestURL();
const apiBase = String(useRuntimeConfig().public.apiBase || "/");
const runStream = useAutomationRunStream();

const failedScreenshotIndexes = ref<Record<number, boolean>>({});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const runId = computed(() => {
  const rawId = route.params.id;
  return Array.isArray(rawId) ? String(rawId[0] || "") : String(rawId || "");
});

const streamState = computed(() => runStream.state.value);
const run = computed<RpaRunExecutionEnvelope | null>(() => runStream.run.value);
const streamEvents = computed<readonly RpaRunEvent[]>(() => runStream.events.value);
const streamError = computed(() => runStream.streamError.value);

const isResultOutput = (value: unknown): value is RpaRunResult => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.success === "boolean" &&
    Array.isArray(value.steps) &&
    Array.isArray(value.screenshots) &&
    Array.isArray(value.artifacts)
  );
};

const toLocalizedDateTime = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, DATE_FORMAT_OPTIONS).format(parsed);
};

const streamStateMessageKey = computed<string>(
  () => `automation.runDetail.states.${streamState.value}`,
);
const statusText = computed(() => {
  if (!run.value) {
    return t("automation.runDetail.loadingStatus");
  }
  return t(`automation.runs.statusOptions.${run.value.status}`);
});

const progressPercent = computed<number>(() => {
  const value = run.value?.progress;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
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

const outputSteps = computed(() => {
  if (!run.value?.output || !isResultOutput(run.value.output)) {
    return [];
  }
  return run.value.output.steps;
});

const timelineEntries = computed<TimelineEntry[]>(() => {
  if (streamEvents.value.length > 0) {
    return [...streamEvents.value]
      .sort((left, right) => left.sequence - right.sequence)
      .map((event) => {
        if (event.eventType === "progress") {
          return {
            id: `${event.runId}-${event.sequence}`,
            timestamp: event.timestamp,
            stage: t("automation.runDetail.timeline.stageProgress"),
            status: event.status,
            message: event.message?.trim() || event.action,
          };
        }
        if (event.eventType === "result") {
          return {
            id: `${event.runId}-${event.sequence}`,
            timestamp: event.timestamp,
            stage: t("automation.runDetail.timeline.stageResult"),
            status: event.result.success ? "success" : "error",
            message: event.result.success
              ? t("automation.runDetail.timeline.resultSuccess")
              : event.result.error || t("automation.runDetail.timeline.resultError"),
          };
        }
        return {
          id: `${event.runId}-${event.sequence}`,
          timestamp: event.timestamp,
          stage: t("automation.runDetail.timeline.stageError"),
          status: "error",
          message: event.error.message || t("automation.runDetail.timeline.resultError"),
        };
      });
  }

  const runValue = run.value;
  if (!runValue) {
    return [];
  }

  const fallbackEntries: TimelineEntry[] = [];
  if (outputSteps.value.length > 0) {
    outputSteps.value.forEach((step, index) => {
      fallbackEntries.push({
        id: `${runValue.id}-output-${index}`,
        timestamp: runValue.updatedAt,
        stage: t("automation.runDetail.timeline.stageOutputStep"),
        status: step.status === "ok" ? "success" : "error",
        message: step.message || step.action,
      });
    });
  }

  if (fallbackEntries.length === 0) {
    fallbackEntries.push({
      id: `${runValue.id}-status`,
      timestamp: runValue.updatedAt,
      stage: t("automation.runDetail.timeline.stageRunStatus"),
      status: runValue.status,
      message: statusText.value,
    });
  }
  return fallbackEntries;
});

const screenshotPaths = computed<string[]>(() =>
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

const screenshotLinkLabel = (index: number): string =>
  t("automation.runDetail.screenshotLinkLabel", { index: index + 1 });

const markScreenshotError = (index: number): void => {
  failedScreenshotIndexes.value = {
    ...failedScreenshotIndexes.value,
    [index]: true,
  };
};

const screenshotHasError = (index: number): boolean =>
  Boolean(failedScreenshotIndexes.value[index]);

const breadcrumbs = computed(() => [
  { label: t("automation.runDetail.breadcrumbs.dashboard"), to: APP_ROUTES.dashboard },
  { label: t("automation.runDetail.breadcrumbs.runs"), to: APP_ROUTES.automationRuns },
  { label: run.value?.id || runId.value || t("automation.runDetail.breadcrumbs.detailFallback") },
]);

watch(
  runId,
  (nextRunId) => {
    failedScreenshotIndexes.value = {};
    if (nextRunId.trim().length === 0) {
      runStream.cancel();
      return;
    }
    void runStream.start(nextRunId);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  runStream.cancel();
});
</script>

<template>
  <div>
    <div class="mb-6 space-y-3">
      <AppBreadcrumbs :crumbs="breadcrumbs" />
      <h1 class="text-3xl font-bold">{{ t("automation.runDetail.title") }}</h1>
    </div>

    <div
      v-if="streamState === 'unauthorized' || streamState === 'errorRetryable' || streamState === 'errorNonRetryable'"
      role="alert"
      class="alert alert-error mb-6"
    >
      <h3 class="font-semibold">{{ t("automation.runDetail.loadErrorTitle") }}</h3>
      <p>{{ streamError?.message || t(streamStateMessageKey) }}</p>
      <button
        v-if="streamState === 'errorRetryable'"
        type="button"
        class="btn btn-sm btn-outline"
        :aria-label="t('automation.runDetail.retryAria')"
        @click="runStream.retry()"
      >
        {{ t("automation.runDetail.retryButton") }}
      </button>
    </div>

    <div v-if="run" class="space-y-6">
      <div class="stats stats-vertical w-full bg-base-100 shadow-sm lg:stats-horizontal">
        <div class="stat">
          <div class="stat-title">{{ t("automation.runDetail.stats.inputTitle") }}</div>
          <div class="stat-value text-base">{{ inputSummary }}</div>
          <div class="stat-desc">{{ t("automation.runDetail.stats.inputDescription") }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("automation.runDetail.stats.outputTitle") }}</div>
          <div class="stat-value text-base">{{ outputSummary }}</div>
          <div class="stat-desc">{{ t("automation.runDetail.stats.outputDescription") }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("automation.runDetail.stats.statusTitle") }}</div>
          <div class="stat-value text-base">{{ statusText }}</div>
          <div class="stat-desc">
            {{ t("automation.runDetail.progressSummary", { percent: progressPercent }) }}
          </div>
          <progress
            class="progress progress-primary mt-2"
            :value="progressPercent"
            max="100"
            :aria-label="t('automation.runDetail.progressAria')"
          ></progress>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("automation.runDetail.stats.errorTitle") }}</div>
          <div class="stat-value text-base">
            {{
              run.error ? t("automation.runDetail.stats.errorYes") : t("automation.runDetail.stats.errorNo")
            }}
          </div>
          <div class="stat-desc">
            {{
              run.error
                ? typeof run.error === "string"
                  ? run.error
                  : run.error.message
                : t("automation.runDetail.stats.errorNone")
            }}
          </div>
        </div>
      </div>

      <section class="card bg-base-100 shadow-sm" :aria-label="t('automation.runDetail.timeline.aria')">
        <div class="card-body">
          <h2 class="card-title">{{ t("automation.runDetail.timeline.title") }}</h2>
          <div class="overflow-x-auto">
            <table class="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>{{ t("automation.runDetail.timeline.columns.time") }}</th>
                  <th>{{ t("automation.runDetail.timeline.columns.stage") }}</th>
                  <th>{{ t("automation.runDetail.timeline.columns.status") }}</th>
                  <th>{{ t("automation.runDetail.timeline.columns.message") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in timelineEntries" :key="entry.id">
                  <td>{{ toLocalizedDateTime(entry.timestamp) }}</td>
                  <td>{{ entry.stage }}</td>
                  <td>{{ t(`automation.runs.statusOptions.${entry.status}`) }}</td>
                  <td>{{ entry.message }}</td>
                </tr>
                <tr v-if="timelineEntries.length === 0">
                  <td colspan="4" class="text-center text-sm text-base-content/60">
                    {{ t("automation.runDetail.timeline.empty") }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section class="card bg-base-100 shadow-sm" :aria-label="t('automation.runDetail.inputPayloadTitle')">
          <div class="card-body">
            <h2 class="card-title">{{ t("automation.runDetail.inputPayloadTitle") }}</h2>
            <pre class="text-sm whitespace-pre-wrap">{{ formattedInput }}</pre>
          </div>
        </section>
        <section class="card bg-base-100 shadow-sm" :aria-label="t('automation.runDetail.outputPayloadTitle')">
          <div class="card-body">
            <h2 class="card-title">{{ t("automation.runDetail.outputPayloadTitle") }}</h2>
            <pre class="text-sm whitespace-pre-wrap">{{ formattedOutput }}</pre>
          </div>
        </section>
      </div>

      <section class="card bg-base-100 shadow-sm" :aria-label="t('automation.runDetail.screenshotsTitle')">
        <div class="card-body">
          <h2 class="card-title">{{ t("automation.runDetail.screenshotsTitle") }}</h2>
          <div v-if="screenshotPaths.length === 0" class="text-sm opacity-70">
            {{ t("automation.runDetail.noScreenshots") }}
          </div>
          <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <article
              v-for="(screenshotPath, index) in screenshotPaths"
              :key="screenshotPath"
              class="card bg-base-200"
            >
              <figure class="px-4 pt-4">
                <img
                  v-if="!screenshotHasError(index)"
                  :src="screenshotEndpoint(index)"
                  class="rounded-lg"
                  :alt="t('automation.runDetail.screenshotAlt', { index: index + 1 })"
                  @error="markScreenshotError(index)"
                />
                <div
                  v-else
                  class="w-full rounded-lg border border-dashed border-base-content/30 p-4 text-sm text-base-content/70"
                  role="status"
                >
                  {{ t("automation.runDetail.screenshotLoadError", { index: index + 1 }) }}
                </div>
              </figure>
              <div class="card-body px-4 py-3">
                <a
                  class="link link-primary text-sm"
                  :href="screenshotEndpoint(index)"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="screenshotLinkLabel(index)"
                >
                  {{ screenshotLinkLabel(index) }}
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>

    <div
      v-else
      class="mt-8 flex items-center gap-3"
      role="status"
      aria-live="polite"
      :aria-label="t('automation.runDetail.loadingAria')"
    >
      <span class="loading loading-spinner loading-lg"></span>
      <span>{{ t(streamStateMessageKey) }}</span>
    </div>
  </div>
</template>
