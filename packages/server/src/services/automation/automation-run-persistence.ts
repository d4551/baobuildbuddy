import type { AutomationSettings, ErrorEnvelope, RpaRunEvent, RpaRunResult } from "@bao/shared";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { automationRuns } from "../../db/schema/automation-runs";
import {
  normalizeExecutionArtifacts,
  resolveRunArtifactDir as resolveRunArtifactDirectory,
  sanitizeRunId,
} from "./automation-run-persistence-artifacts";
import {
  createCompletedRunUpdate,
  createFailedRunUpdate,
  createProgressUpdate,
  purgeExpiredAutomationScreenshots,
} from "./automation-run-persistence-updates";
import type { RpaScriptExecutionResult } from "./rpa-runner-contracts";

export const resolveRunArtifactDir = (
  runId: string,
  invalidRunIdMessage: string,
): string => {
  const safeRunId = sanitizeRunId(runId, invalidRunIdMessage);
  const directory = resolveRunArtifactDirectory(safeRunId, invalidRunIdMessage);
  Bun.spawnSync(["mkdir", "-p", directory]);
  return directory;
};

export const normalizeExecutionResult = async (
  runId: string,
  execution: RpaScriptExecutionResult,
  invalidRunIdMessage: string,
): Promise<RpaRunResult> => {
  const runDir = resolveRunArtifactDir(runId, invalidRunIdMessage);
  Bun.spawnSync(["mkdir", "-p", runDir]);
  return normalizeExecutionArtifacts(runId, runDir, execution);
};

export const persistProgress = async (event: RpaRunEvent): Promise<void> => {
  if (event.eventType !== "progress") {
    return;
  }

  await db
    .update(automationRuns)
    .set(createProgressUpdate(event))
    .where(eq(automationRuns.id, event.runId));
};

export const markRunFailed = async (
  runId: string,
  errorMessage: string,
  automationSettings: AutomationSettings,
  execution?: {
    exitCode?: number | null;
    timedOut?: boolean;
    aborted?: boolean;
    executionMs?: number | null;
    errorEnvelope?: ErrorEnvelope | null;
  },
): Promise<void> => {
  await db
    .update(automationRuns)
    .set(createFailedRunUpdate(errorMessage, execution))
    .where(eq(automationRuns.id, runId));

  await purgeExpiredAutomationScreenshots(automationSettings.screenshotRetention);
};

export const markRunCompleted = async (
  runId: string,
  output: RpaRunResult,
  automationSettings: AutomationSettings,
  execution: Pick<RpaScriptExecutionResult, "exitCode" | "timedOut" | "aborted" | "executionMs">,
): Promise<void> => {
  await db
    .update(automationRuns)
    .set(createCompletedRunUpdate(output, execution))
    .where(eq(automationRuns.id, runId));

  await purgeExpiredAutomationScreenshots(automationSettings.screenshotRetention);
};

export const assertRunExists = async (
  runId: string,
  createRunNotFoundError: (runId: string) => Error,
): Promise<void> => {
  const runRows = await db.select().from(automationRuns).where(eq(automationRuns.id, runId)).limit(1);
  if (runRows.length === 0) {
    throw createRunNotFoundError(runId);
  }
};
