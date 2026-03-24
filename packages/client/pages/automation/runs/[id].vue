<script setup lang="ts">
import { APP_ROUTES, buildAutomationScreenshotEndpoint, type RpaRunResult } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { useAutomationRunStream } from "~/composables/useAutomationRunStream";
import { resolveApiEndpoint } from "~/utils/endpoints";
import { formatDateWithLocale } from "~/utils/locale-format";

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

const { t, locale, fallbackLocale } = useI18n();
const route = useRoute();
const requestUrl = useRequestURL();
const apiBase = String(useRuntimeConfig().public.apiBase || "/");
const runStream = useAutomationRunStream();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("automation.runDetail.title"),
    description: t("automation.hub.cards.runHistory.description"),
  });
}

const failedScreenshotIndexes = ref<Record<number, boolean>>({});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const runId = computed(() => {
  const rawId = route.params.id;
  return Array.isArray(rawId) ? String(rawId[0] || "") : String(rawId || "");
});

const streamState = computed(() => runStream.state.value);
const run = computed(() => runStream.run.value);
const streamEvents = computed(() => runStream.events.value);
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
  const formattedDate = formatDateWithLocale(
    value,
    locale.value,
    fallbackLocale.value,
    DATE_FORMAT_OPTIONS,
  );
  return formattedDate ?? value;
};

const streamStateMessageKey = computed<string>(
  () => `automation.runDetail.states.${streamState.value}`,
);
const showLoadError = computed(
  () =>
    streamState.value === "unauthorized" ||
    streamState.value === "errorRetryable" ||
    streamState.value === "errorNonRetryable",
);
const canRetryLoad = computed(() => streamState.value === "errorRetryable");
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
  <PageScaffold tag="section" width-token="content" labelled-by="automation-run-detail-title">
    <div class="space-y-3">
      <AppBreadcrumbs :crumbs="breadcrumbs" />
      <PageHeroHeader title-id="automation-run-detail-title" :title="t('automation.runDetail.title')">
        <template #actions>
          <NuxtLink
            :to="APP_ROUTES.automationRuns"
            class="btn btn-outline"
            :aria-label="t('automation.runDetail.backToRunsAria')"
          >
            {{ t("automation.runDetail.backButton") }}
          </NuxtLink>
        </template>
      </PageHeroHeader>
    </div>

    <BootstrapErrorAlert
      v-if="showLoadError"
      :title="t('automation.runDetail.loadErrorTitle')"
      :message="streamError?.message || t(streamStateMessageKey)"
      :retry-label="canRetryLoad ? t('automation.runDetail.retryButton') : ''"
      :retry-aria-label="canRetryLoad ? t('automation.runDetail.retryAria') : ''"
      @retry="() => runStream.retry()"
    />

    <div v-if="run" class="space-y-6">
      <div class="stats stats-vertical w-full bg-base-200 lg:stats-horizontal">
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
            <table class="table table-zebra table-sm" :aria-label="t('automation.runDetail.timeline.aria')">
              <thead>
                <tr>
                  <th scope="col">{{ t("automation.runDetail.timeline.columns.time") }}</th>
                  <th scope="col">{{ t("automation.runDetail.timeline.columns.stage") }}</th>
                  <th scope="col">{{ t("automation.runDetail.timeline.columns.status") }}</th>
                  <th scope="col">{{ t("automation.runDetail.timeline.columns.message") }}</th>
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

      <SectionGrid grid-token="twoColumnWide">
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
      </SectionGrid>

      <section class="card bg-base-100 shadow-sm" :aria-label="t('automation.runDetail.screenshotsTitle')">
        <div class="card-body">
          <h2 class="card-title">{{ t("automation.runDetail.screenshotsTitle") }}</h2>
          <div v-if="screenshotPaths.length === 0" class="text-sm opacity-70">
            {{ t("automation.runDetail.noScreenshots") }}
          </div>
          <SectionGrid v-else grid-token="threeColumn">
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
          </SectionGrid>
        </div>
      </section>
    </div>

    <LoadingSkeleton v-else :lines="8" />
  </PageScaffold>
</template>
