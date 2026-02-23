import type {
  AutomationRunUiState,
  RpaRunEvent,
  RpaRunExecutionEnvelope,
} from "@bao/shared";
import { onBeforeUnmount, readonly, ref } from "vue";
import { useAutomation } from "./useAutomation";

const TERMINAL_STATUSES = new Set(["success", "error"]);

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

  let unsubscribe: (() => void) | null = null;

  const stopSubscription = (): void => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    isStreaming.value = false;
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

      run.value = {
        ...currentRun,
        status: event.status,
        currentStep: nextStep ?? null,
        totalSteps: nextTotalSteps ?? null,
        progress: nextProgress ?? currentRun.progress,
        updatedAt: event.timestamp,
      };
      state.value = toUiStateFromRun(run.value);
      return;
    }

    if (event.eventType === "result") {
      const success = event.result.success;
      run.value = {
        ...currentRun,
        status: success ? "success" : "error",
        output: event.result,
        error: success ? null : event.result.error,
        progress: 100,
        currentStep: event.result.steps.length,
        totalSteps: event.result.steps.length,
        completedAt: event.timestamp,
        updatedAt: event.timestamp,
      };
      state.value = toUiStateFromRun(run.value);
      if (TERMINAL_STATUSES.has(run.value.status)) {
        stopSubscription();
      }
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
    if (normalizedRunId.length === 0) {
      state.value = "empty";
      run.value = null;
      activeRunId.value = "";
      stopSubscription();
      return;
    }

    activeRunId.value = normalizedRunId;
    streamError.value = null;
    state.value = "loading";
    stopSubscription();

    const initialRun = await getRun(normalizedRunId).then(
      (value) => ({ ok: true as const, value }),
      (error: unknown) => ({ ok: false as const, error: toStreamError(error) }),
    );

    if (!initialRun.ok) {
      run.value = null;
      streamError.value = initialRun.error;
      state.value = toUiStateFromError(initialRun.error);
      return;
    }

    run.value = initialRun.value;
    state.value = toUiStateFromRun(initialRun.value);
    events.value = [];

    if (TERMINAL_STATUSES.has(initialRun.value.status)) {
      return;
    }

    unsubscribe = subscribeToRun(normalizedRunId, (event) => {
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
    stopSubscription();
    if (state.value === "loading") {
      state.value = "idle";
    }
  };

  onBeforeUnmount(() => {
    stopSubscription();
  });

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
