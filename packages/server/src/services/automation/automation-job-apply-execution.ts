import {
  API_ERROR_JOB_APPLICATION_AUTOMATION_FAILED,
  API_ERROR_RUN_ID_INVALID,
} from "@bao/shared/constants/api-errors";
import { API_MESSAGE_JOB_APPLICATION_AUTOMATION_COMPLETED } from "@bao/shared/constants/api-messages";
import { ROUTE_GAMIFICATION_XP } from "@bao/shared/constants/gamification";
import type { AutomationSettings } from "@bao/shared/types/settings-contracts";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import { settle } from "@bao/shared/utils/promise";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { automationRuns } from "../../db/schema/automation-runs";
import { createServerLogger } from "../../utils/logger";
import { broadcastAutomationEvent } from "../../ws/automation.ws";
import { gamificationService } from "../gamification-service";
import {
  markRunCompleted,
  markRunFailed,
  normalizeExecutionResult,
} from "./automation-run-persistence";
import { resolveAutomationTimeoutMs } from "./automation-settings-support";
import type {
  CreateProgressEvent,
  JobApplyExecutionTracking,
  JobApplyRunPreparation,
} from "./automation-service-contracts";
import type { RpaScriptExecutionResult } from "./rpa-runner-contracts";
import { runRpaScript } from "./rpa-runner-protocol";

const logger = createServerLogger("automation-job-apply-execution");

type FailureReason = Error | string;

export const createExecutionTracking = (): JobApplyExecutionTracking => ({
  exitCode: null,
  timedOut: false,
  aborted: false,
  executionMs: null,
  errorEnvelope: null,
  terminalPersisted: false,
});

export const markJobApplyRunStarted = async (runId: string): Promise<void> => {
  const startedAt = new Date().toISOString();
  await db
    .update(automationRuns)
    .set({
      startedAt,
      status: "running",
      progress: 0,
      exitCode: null,
      timedOut: false,
      aborted: false,
      executionMs: null,
      completedAt: null,
      updatedAt: startedAt,
    })
    .where(eq(automationRuns.id, runId));
};

const runJobApplyScript = async (
  preparation: JobApplyRunPreparation,
  tracking: JobApplyExecutionTracking,
): Promise<RpaScriptExecutionResult> => {
  const execution = await runRpaScript({
    scriptId: "job-apply",
    scriptInput: {
      jobUrl: preparation.normalized.jobUrl,
      resume: preparation.resume,
      ...(preparation.resumeFilePath ? { resumeFilePath: preparation.resumeFilePath } : {}),
      coverLetter: preparation.coverLetter
        ? { content: preparation.coverLetter.content || {} }
        : null,
      customAnswers: preparation.normalized.customAnswers,
      selectorMap: preparation.selectorMap,
    },
    executionContext: {
      runId: preparation.runId,
      timeoutMs: resolveAutomationTimeoutMs(preparation.automationSettings),
      outputDir: preparation.runArtifactDir,
    },
    automationSettings: preparation.automationSettings,
    onEvent: preparation.progressHandler,
  });

  tracking.exitCode = execution.exitCode;
  tracking.timedOut = execution.timedOut;
  tracking.aborted = execution.aborted;
  tracking.executionMs = execution.executionMs;
  tracking.errorEnvelope = execution.error;

  if (execution.error) {
    throw new Error(execution.error.message);
  }

  return execution;
};

const finalizeJobApplySuccess = async (
  preparation: JobApplyRunPreparation,
  tracking: JobApplyExecutionTracking,
  execution: RpaScriptExecutionResult,
  createProgressEvent: CreateProgressEvent,
): Promise<void> => {
  const normalizedResult = await normalizeExecutionResult(
    preparation.runId,
    execution,
    API_ERROR_RUN_ID_INVALID,
  );
  await markRunCompleted(
    preparation.runId,
    normalizedResult,
    preparation.automationSettings,
    execution,
  );
  tracking.terminalPersisted = true;

  if (!normalizedResult.success) {
    throw new Error(normalizedResult.error || API_ERROR_JOB_APPLICATION_AUTOMATION_FAILED);
  }

  broadcastAutomationEvent(
    createProgressEvent({
      runId: preparation.runId,
      action: "completed",
      status: "success",
      message: API_MESSAGE_JOB_APPLICATION_AUTOMATION_COMPLETED,
    }),
  );

  const awardXpResult = await settle(
    gamificationService.awardXP(ROUTE_GAMIFICATION_XP.automationCompleted, "automation_success"),
  );
  if (awardXpResult.status === "rejected") {
    logger.warn("XP award failed after job apply automation", {
      err: String(awardXpResult.reason),
    });
  }
};

export const executePreparedJobApplyRun = async (
  preparation: JobApplyRunPreparation,
  tracking: JobApplyExecutionTracking,
  createProgressEvent: CreateProgressEvent,
): Promise<void> => {
  const execution = await runJobApplyScript(preparation, tracking);
  await finalizeJobApplySuccess(preparation, tracking, execution, createProgressEvent);
};

export const handleJobApplyExecutionFailure = async (params: {
  runId: string;
  automationSettings: AutomationSettings;
  tracking: JobApplyExecutionTracking;
  reason: FailureReason;
  createProgressEvent: CreateProgressEvent;
}): Promise<never> => {
  const message = toErrorMessage(params.reason, API_ERROR_JOB_APPLICATION_AUTOMATION_FAILED);
  if (!params.tracking.terminalPersisted) {
    await markRunFailed(params.runId, message, params.automationSettings, {
      exitCode: params.tracking.exitCode,
      timedOut: params.tracking.timedOut,
      aborted: params.tracking.aborted,
      executionMs: params.tracking.executionMs,
      errorEnvelope: params.tracking.errorEnvelope,
    });
  }
  broadcastAutomationEvent(
    params.createProgressEvent({
      runId: params.runId,
      action: "automation",
      status: "error",
      message,
    }),
  );
  throw params.reason instanceof Error ? params.reason : new Error(message);
};
