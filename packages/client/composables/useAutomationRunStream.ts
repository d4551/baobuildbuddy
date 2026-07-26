import {
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_TOO_MANY_REQUESTS,
  HTTP_STATUS_UNAUTHORIZED,
} from "@bao/shared/constants/http";
import type { RpaRunEvent, RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import type { AutomationRunUiState } from "@bao/shared/schemas/rpa-protocol.schema";
import { getCurrentScope, onScopeDispose, type Ref, readonly, ref } from "vue";
import { PERCENT_MAX } from "~/constants/numeric-ui";
import automationJobApplyCatalog from "~/locales/en-US/automation/jobApply";
import { useAutomation } from "./useAutomation";

const TERMINAL_STATUSES = new Set<RpaRunExecutionEnvelope["status"]>(["success", "error"]);
const PROGRESS_STATUS_TO_RUN_STATUS = {
  pending: "pending",
  running: "running",
  // A step reporting success does not end the run; the terminal result event does.
  success: "running",
  error: "error",
  cancelled: "cancelled",
} as const satisfies Record<
  Extract<RpaRunEvent, { eventType: "progress" }>["status"],
  RpaRunExecutionEnvelope["status"]
>;

type StreamError = {
  message: string;
  statusCode?: number;
};

type StreamStateRefs = {
  state: Ref<AutomationRunUiState>;
  run: Ref<RpaRunExecutionEnvelope | null>;
  events: Ref<RpaRunEvent[]>;
  streamError: Ref<StreamError | null>;
  isStreaming: Ref<boolean>;
  activeRunId: Ref<string>;
  lastSequenceByRunId: Ref<Record<string, number>>;
};

type StreamLifecycle = {
  requestToken: number;
  unsubscribe: (() => void) | null;
};

type EventApplyResult = {
  nextRun: RpaRunExecutionEnvelope;
  nextState: AutomationRunUiState;
  shouldStop: boolean;
};

interface StreamDependencies {
  refs: StreamStateRefs;
  lifecycle: StreamLifecycle;
  getRun: ReturnType<typeof useAutomation>["getRun"];
  subscribeToRun: ReturnType<typeof useAutomation>["subscribeToRun"];
  fallbackMessage: string;
}

interface UseAutomationRunStreamOptions {
  fallbackMessage?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toStreamError = (error: unknown, fallbackMessage: string): StreamError => {
  if (!isRecord(error)) {
    return { message: fallbackMessage };
  }

  const message =
    typeof error.message === "string" && error.message.length > 0 ? error.message : fallbackMessage;
  let statusCode: number | undefined;
  if (typeof error.status === "number") {
    statusCode = error.status;
  } else if (typeof error.statusCode === "number") {
    statusCode = error.statusCode;
  }

  return { message, statusCode };
};

const toUiStateFromError = (error: StreamError): AutomationRunUiState => {
  if (error.statusCode === HTTP_STATUS_UNAUTHORIZED) {
    return "unauthorized";
  }
  if (
    !error.statusCode ||
    error.statusCode >= HTTP_STATUS_INTERNAL_SERVER_ERROR ||
    error.statusCode === HTTP_STATUS_TOO_MANY_REQUESTS
  ) {
    return "errorRetryable";
  }
  return "errorNonRetryable";
};

const toUiStateFromRun = (run: RpaRunExecutionEnvelope): AutomationRunUiState => {
  if (run.status === "success") {
    return "success";
  }
  if (run.status === "error") {
    return "errorNonRetryable";
  }
  if (run.status === "pending" || run.status === "running") {
    return "loading";
  }
  return "idle";
};

const computeProgressPercent = (step: number | null, totalSteps: number | null): number | null => {
  if (typeof step !== "number" || typeof totalSteps !== "number" || totalSteps <= 0) {
    return null;
  }
  return Math.max(0, Math.min(PERCENT_MAX, Math.round((step / totalSteps) * PERCENT_MAX)));
};

function createStreamStateRefs(): StreamStateRefs {
  return {
    state: ref<AutomationRunUiState>("idle"),
    run: ref<RpaRunExecutionEnvelope | null>(null),
    events: ref<RpaRunEvent[]>([]),
    streamError: ref<StreamError | null>(null),
    isStreaming: ref(false),
    activeRunId: ref(""),
    lastSequenceByRunId: ref<Record<string, number>>({}),
  };
}

function stopSubscription(lifecycle: StreamLifecycle, refs: StreamStateRefs): void {
  if (lifecycle.unsubscribe) {
    lifecycle.unsubscribe();
    lifecycle.unsubscribe = null;
  }
  refs.isStreaming.value = false;
}

function resetEventState(refs: StreamStateRefs): void {
  refs.events.value = [];
  refs.lastSequenceByRunId.value = {};
}

function shouldApplyEvent(refs: StreamStateRefs, event: RpaRunEvent): boolean {
  if (event.runId !== refs.activeRunId.value) {
    return false;
  }

  const currentSequence = refs.lastSequenceByRunId.value[event.runId];
  if (typeof currentSequence === "number" && event.sequence <= currentSequence) {
    return false;
  }

  refs.lastSequenceByRunId.value = {
    ...refs.lastSequenceByRunId.value,
    [event.runId]: event.sequence,
  };

  return true;
}

function applyProgressEvent(
  currentRun: RpaRunExecutionEnvelope,
  event: Extract<RpaRunEvent, { eventType: "progress" }>,
): EventApplyResult {
  const nextStep = typeof event.step === "number" ? event.step : currentRun.currentStep;
  const nextTotalSteps =
    typeof event.totalSteps === "number" ? event.totalSteps : currentRun.totalSteps;
  const nextProgress = computeProgressPercent(nextStep ?? null, nextTotalSteps ?? null);
  const mappedStatus = PROGRESS_STATUS_TO_RUN_STATUS[event.status];
  const nextStatus =
    currentRun.status === "running" && mappedStatus === "pending"
      ? currentRun.status
      : mappedStatus;

  return {
    nextRun: {
      ...currentRun,
      status: nextStatus,
      currentStep: nextStep ?? null,
      totalSteps: nextTotalSteps ?? null,
      progress: nextProgress ?? currentRun.progress,
      updatedAt: event.timestamp,
    },
    nextState: nextStatus === "error" ? "errorNonRetryable" : "loading",
    shouldStop: nextStatus === "error",
  };
}

function applyResultEvent(
  currentRun: RpaRunExecutionEnvelope,
  event: Extract<RpaRunEvent, { eventType: "result" }>,
): EventApplyResult {
  const success = event.result.success;
  const resultSteps = event.result.steps.length;
  const nextRun: RpaRunExecutionEnvelope = {
    ...currentRun,
    status: success ? "success" : "error",
    output: event.result,
    error: success ? null : event.result.error,
    screenshots:
      event.result.screenshots.length > 0 ? event.result.screenshots : currentRun.screenshots,
    progress: 100,
    currentStep: resultSteps,
    totalSteps: resultSteps,
    completedAt: event.timestamp,
    updatedAt: event.timestamp,
  };

  return {
    nextRun,
    nextState: toUiStateFromRun(nextRun),
    shouldStop: true,
  };
}

function applyErrorEvent(
  currentRun: RpaRunExecutionEnvelope,
  event: Extract<RpaRunEvent, { eventType: "error" }>,
): EventApplyResult {
  return {
    nextRun: {
      ...currentRun,
      status: "error",
      error: event.error,
      completedAt: event.timestamp,
      updatedAt: event.timestamp,
    },
    nextState: "errorNonRetryable",
    shouldStop: true,
  };
}

function applyEvent(refs: StreamStateRefs, lifecycle: StreamLifecycle, event: RpaRunEvent): void {
  refs.events.value = [...refs.events.value, event];
  const currentRun = refs.run.value;
  if (!currentRun || currentRun.id !== event.runId) {
    return;
  }

  let next: EventApplyResult;
  if (event.eventType === "progress") {
    next = applyProgressEvent(currentRun, event);
  } else if (event.eventType === "result") {
    next = applyResultEvent(currentRun, event);
  } else {
    next = applyErrorEvent(currentRun, event);
  }

  refs.run.value = next.nextRun;
  refs.state.value = next.nextState;
  if (next.shouldStop) {
    stopSubscription(lifecycle, refs);
  }
}

async function fetchInitialRun(
  getRun: ReturnType<typeof useAutomation>["getRun"],
  runId: string,
  fallbackMessage: string,
): Promise<{ ok: true; value: RpaRunExecutionEnvelope } | { ok: false; error: StreamError }> {
  return getRun(runId).then(
    (value: RpaRunExecutionEnvelope) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error: toStreamError(error, fallbackMessage) }),
  );
}

function subscribeForRun(dependencies: StreamDependencies, runId: string, token: number): void {
  dependencies.lifecycle.unsubscribe = dependencies.subscribeToRun(runId, (event) => {
    if (
      token === dependencies.lifecycle.requestToken &&
      shouldApplyEvent(dependencies.refs, event)
    ) {
      applyEvent(dependencies.refs, dependencies.lifecycle, event);
    }
  });
  dependencies.refs.isStreaming.value = true;
}

async function startStream(dependencies: StreamDependencies, runId: string): Promise<void> {
  const normalizedRunId = runId.trim();
  dependencies.lifecycle.requestToken += 1;
  const token = dependencies.lifecycle.requestToken;

  stopSubscription(dependencies.lifecycle, dependencies.refs);
  resetEventState(dependencies.refs);
  dependencies.refs.streamError.value = null;
  dependencies.refs.activeRunId.value = normalizedRunId;

  if (normalizedRunId.length === 0) {
    dependencies.refs.state.value = "empty";
    dependencies.refs.run.value = null;
    return;
  }

  dependencies.refs.state.value = "loading";
  const initialRun = await fetchInitialRun(
    dependencies.getRun,
    normalizedRunId,
    dependencies.fallbackMessage,
  );
  if (token !== dependencies.lifecycle.requestToken) {
    return;
  }
  if (!initialRun.ok) {
    dependencies.refs.run.value = null;
    dependencies.refs.streamError.value = initialRun.error;
    dependencies.refs.state.value = toUiStateFromError(initialRun.error);
    return;
  }

  dependencies.refs.run.value = initialRun.value;
  dependencies.refs.state.value = toUiStateFromRun(initialRun.value);
  if (!TERMINAL_STATUSES.has(initialRun.value.status)) {
    subscribeForRun(dependencies, normalizedRunId, token);
  }
}

function cancelStream(refs: StreamStateRefs, lifecycle: StreamLifecycle): void {
  lifecycle.requestToken += 1;
  stopSubscription(lifecycle, refs);
  if (refs.state.value === "loading") {
    refs.state.value = "idle";
  }
}

function cleanupStream(refs: StreamStateRefs, lifecycle: StreamLifecycle): void {
  lifecycle.requestToken += 1;
  stopSubscription(lifecycle, refs);
}

/**
 * Reactive automation run stream composable.
 * Owns fetch + websocket lifecycle and deterministic UI-state mapping.
 */
export function useAutomationRunStream(options: UseAutomationRunStreamOptions = {}) {
  const { getRun, subscribeToRun } = useAutomation();
  const refs = createStreamStateRefs();
  const lifecycle: StreamLifecycle = {
    requestToken: 0,
    unsubscribe: null,
  };
  const dependencies: StreamDependencies = {
    refs,
    lifecycle,
    getRun,
    subscribeToRun,
    fallbackMessage:
      options.fallbackMessage ??
      automationJobApplyCatalog.automation.jobApply.stream.startErrorFallback,
  };
  const start = (runId: string): Promise<void> => startStream(dependencies, runId);
  const retry = (): Promise<void> => start(refs.activeRunId.value);
  const cancel = (): void => cancelStream(refs, lifecycle);
  const cleanup = (): void => cleanupStream(refs, lifecycle);
  if (getCurrentScope()) {
    onScopeDispose(cleanup);
  }

  return {
    state: readonly(refs.state),
    run: readonly(refs.run),
    events: readonly(refs.events),
    streamError: readonly(refs.streamError),
    isStreaming: readonly(refs.isStreaming),
    start,
    retry,
    cancel,
  };
}
