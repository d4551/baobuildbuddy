import { mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import type { AutomationSettings, ErrorEnvelope, RpaRunEvent, RpaRunResult } from "@bao/shared";
import {
  AUTOMATION_CLEANUP_LIMIT,
  AUTOMATION_FINISHED_PROGRESS,
  AUTOMATION_MAX_PROGRESS_STEPS,
  AUTOMATION_MAX_SCREENSHOT_NAME_LENGTH,
  AUTOMATION_MAX_SCREENSHOT_RETENTION_DAYS,
  AUTOMATION_MIN_ID_LENGTH,
  MS_PER_DAY,
  settle,
} from "@bao/shared";
import { and, eq, inArray, sql } from "drizzle-orm";
import { AUTOMATION_SCREENSHOT_DIR } from "../../config/paths";
import { db } from "../../db/client";
import { automationRuns } from "../../db/schema/automation-runs";
import {
  MAX_CUSTOM_ANSWER_KEY_LENGTH,
  MAX_CUSTOM_ANSWER_VALUE_LENGTH,
} from "./automation-validation";
import type { RpaScriptExecutionResult } from "./rpa-runner";

const SUPPORTED_SCREENSHOT_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"] as const;
const RUN_SCREENSHOT_PREFIX = "step";
const MIN_SCREENSHOT_RETENTION_DAYS = 1;
const AUTOMATION_TERMINAL_STATUSES = ["success", "error"];
const RUN_ID_PATTERN = /^[0-9a-f-]+$/i;
const DECIMAL_RADIX = 10;
const sanitizeStep = (step: {
  action?: unknown;
  status?: unknown;
  message?: unknown;
}): { action: string; status: "ok" | "error"; message?: string } | null => {
  if (!step || typeof step !== "object") {
    return null;
  }
  if (typeof step.action !== "string" || step.action.length > MAX_CUSTOM_ANSWER_KEY_LENGTH) {
    return null;
  }
  const status = step.status === "error" || step.status === "ok" ? step.status : "ok";
  if (typeof step.message !== "string" || step.message.length > MAX_CUSTOM_ANSWER_VALUE_LENGTH) {
    return { action: step.action, status };
  }
  return { action: step.action, status, message: step.message };
};

const sanitizeSteps = (
  steps: Array<{ action?: unknown; status?: unknown; message?: unknown }>,
): Array<{ action: string; status: "ok" | "error"; message?: string }> =>
  steps
    .map((step) => sanitizeStep(step))
    .filter(
      (step): step is { action: string; status: "ok" | "error"; message?: string } => step !== null,
    );

const toJsonRecord = (value: object): Record<string, unknown> => {
  const record: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    record[key] = entry;
  }
  return record;
};

export const sanitizeRunId = (runId: string, invalidRunIdMessage: string): string => {
  const safeId = runId.trim();
  if (!RUN_ID_PATTERN.test(safeId) || safeId.length < AUTOMATION_MIN_ID_LENGTH) {
    throw new Error(invalidRunIdMessage);
  }
  return safeId;
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

export const resolveRunArtifactDir = (
  runId: string,
  invalidRunIdMessage: string,
): string => {
  const safeRunId = sanitizeRunId(runId, invalidRunIdMessage);
  const directory = join(AUTOMATION_SCREENSHOT_DIR, safeRunId);
  mkdirSync(directory, { recursive: true });
  return directory;
};

const resolveScreenshotExtension = (pathValue: string): string => {
  const lastDotIndex = pathValue.lastIndexOf(".");
  const extension = lastDotIndex >= 0 ? pathValue.slice(lastDotIndex).toLowerCase() : "";
  if (
    SUPPORTED_SCREENSHOT_EXTENSIONS.includes(
      extension as (typeof SUPPORTED_SCREENSHOT_EXTENSIONS)[number],
    )
  ) {
    return extension;
  }
  return ".png";
};

const hashScreenshotSource = (sourcePath: string): string => {
  let hash = 0;
  for (let i = 0; i < sourcePath.length; i++) {
    hash = (hash * 31 + sourcePath.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(AUTOMATION_MIN_ID_LENGTH, "0");
};

const resolveScreenshotName = (index: number, sourcePath: string): string => {
  const extension = resolveScreenshotExtension(sourcePath);
  const stepToken = String(index + 1).padStart(2, "0");
  const shortName = `${RUN_SCREENSHOT_PREFIX}-${stepToken}${extension}`;
  if (shortName.length <= AUTOMATION_MAX_SCREENSHOT_NAME_LENGTH) {
    return shortName;
  }

  const fallbackHash = hashScreenshotSource(sourcePath);
  const base = `${RUN_SCREENSHOT_PREFIX}-${stepToken}-`;
  const maxSuffixLength = Math.max(
    4,
    AUTOMATION_MAX_SCREENSHOT_NAME_LENGTH - base.length - extension.length,
  );
  const suffix = fallbackHash.slice(0, maxSuffixLength);
  return `${base}${suffix}${extension}`;
};

const copySingleScreenshot = async (
  runDir: string,
  index: number,
  sourcePath: string,
): Promise<string | null> => {
  if (!sourcePath.trim()) {
    return null;
  }

  const sourceFile = Bun.file(sourcePath);
  const sourceExists = await sourceFile.exists();
  if (!sourceExists) {
    return null;
  }

  const safeFileName = resolveScreenshotName(index, sourcePath);
  const sourceResolvedPath = resolve(sourcePath);
  const destination = join(runDir, safeFileName);
  if (sourceResolvedPath === destination) {
    return safeFileName;
  }

  const bytesResult = await settle(sourceFile.arrayBuffer());
  if (bytesResult.status === "rejected") {
    return null;
  }
  const writeResult = await settle(Bun.write(destination, bytesResult.value));
  if (writeResult.status === "rejected") {
    return null;
  }
  return safeFileName;
};

const copyAndIndexScreenshots = async (
  runId: string,
  sourceScreenshots: string[] | undefined,
  invalidRunIdMessage: string,
): Promise<string[]> => {
  if (!Array.isArray(sourceScreenshots) || sourceScreenshots.length === 0) {
    return [];
  }

  const runDir = resolveRunArtifactDir(runId, invalidRunIdMessage);
  const copiedScreenshots = await Promise.all(
    sourceScreenshots.map((sourcePath, index) => copySingleScreenshot(runDir, index, sourcePath)),
  );
  return copiedScreenshots.filter((fileName): fileName is string => typeof fileName === "string");
};

export const normalizeExecutionResult = async (
  runId: string,
  execution: RpaScriptExecutionResult,
  invalidRunIdMessage: string,
): Promise<RpaRunResult> => {
  const terminalResult = execution.result;
  const copiedScreenshots = await copyAndIndexScreenshots(
    runId,
    terminalResult?.screenshots,
    invalidRunIdMessage,
  );
  const mergedArtifacts = [
    ...(terminalResult?.artifacts ?? []),
    ...copiedScreenshots.map((fileName, index) => ({
      id: `screenshot-${String(index + 1).padStart(2, "0")}`,
      kind: "screenshot" as const,
      path: fileName,
    })),
  ];

  return {
    success: terminalResult?.success ?? false,
    error: terminalResult?.error ?? execution.error?.message ?? null,
    screenshots: copiedScreenshots,
    artifacts: mergedArtifacts,
    steps: sanitizeSteps(terminalResult?.steps ?? []),
  };
};

export const persistProgress = async (event: RpaRunEvent): Promise<void> => {
  if (event.eventType !== "progress") {
    return;
  }

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
  await db.update(automationRuns).set(updates).where(eq(automationRuns.id, event.runId));
};

export const purgeExpiredAutomationScreenshots = async (retentionDays: number): Promise<void> => {
  const retention = Math.trunc(Number.isFinite(retentionDays) ? retentionDays : MIN_SCREENSHOT_RETENTION_DAYS);
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
        const runDir = join(AUTOMATION_SCREENSHOT_DIR, run.id);
        rmSync(runDir, { recursive: true, force: true });
      }),
    ),
  );
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
  const now = new Date().toISOString();
  await db
    .update(automationRuns)
    .set({
      status: "error",
      output: {
        success: false,
        error: errorMessage,
        screenshots: [],
        steps: [
          {
            action: "automation",
            status: "error",
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
    })
    .where(eq(automationRuns.id, runId));

  await purgeExpiredAutomationScreenshots(automationSettings.screenshotRetention);
};

export const markRunCompleted = async (
  runId: string,
  output: RpaRunResult,
  automationSettings: AutomationSettings,
  execution: Pick<RpaScriptExecutionResult, "exitCode" | "timedOut" | "aborted" | "executionMs">,
): Promise<void> => {
  const now = new Date().toISOString();
  const finalStatus = output.success ? "success" : "error";
  const finalStep = Array.isArray(output.steps) ? output.steps.length : 0;

  await db
    .update(automationRuns)
    .set({
      status: finalStatus,
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
    })
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
