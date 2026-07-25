import { buildAutomationScreenshotEndpoint } from "@bao/shared/constants/endpoints";
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { type ComputedRef, computed, onBeforeUnmount, type Ref, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { TimelineEntry } from "~/composables/automation-run-detail-page-contracts";
import {
  type OutputStep,
  projectOutputSteps,
  projectRunDetail,
  projectStreamEvents,
  type RunDetailFields,
  type StreamEventFields,
  toLocaleCode,
} from "~/composables/automation-run-detail-projectors";
import { useAutomationRunStream } from "~/composables/useAutomationRunStream";
import { PERCENT_MAX } from "~/constants/numeric-ui";
import { resolveApiEndpoint } from "~/utils/endpoints";
import { formatDateWithLocale } from "~/utils/locale-format";

const DATE_FORMAT_OPTIONS = {
  dateStyle: "medium",
  timeStyle: "short",
} as const satisfies Intl.DateTimeFormatOptions;

const mapOutputStepStatusToTimeline = (status: OutputStep["status"]): TimelineEntry["status"] => {
  if (status === "ok") {
    return "success";
  }
  if (status === "skipped") {
    return "skipped";
  }
  return "error";
};

const createAutomationRunDetailDateFormatter =
  (locale: Readonly<{ value: string }>, fallbackLocale: Readonly<{ value: string }>) =>
  (value: string): string => {
    const formattedDate = formatDateWithLocale(
      value,
      locale.value,
      fallbackLocale.value,
      DATE_FORMAT_OPTIONS,
    );
    return formattedDate ?? value;
  };

const createAutomationRunId = () =>
  computed(() => {
    const rawId = useRoute().params.id;
    return Array.isArray(rawId) ? String(rawId[0] || "") : String(rawId || "");
  });

const createAutomationRunDetailStreamState = (
  runStream: ReturnType<typeof useAutomationRunStream>,
  t: ReturnType<typeof useI18n>["t"],
) => {
  const streamState = computed(() => runStream.state.value);
  const run = computed(() => projectRunDetail(runStream.run.value));
  const streamEvents = computed(() => projectStreamEvents(runStream.events.value));
  const streamError = computed(() => runStream.streamError.value);
  const streamStateMessageKey = computed<string>(
    () => `automation.runDetail.states.${streamState.value}`,
  );
  const showLoadError = computed(() =>
    ["unauthorized", "errorRetryable", "errorNonRetryable"].includes(streamState.value),
  );
  const canRetryLoad = computed(() => streamState.value === "errorRetryable");
  const statusText = computed(() => {
    if (!run.value) {
      return t("automation.runDetail.loadingStatus");
    }
    return t(`automation.runs.statusOptions.${run.value.status}`);
  });
  const progressPercent = computed(() => {
    const value = run.value?.progress;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return 0;
    }
    return Math.max(0, Math.min(PERCENT_MAX, Math.round(value)));
  });
  return {
    streamState,
    run,
    streamEvents,
    streamError,
    streamStateMessageKey,
    showLoadError,
    canRetryLoad,
    statusText,
    progressPercent,
  };
};

const createAutomationRunDetailSummaries = (
  run: Readonly<ComputedRef<RunDetailFields | null>>,
  t: ReturnType<typeof useI18n>["t"],
) => {
  const inputSummary = computed(() => {
    const input = run.value?.input;
    if (!input) {
      return t("automation.runDetail.inputSummaryEmpty");
    }
    return t("automation.runDetail.inputSummary", { count: Reflect.ownKeys(input).length });
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
  const outputSteps = computed(() => projectOutputSteps(run.value?.output ?? null));
  return {
    inputSummary,
    outputSummary,
    formattedInput,
    formattedOutput,
    outputSteps,
  };
};

const mapAutomationRunStreamEvent = (
  event: StreamEventFields,
  t: ReturnType<typeof useI18n>["t"],
): TimelineEntry => {
  if (event.eventType === "progress") {
    return {
      id: `${event.runId}-${event.sequence}`,
      timestamp: event.timestamp,
      stage: t("automation.runDetail.timeline.stageProgress"),
      status: event.status ?? "running",
      message: event.message?.trim() || event.action || "",
    };
  }
  if (event.eventType === "result") {
    const success = event.resultSuccess === true;
    return {
      id: `${event.runId}-${event.sequence}`,
      timestamp: event.timestamp,
      stage: t("automation.runDetail.timeline.stageResult"),
      status: success ? "success" : "error",
      message: success
        ? t("automation.runDetail.timeline.resultSuccess")
        : event.resultError || t("automation.runDetail.timeline.resultError"),
    };
  }
  return {
    id: `${event.runId}-${event.sequence}`,
    timestamp: event.timestamp,
    stage: t("automation.runDetail.timeline.stageError"),
    status: "error",
    message: event.errorMessage || t("automation.runDetail.timeline.resultError"),
  };
};

const createAutomationRunFallbackTimelineEntries = (options: {
  readonly run: Readonly<ComputedRef<RunDetailFields | null>>;
  readonly runId: Readonly<ComputedRef<string>>;
  readonly outputSteps: Readonly<ComputedRef<OutputStep[]>>;
  readonly statusText: Readonly<ComputedRef<string>>;
  readonly t: ReturnType<typeof useI18n>["t"];
}): readonly TimelineEntry[] => {
  if (!options.run.value) {
    return [];
  }
  if (options.outputSteps.value.length > 0) {
    return options.outputSteps.value.map((step, index) => ({
      id: `${options.run.value?.id || options.runId.value}-output-${index}`,
      timestamp: options.run.value?.updatedAt || "",
      stage: options.t("automation.runDetail.timeline.stageOutputStep"),
      status: mapOutputStepStatusToTimeline(step.status),
      message: step.message || step.action,
    }));
  }
  return [
    {
      id: `${options.run.value.id}-status`,
      timestamp: options.run.value.updatedAt,
      stage: options.t("automation.runDetail.timeline.stageRunStatus"),
      status: options.run.value.status,
      message: options.statusText.value,
    },
  ];
};

const createAutomationRunDetailTimeline = (options: {
  readonly streamEvents: Readonly<ComputedRef<readonly StreamEventFields[]>>;
  readonly run: Readonly<ComputedRef<RunDetailFields | null>>;
  readonly runId: Readonly<ComputedRef<string>>;
  readonly outputSteps: Readonly<ComputedRef<OutputStep[]>>;
  readonly statusText: Readonly<ComputedRef<string>>;
  readonly t: ReturnType<typeof useI18n>["t"];
}) =>
  computed<readonly TimelineEntry[]>(() => {
    if (options.streamEvents.value.length > 0) {
      return [...options.streamEvents.value]
        .sort((left, right) => left.sequence - right.sequence)
        .map((event) => mapAutomationRunStreamEvent(event, options.t));
    }
    return createAutomationRunFallbackTimelineEntries(options);
  });

const createAutomationRunDetailScreenshots = (options: {
  readonly apiBase: string;
  readonly requestUrl: URL;
  readonly run: Readonly<ComputedRef<RunDetailFields | null>>;
  readonly runId: Readonly<ComputedRef<string>>;
  readonly failedScreenshotIndexes: Ref<Record<number, boolean>>;
  readonly t: ReturnType<typeof useI18n>["t"];
}) => {
  const screenshotPaths = computed<readonly string[]>(() => options.run.value?.screenshots || []);
  const screenshotEndpoint = (index: number): string =>
    resolveApiEndpoint(
      options.apiBase,
      options.requestUrl,
      buildAutomationScreenshotEndpoint(options.run.value?.id || options.runId.value, index),
    );
  const screenshotLinkLabel = (index: number): string =>
    options.t("automation.runDetail.screenshotLinkLabel", { index: index + 1 });
  const markScreenshotError = (index: number): void => {
    options.failedScreenshotIndexes.value = {
      ...options.failedScreenshotIndexes.value,
      [index]: true,
    };
  };
  const screenshotHasError = (index: number): boolean =>
    Boolean(options.failedScreenshotIndexes.value[index]);
  return {
    screenshotPaths,
    screenshotEndpoint,
    screenshotLinkLabel,
    markScreenshotError,
    screenshotHasError,
  };
};

const createAutomationRunDetailBreadcrumbs = (
  run: Readonly<ComputedRef<RunDetailFields | null>>,
  runId: Readonly<ComputedRef<string>>,
  t: ReturnType<typeof useI18n>["t"],
) =>
  computed(() => [
    { label: t("automation.runDetail.breadcrumbs.dashboard"), to: APP_ROUTES.dashboard },
    { label: t("automation.runDetail.breadcrumbs.runs"), to: APP_ROUTES.automationRuns },
    { label: run.value?.id || runId.value || t("automation.runDetail.breadcrumbs.detailFallback") },
  ]);

const createAutomationRunDetailState = (options: {
  readonly t: ReturnType<typeof useI18n>["t"];
  readonly locale: Readonly<{ value: string }>;
  readonly fallbackLocale: Readonly<{ value: string }>;
  readonly apiBase: string;
  readonly requestUrl: URL;
  readonly runStream: ReturnType<typeof useAutomationRunStream>;
  readonly failedScreenshotIndexes: Ref<Record<number, boolean>>;
}) => {
  const runId = createAutomationRunId();
  const stream = createAutomationRunDetailStreamState(options.runStream, options.t);
  const summaries = createAutomationRunDetailSummaries(stream.run, options.t);
  return {
    runId,
    stream,
    summaries,
    timelineEntries: createAutomationRunDetailTimeline({
      streamEvents: stream.streamEvents,
      run: stream.run,
      runId,
      outputSteps: summaries.outputSteps,
      statusText: stream.statusText,
      t: options.t,
    }),
    screenshots: createAutomationRunDetailScreenshots({
      apiBase: options.apiBase,
      requestUrl: options.requestUrl,
      run: stream.run,
      runId,
      failedScreenshotIndexes: options.failedScreenshotIndexes,
      t: options.t,
    }),
    breadcrumbs: createAutomationRunDetailBreadcrumbs(stream.run, runId, options.t),
    toLocalizedDateTime: createAutomationRunDetailDateFormatter(
      options.locale,
      options.fallbackLocale,
    ),
  };
};

const registerAutomationRunDetailLifecycle = (
  runId: Readonly<ComputedRef<string>>,
  failedScreenshotIndexes: Ref<Record<number, boolean>>,
  runStream: ReturnType<typeof useAutomationRunStream>,
) => {
  watch(
    runId,
    async (nextRunId) => {
      failedScreenshotIndexes.value = {};
      if (nextRunId.trim().length === 0) {
        runStream.cancel();
        return;
      }
      await runStream.start(nextRunId);
    },
    { immediate: true },
  );
  onBeforeUnmount(() => {
    runStream.cancel();
  });
};

export const useAutomationRunDetailPage = () => {
  const { t, locale, fallbackLocale } = useI18n();
  const requestUrl = useRequestURL();
  const apiBase = String(useRuntimeConfig().public.apiBase || "/");
  const runStream = useAutomationRunStream({
    fallbackMessage: t("automation.jobApply.stream.startErrorFallback"),
  });
  const failedScreenshotIndexes = ref<Record<number, boolean>>({});
  const detailState = createAutomationRunDetailState({
    t,
    locale: { value: toLocaleCode(locale.value) },
    fallbackLocale: { value: toLocaleCode(fallbackLocale.value) },
    apiBase,
    requestUrl,
    runStream,
    failedScreenshotIndexes,
  });
  const retryRunStream = async (): Promise<void> => {
    await runStream.retry();
  };
  if (import.meta.client) {
    registerAutomationRunDetailLifecycle(detailState.runId, failedScreenshotIndexes, runStream);
  }

  return {
    t,
    run: detailState.stream.run,
    breadcrumbs: detailState.breadcrumbs,
    streamError: detailState.stream.streamError,
    streamStateMessageKey: detailState.stream.streamStateMessageKey,
    showLoadError: detailState.stream.showLoadError,
    canRetryLoad: detailState.stream.canRetryLoad,
    inputSummary: detailState.summaries.inputSummary,
    outputSummary: detailState.summaries.outputSummary,
    statusText: detailState.stream.statusText,
    progressPercent: detailState.stream.progressPercent,
    timelineEntries: detailState.timelineEntries,
    formattedInput: detailState.summaries.formattedInput,
    formattedOutput: detailState.summaries.formattedOutput,
    screenshotPaths: detailState.screenshots.screenshotPaths,
    toLocalizedDateTime: detailState.toLocalizedDateTime,
    screenshotEndpoint: detailState.screenshots.screenshotEndpoint,
    screenshotLinkLabel: detailState.screenshots.screenshotLinkLabel,
    markScreenshotError: detailState.screenshots.markScreenshotError,
    screenshotHasError: detailState.screenshots.screenshotHasError,
    retryRunStream,
  };
};
