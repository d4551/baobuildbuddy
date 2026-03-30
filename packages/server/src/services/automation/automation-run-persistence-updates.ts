import { join } from "node:path";
import type { ErrorEnvelope, RpaRunEvent, RpaRunResult } from "@bao/shared";
import {
  AUTOMATION_CLEANUP_LIMIT,
  AUTOMATION_FINISHED_PROGRESS,
  AUTOMATION_MAX_PROGRESS_STEPS,
  AUTOMATION_MAX_SCREENSHOT_RETENTION_DAYS,
  MS_PER_DAY,
} from "@bao/shared";
import { and, inArray, sql } from "drizzle-orm";
import { AUTOMATION_SCREENSHOT_DIR } from "../../config/paths";
import { db } from "../../db/client";
import { automationRuns } from "../../db/schema/automation-runs";
import type { RpaScriptExecutionResult } from "./rpa-runner";

const AUTOMATION_TERMINAL_STATUSES = ["success", "error"];
const DECIMAL_RADIX = 10;
const MIN_SCREENSHOT_RETENTION_DAYS = 1;
type ProgressRunEvent = Extract<RpaRunEvent, { eventType: "progress" }>;

const toJsonRecord = (value: object): Record<string, unknown> => {
  const record: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    record[key] = entry;
  }
  return record;
};

export const toFiniteNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : Number.NaN;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value.trim(), DECIMAL_RADIX);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }
  return Number.NaN;
};

export const createProgressUpdate = (event: ProgressRunEvent) => {
  const step = toFiniteNumber(event.step);
  const totalSteps = toFiniteNumber(event.totalSteps);
  const updates: {
    status?: string;
    progress?: number;
    currentStep?: number | null;
    totalSteps?: number | null;
    updatedAt: string;
  } = {
    updatedAt: new Date().toISOString(),
  };

  if (Number.isFinite(totalSteps) && totalSteps > 0) {
    updates.totalSteps = Math.min(AUTOMATION_MAX_PROGRESS_STEPS, Math.trunc(totalSteps));
  }

  if (Number.isFinite(step)) {
    const safeStep = Math.max(0, Math.trunc(step));
    updates.currentStep = updates.totalSteps ? Math.min(safeStep, updates.totalSteps) : safeStep;
    if (Number.isFinite(totalSteps) && totalSteps > 0) {
      updates.progress = Math.min(
        AUTOMATION_FINISHED_PROGRESS,
        Math.max(
          0,
          Math.round((updates.currentStep / (updates.totalSteps || 1)) * AUTOMATION_FINISHED_PROGRESS),
        ),
      );
    }
  }

  updates.status = typeof event.status === "string" ? event.status : "running";
  return updates;
};

export const purgeExpiredAutomationScreenshots = async (retentionDays: number): Promise<void> => {
  const retention = Math.trunc(
    Number.isFinite(retentionDays) ? retentionDays : MIN_SCREENSHOT_RETENTION_DAYS,
  );
  const safeRetention = Math.min(
    Math.max(retention, MIN_SCREENSHOT_RETENTION_DAYS),
    AUTOMATION_MAX_SCREENSHOT_RETENTION_DAYS,
  );
  const cutoffIso = new Date(Date.now() - safeRetention * MS_PER_DAY).toISOString();

  const staleRuns = await db
    .select({ id: automationRuns.id })
    .from(automationRuns)
    .where(
      and(
        sql`datetime(${automationRuns.createdAt}) < datetime(${cutoffIso})`,
        inArray(automationRuns.status, AUTOMATION_TERMINAL_STATUSES),
      ),
    )
    .limit(AUTOMATION_CLEANUP_LIMIT);

  await Promise.allSettled(
    staleRuns.map((run) =>
      Promise.resolve().then(() => {
        Bun.spawnSync(["rm", "-rf", join(AUTOMATION_SCREENSHOT_DIR, run.id)]);
      }),
    ),
  );
};

export const createFailedRunUpdate = (
  errorMessage: string,
  execution?: {
    exitCode?: number | null;
    timedOut?: boolean;
    aborted?: boolean;
    executionMs?: number | null;
    errorEnvelope?: ErrorEnvelope | null;
  },
) => {
  const now = new Date().toISOString();
  return {
    status: "error",
    output: {
      success: false,
      error: errorMessage,
      screenshots: [],
      steps: [
        {
          action: "automation",
          status: "error" as const,
          message: errorMessage,
        },
      ],
      errorEnvelope: execution?.errorEnvelope ?? null,
    },
    error: errorMessage,
    progress: AUTOMATION_FINISHED_PROGRESS,
    currentStep: 0,
    totalSteps: 0,
    exitCode: execution?.exitCode ?? null,
    timedOut: execution?.timedOut ?? false,
    aborted: execution?.aborted ?? false,
    executionMs: execution?.executionMs ?? null,
    completedAt: now,
    updatedAt: now,
  };
};

export const createCompletedRunUpdate = (
  output: RpaRunResult,
  execution: Pick<RpaScriptExecutionResult, "exitCode" | "timedOut" | "aborted" | "executionMs">,
) => {
  const now = new Date().toISOString();
  const finalStep = Array.isArray(output.steps) ? output.steps.length : 0;

  return {
    status: output.success ? "success" : "error",
    output: toJsonRecord(output),
    screenshots: output.screenshots,
    error: output.error,
    progress: AUTOMATION_FINISHED_PROGRESS,
    currentStep: finalStep,
    totalSteps: finalStep,
    exitCode: execution.exitCode,
    timedOut: execution.timedOut,
    aborted: execution.aborted,
    executionMs: execution.executionMs,
    completedAt: now,
    updatedAt: now,
  };
};
