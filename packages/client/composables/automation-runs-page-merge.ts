/**
 * Pure merge/progress helpers for automation runs list (live WS events).
 */
import {
  AUTOMATION_RUN_STATUSES,
  type AutomationRunStatus,
} from "@bao/shared/constants/automation";
import type { RpaRunEvent, RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";

const [RUN_STATUS_PENDING, RUN_STATUS_RUNNING, RUN_STATUS_SUCCESS, RUN_STATUS_ERROR] =
  AUTOMATION_RUN_STATUSES;

export const RUN_STATUS_ORDER: Record<AutomationRunStatus, number> = {
  [RUN_STATUS_RUNNING]: 0,
  [RUN_STATUS_PENDING]: 1,
  [RUN_STATUS_ERROR]: 2,
  [RUN_STATUS_SUCCESS]: 3,
};

export const isLiveRun = (run: RpaRunExecutionEnvelope): boolean =>
  run.status === RUN_STATUS_PENDING || run.status === RUN_STATUS_RUNNING;

const computeProgressFromSteps = (
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
  return Math.max(0, Math.min(100, Math.round((currentStep / totalSteps) * 100)));
};

const mergeRunProgressEvent = (
  run: RpaRunExecutionEnvelope,
  event: Extract<RpaRunEvent, { eventType: "progress" }>,
): RpaRunExecutionEnvelope => {
  const currentStep = typeof event.step === "number" ? event.step : run.currentStep;
  const totalSteps = typeof event.totalSteps === "number" ? event.totalSteps : run.totalSteps;
  const progress =
    typeof run.progress === "number" && Number.isFinite(run.progress)
      ? run.progress
      : computeProgressFromSteps(currentStep ?? null, totalSteps ?? null);
  return {
    ...run,
    status: event.status,
    currentStep: currentStep ?? null,
    totalSteps: totalSteps ?? null,
    progress,
    updatedAt: event.timestamp,
  };
};

const mergeRunResultEvent = (
  run: RpaRunExecutionEnvelope,
  event: Extract<RpaRunEvent, { eventType: "result" }>,
): RpaRunExecutionEnvelope => {
  const outputSteps = event.result.steps.length;
  return {
    ...run,
    status: event.result.success ? RUN_STATUS_SUCCESS : RUN_STATUS_ERROR,
    output: event.result,
    error: event.result.success ? null : event.result.error,
    progress: 100,
    currentStep: outputSteps,
    totalSteps: outputSteps,
    completedAt: event.timestamp,
    updatedAt: event.timestamp,
  };
};

export const mergeRunWithEvent = (
  run: RpaRunExecutionEnvelope,
  event: RpaRunEvent,
): RpaRunExecutionEnvelope => {
  if (event.eventType === "progress") {
    return mergeRunProgressEvent(run, event);
  }
  if (event.eventType === "result") {
    return mergeRunResultEvent(run, event);
  }
  return {
    ...run,
    status: RUN_STATUS_ERROR,
    error: event.error,
    completedAt: event.timestamp,
    updatedAt: event.timestamp,
  };
};

export const sortRunsByStatusThenCreated = (
  runs: readonly RpaRunExecutionEnvelope[],
): RpaRunExecutionEnvelope[] =>
  [...runs].sort((left, right) => {
    const statusDiff = RUN_STATUS_ORDER[left.status] - RUN_STATUS_ORDER[right.status];
    if (statusDiff !== 0) {
      return statusDiff;
    }
    const createdDiff = Date.parse(right.createdAt) - Date.parse(left.createdAt);
    if (Number.isFinite(createdDiff) && createdDiff !== 0) {
      return createdDiff;
    }
    return left.id.localeCompare(right.id);
  });
