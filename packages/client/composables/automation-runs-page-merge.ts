import { AUTOMATION_RUN_STATUSES } from "@bao/shared/constants/automation";
import type { RpaRunEvent, RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import { PERCENT_MAX } from "~/constants/numeric-ui";

const [RUN_STATUS_PENDING, RUN_STATUS_RUNNING, RUN_STATUS_SUCCESS, RUN_STATUS_ERROR] =
  AUTOMATION_RUN_STATUSES;

export const isLiveAutomationRun = (run: RpaRunExecutionEnvelope): boolean =>
  run.status === RUN_STATUS_PENDING || run.status === RUN_STATUS_RUNNING;

export const computeAutomationRunProgressFromSteps = (
  currentStep: number | null,
  totalSteps: number | null,
): number => {
  if (
    typeof currentStep !== "number" ||
    typeof totalSteps !== "number" ||
    totalSteps <= 0 ||
    !Number.isFinite(currentStep) ||
    !Number.isFinite(totalSteps)
  ) {
    return 0;
  }
  return Math.max(0, Math.min(PERCENT_MAX, Math.round((currentStep / totalSteps) * PERCENT_MAX)));
};

const mergeProgressEvent = (
  run: RpaRunExecutionEnvelope,
  event: Extract<RpaRunEvent, { eventType: "progress" }>,
): RpaRunExecutionEnvelope => {
  const currentStep = typeof event.step === "number" ? event.step : run.currentStep;
  const totalSteps = typeof event.totalSteps === "number" ? event.totalSteps : run.totalSteps;
  const progress =
    typeof run.progress === "number" && Number.isFinite(run.progress)
      ? run.progress
      : computeAutomationRunProgressFromSteps(currentStep ?? null, totalSteps ?? null);
  return {
    ...run,
    status: event.status,
    currentStep: currentStep ?? null,
    totalSteps: totalSteps ?? null,
    progress,
    updatedAt: event.timestamp,
  };
};

const mergeResultEvent = (
  run: RpaRunExecutionEnvelope,
  event: Extract<RpaRunEvent, { eventType: "result" }>,
): RpaRunExecutionEnvelope => {
  const outputSteps = event.result.steps.length;
  return {
    ...run,
    status: event.result.success ? RUN_STATUS_SUCCESS : RUN_STATUS_ERROR,
    output: event.result,
    error: event.result.success ? null : event.result.error,
    progress: PERCENT_MAX,
    currentStep: outputSteps,
    totalSteps: outputSteps,
    completedAt: event.timestamp,
    updatedAt: event.timestamp,
  };
};

export const mergeAutomationRunWithEvent = (
  run: RpaRunExecutionEnvelope,
  event: RpaRunEvent,
): RpaRunExecutionEnvelope => {
  if (event.eventType === "progress") {
    return mergeProgressEvent(run, event);
  }
  if (event.eventType === "result") {
    return mergeResultEvent(run, event);
  }
  return {
    ...run,
    status: RUN_STATUS_ERROR,
    error: event.error,
    completedAt: event.timestamp,
    updatedAt: event.timestamp,
  };
};
