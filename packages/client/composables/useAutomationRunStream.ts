import type { AutomationRunUiState, RpaRunEvent, RpaRunExecutionEnvelope } from "@bao/shared";
import { getCurrentScope, onScopeDispose, readonly, ref } from "vue";
import { useAutomation } from "./useAutomation";

const TERMINAL_STATUSES = new Set<RpaRunExecutionEnvelope["status"]>(["success", "error"]);
const PROGRESS_STATUS_TO_RUN_STATUS = {
  pending: "pending",
  running: "running",
  success: "running",
  error: "error",
} as const satisfies Record<
  Extract<RpaRunEvent, { eventType: "progress" }>["status"],
  RpaRunExecutionEnvelope["status"]
>;

type StreamError = {
  message: string;
  statusCode?: number;
};

const toStreamError = (error: unknown): StreamError => {
  if (typeof error === "object" && error !== null) {
    const maybeStatus = Reflect.get(error, "status");
    const maybeStatusCode = Reflect.get(error, "statusCode");
    const maybeMessage = Reflect.get(error, "message");
    return {
      message:
        typeof maybeMessage === "string" && maybeMessage.length > 0
          ? maybeMessage
          : "Automation stream request failed",
      statusCode:
        typeof maybeStatus === "number"
          ? maybeStatus
          : typeof maybeStatusCode === "number"
            ? maybeStatusCode
            : undefined,
    };
  }

  return {
    message: "Automation stream request failed",
  };
};

const toUiStateFromError = (error: StreamError): AutomationRunUiState => {
  if (error.statusCode === 401) {
    return "unauthorized";
  }
  if (!error.statusCode || error.statusCode >= 500 || error.statusCode === 429) {
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
  return Math.max(0, Math.min(100, Math.round((step / totalSteps) * 100)));
};

/**
 * Reactive automation run stream composable.
 * Owns fetch + websocket lifecycle and deterministic UI-state mapping.
 */
export function useAutomationRunStream() {
  const { getRun, subscribeToRun } = useAutomation();

  const state = ref<AutomationRunUiState>("idle");
  const run = ref<RpaRunExecutionEnvelope | null>(null);
  const events = ref<RpaRunEvent[]>([]);
  const streamError = ref<StreamError | null>(null);
  const isStreaming = ref(false);
  const activeRunId = ref<string>("");
  const lastSequenceByRunId = ref<Record<string, number>>({});

  let requestToken = 0;
  let unsubscribe: (() => void) | null = null;

  const stopSubscription = (): void => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    isStreaming.value = false;
  };

  const resetEvents = (): void => {
    events.value = [];
    lastSequenceByRunId.value = {};
  };

  const shouldApplyEvent = (event: RpaRunEvent): boolean => {
    if (event.runId !== activeRunId.value) {
      return false;
    }
    const currentSequence = lastSequenceByRunId.value[event.runId];
    if (typeof currentSequence === "number" && event.sequence <= currentSequence) {
      return false;
    }
    lastSequenceByRunId.value = {
      ...lastSequenceByRunId.value,
      [event.runId]: event.sequence,
    };
    return true;
  };

  const applyEvent = (event: RpaRunEvent): void => {
    events.value = [...events.value, event];
    const currentRun = run.value;
    if (!currentRun || currentRun.id !== event.runId) {
      return;
    }

    if (event.eventType === "progress") {
      const nextStep = typeof event.step === "number" ? event.step : currentRun.currentStep;
      const nextTotalSteps =
        typeof event.totalSteps === "number" ? event.totalSteps : currentRun.totalSteps;
      const nextProgress = computeProgressPercent(nextStep ?? null, nextTotalSteps ?? null);
      const mappedStatus = PROGRESS_STATUS_TO_RUN_STATUS[event.status];
      const nextStatus =
        currentRun.status === "running" && mappedStatus === "pending"
          ? currentRun.status
          : mappedStatus;

      run.value = {
        ...currentRun,
        status: nextStatus,
        currentStep: nextStep ?? null,
        totalSteps: nextTotalSteps ?? null,
        progress: nextProgress ?? currentRun.progress,
        updatedAt: event.timestamp,
      };

      if (nextStatus === "error") {
        state.value = "errorNonRetryable";
        stopSubscription();
        return;
      }

      state.value = "loading";
      return;
    }

    if (event.eventType === "result") {
      const success = event.result.success;
      const resultSteps = event.result.steps.length;
      run.value = {
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
      state.value = toUiStateFromRun(run.value);
      stopSubscription();
      return;
    }

    run.value = {
      ...currentRun,
      status: "error",
      error: event.error,
      completedAt: event.timestamp,
      updatedAt: event.timestamp,
    };
    state.value = "errorNonRetryable";
    stopSubscription();
  };

  /**
   * Starts stream lifecycle for a specific run id.
   */
  const start = async (runId: string): Promise<void> => {
    const normalizedRunId = runId.trim();
    requestToken += 1;
    const token = requestToken;

    stopSubscription();
    resetEvents();
    streamError.value = null;
    activeRunId.value = normalizedRunId;

    if (normalizedRunId.length === 0) {
      state.value = "empty";
      run.value = null;
      return;
    }

    state.value = "loading";

    const initialRun = await getRun(normalizedRunId).then(
      (value) => ({ ok: true as const, value }),
      (error: unknown) => ({ ok: false as const, error: toStreamError(error) }),
    );

    if (token !== requestToken) {
      return;
    }

    if (!initialRun.ok) {
      run.value = null;
      streamError.value = initialRun.error;
      state.value = toUiStateFromError(initialRun.error);
      return;
    }

    run.value = initialRun.value;
    state.value = toUiStateFromRun(initialRun.value);

    if (TERMINAL_STATUSES.has(initialRun.value.status)) {
      return;
    }

    unsubscribe = subscribeToRun(normalizedRunId, (event) => {
      if (token !== requestToken || !shouldApplyEvent(event)) {
        return;
      }
      applyEvent(event);
    });
    isStreaming.value = true;
  };

  /**
   * Refetches and re-subscribes the active run stream.
   */
  const retry = (): Promise<void> => start(activeRunId.value);

  /**
   * Cancels websocket subscription for the active run.
   */
  const cancel = (): void => {
    requestToken += 1;
    stopSubscription();
    if (state.value === "loading") {
      state.value = "idle";
    }
  };

  const cleanup = (): void => {
    requestToken += 1;
    stopSubscription();
  };

  if (getCurrentScope()) {
    onScopeDispose(cleanup);
  }

  return {
    state: readonly(state),
    run: readonly(run),
    events: readonly(events),
    streamError: readonly(streamError),
    isStreaming: readonly(isStreaming),
    start,
    retry,
    cancel,
  };
}
