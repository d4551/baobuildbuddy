import { existsSync, mkdirSync, rmSync } from "node:fs";
import { extname, resolve } from "node:path";
import { and, count, eq, inArray, sql } from "drizzle-orm";

import type { AutomationSettings } from "@bao/shared";
import { DEFAULT_AUTOMATION_SETTINGS, automationSettingsSchema, generateId } from "@bao/shared";
import { AUTOMATION_SCREENSHOT_DIR } from "../../config/paths";
import { db } from "../../db/client";
import { coverLetters, resumes } from "../../db/schema";
import { automationRuns } from "../../db/schema/automation-runs";
import { DEFAULT_SETTINGS_ID, settings } from "../../db/schema/settings";
import { broadcastProgress } from "../../ws/automation.ws";
import { AIService } from "../ai/ai-service";
import { gamificationService } from "../gamification-service";
import {
  MAX_CUSTOM_ANSWER_KEY_LENGTH,
  MAX_CUSTOM_ANSWER_VALUE_LENGTH,
  sanitizeAndValidateJobUrl,
  sanitizeCustomAnswers,
} from "./automation-validation";
import { type RpaRunResult, runRpaScript } from "./rpa-runner";
import { smartFieldMapper } from "./smart-field-mapper";

interface JobApplyPayload {
  jobUrl: string;
  resumeId: string;
  coverLetterId?: string;
  jobId?: string;
  customAnswers?: Record<string, string>;
}

interface JobApplyExecutionPayload {
  jobUrl: string;
  resumeId: string;
  coverLetterId?: string;
  jobId?: string;
  customAnswers: Record<string, string>;
}

interface RunProgressPayload {
  type?: unknown;
  step?: unknown;
  totalSteps?: unknown;
  status?: unknown;
  action?: unknown;
  message?: unknown;
}

interface AutomationProgress {
  type: string;
  step?: number;
  totalSteps?: number;
  status?: string;
  action?: string;
  message?: string;
  runId?: string;
}

const DEFAULT_PROGRESS = 0;
const FINISHED_PROGRESS = 100;
const MAX_SCREENSHOT_NAME_LENGTH = 96;
const MAX_PROGRESS_STEPS = 10_000;
const MIN_ID_LENGTH = 8;
const MIN_CONCURRENT_RUNS = 1;
const MIN_RESUME_ID_LENGTH = 1;
const MIN_RUN_ID_LENGTH = 8;
const SUPPORTED_SCREENSHOT_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"] as const;
const RUN_SCREENSHOT_PREFIX = "step";
const MIN_SCREENSHOT_RETENTION_DAYS = 1;
const MAX_SCREENSHOT_RETENTION_DAYS = 30;
const MS_PER_DAY = 86_400_000;
const CLEANUP_LIMIT = 500;
const MAX_CONCURRENT_RUNS = 5;
const AUTOMATION_TERMINAL_STATUSES = ["success", "error"] as const;

/**
 * Run-level error indicating the configured concurrency limit was exceeded.
 */
export class AutomationConcurrencyLimitError extends Error {
  constructor(
    public readonly runningRuns: number,
    public readonly maxConcurrentRuns: number,
  ) {
    super(`Automation concurrency limit reached: ${runningRuns}/${maxConcurrentRuns}`);
  }
}

/**
 * Run-level error indicating a linked resource is missing.
 */
export class AutomationDependencyMissingError extends Error {
  constructor(
    public readonly resource: "resume" | "coverLetter",
    public readonly resourceId: string,
  ) {
    super(`${resource} not found: ${resourceId}`);
  }
}

/**
 * Run-level error for malformed input payloads.
 */
export class AutomationValidationError extends Error {}

/**
 * Run-level error when a run record cannot be resolved.
 */
export class AutomationRunNotFoundError extends Error {
  constructor(runId: string) {
    super(`Automation run not found: ${runId}`);
  }
}

/**
 * Contract-driven job application automation workflow service.
 */
export class ApplicationAutomationService {
  /**
   * Resolve automation settings from persisted values and apply safe defaults.
   */
  private async loadAutomationSettings(): Promise<AutomationSettings> {
    try {
      const rows = await db
        .select()
        .from(settings)
        .where(eq(settings.id, DEFAULT_SETTINGS_ID))
        .limit(1);
      if (rows.length > 0 && rows[0].automationSettings) {
        const parsedSettings = automationSettingsSchema.safeParse(rows[0].automationSettings);
        if (parsedSettings.success) {
          return parsedSettings.data;
        }
      }
    } catch {
      // Fallback to hard defaults if settings read fails.
    }

    return DEFAULT_AUTOMATION_SETTINGS;
  }

  /**
   * Resolve AI service for smart selector mapping when enabled.
   */
  private async tryLoadAIService(): Promise<AIService | null> {
    try {
      const [row] = await db
        .select()
        .from(settings)
        .where(eq(settings.id, DEFAULT_SETTINGS_ID))
        .limit(1);
      if (!row) {
        return null;
      }
      return AIService.fromSettings(row);
    } catch {
      return null;
    }
  }

  /**
   * Normalize and validate the inbound execution payload.
   */
  private normalizePayload(payload: JobApplyPayload): JobApplyExecutionPayload {
    const jobUrl = sanitizeAndValidateJobUrl(payload.jobUrl);
    const customAnswers = sanitizeCustomAnswers(payload.customAnswers);

    const resumeId = payload.resumeId?.trim() ?? "";
    if (!resumeId || resumeId.length < MIN_RESUME_ID_LENGTH) {
      throw new AutomationValidationError("resumeId is required");
    }

    const jobId = payload.jobId?.trim() || undefined;
    const coverLetterId = payload.coverLetterId?.trim() || undefined;

    return {
      jobUrl,
      resumeId,
      coverLetterId,
      jobId,
      customAnswers,
    };
  }

  /**
   * Resolve the output directory for a single automation run.
   */
  private resolveRunArtifactDir(runId: string): string {
    const safeRunId = this.sanitizeRunId(runId);
    const directory = resolve(AUTOMATION_SCREENSHOT_DIR, safeRunId);
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }
    return directory;
  }

  /**
   * Copy screenshots from the Python process into the managed run directory.
   */
  private async copyAndIndexScreenshots(
    runId: string,
    sourceScreenshots: string[] | undefined,
  ): Promise<string[]> {
    if (!Array.isArray(sourceScreenshots) || sourceScreenshots.length === 0) {
      return [];
    }

    const runDir = this.resolveRunArtifactDir(runId);
    const result: string[] = [];

    for (const [index, sourcePath] of sourceScreenshots.entries()) {
      if (typeof sourcePath !== "string" || !sourcePath.trim()) {
        continue;
      }

      const sourceFile = Bun.file(sourcePath);
      if (!(await sourceFile.exists())) {
        continue;
      }

      const safeFileName = this.resolveScreenshotName(index, sourcePath);
      const destination = resolve(runDir, safeFileName);

      try {
        const bytes = await sourceFile.arrayBuffer();
        await Bun.write(destination, bytes);
      } catch {
        continue;
      }

      result.push(safeFileName);
    }

    return result;
  }

  /**
   * Build safe, deterministic screenshot names from script output paths.
   */
  private resolveScreenshotName(index: number, sourcePath: string): string {
    const extension = this.resolveScreenshotExtension(sourcePath);
    const stepToken = String(index + 1).padStart(2, "0");
    const shortName = `${RUN_SCREENSHOT_PREFIX}-${stepToken}${extension}`;
    if (shortName.length <= MAX_SCREENSHOT_NAME_LENGTH) {
      return shortName;
    }

    const fallbackHash = this.hashScreenshotSource(sourcePath);
    const base = `${RUN_SCREENSHOT_PREFIX}-${stepToken}-`;
    const maxSuffixLength = Math.max(
      4,
      MAX_SCREENSHOT_NAME_LENGTH - base.length - extension.length,
    );
    const suffix = fallbackHash.slice(0, maxSuffixLength);
    return `${base}${suffix}${extension}`;
  }

  /**
   * Deterministic fallback hash for screenshot naming.
   */
  private hashScreenshotSource(sourcePath: string): string {
    let hash = 0;
    for (let i = 0; i < sourcePath.length; i++) {
      hash = (hash * 31 + sourcePath.charCodeAt(i)) >>> 0;
    }
    return hash.toString(16).padStart(8, "0");
  }

  /**
   * Resolve a safe screenshot extension from script output.
   */
  private resolveScreenshotExtension(pathValue: string): string {
    const extension = extname(pathValue).toLowerCase();
    if (
      SUPPORTED_SCREENSHOT_EXTENSIONS.includes(
        extension as (typeof SUPPORTED_SCREENSHOT_EXTENSIONS)[number],
      )
    ) {
      return extension;
    }
    return ".png";
  }

  /**
   * Normalize a run payload for DB persistence.
   */
  private buildAuditInput(
    payload: JobApplyExecutionPayload,
    includeAction: boolean,
  ): Record<string, unknown> {
    const auditInput: Record<string, unknown> = {
      jobUrl: payload.jobUrl,
      resumeId: payload.resumeId,
      jobId: payload.jobId,
      customAnswers: payload.customAnswers,
    };

    if (payload.coverLetterId) {
      auditInput.coverLetterId = payload.coverLetterId;
    }

    if (includeAction) {
      auditInput.action = "job_apply";
    }

    return auditInput;
  }

  /**
   * Create a new run row after validating dependencies and concurrency limits.
   */
  async createJobApplyRun(
    payload: JobApplyPayload,
    options: { includeActionInPayload?: boolean } = {},
  ): Promise<string> {
    const normalized = this.normalizePayload(payload);
    const settingsSnapshot = await this.loadAutomationSettings();
    const configuredMaxConcurrentRuns = Number.isFinite(settingsSnapshot.maxConcurrentRuns)
      ? Math.trunc(settingsSnapshot.maxConcurrentRuns)
      : DEFAULT_AUTOMATION_SETTINGS.maxConcurrentRuns;
    const maxConcurrentRuns = Math.min(
      Math.max(MIN_CONCURRENT_RUNS, configuredMaxConcurrentRuns),
      MAX_CONCURRENT_RUNS,
    );

    const resumeRows = await db
      .select()
      .from(resumes)
      .where(eq(resumes.id, normalized.resumeId))
      .limit(1);
    if (resumeRows.length === 0) {
      throw new AutomationDependencyMissingError("resume", normalized.resumeId);
    }

    if (normalized.coverLetterId) {
      const coverLetterRows = await db
        .select()
        .from(coverLetters)
        .where(eq(coverLetters.id, normalized.coverLetterId))
        .limit(1);
      if (coverLetterRows.length === 0) {
        throw new AutomationDependencyMissingError("coverLetter", normalized.coverLetterId);
      }
    }

    const now = new Date().toISOString();

    return db.transaction(async (tx) => {
      const runningRows = await tx
        .select({ count: count() })
        .from(automationRuns)
        .where(and(eq(automationRuns.status, "running"), eq(automationRuns.type, "job_apply")));

      const runningCount = runningRows[0]?.count || 0;
      if (runningCount >= maxConcurrentRuns) {
        throw new AutomationConcurrencyLimitError(runningCount, maxConcurrentRuns);
      }

      const runId = generateId();
      await tx.insert(automationRuns).values({
        id: runId,
        type: "job_apply",
        status: "running",
        jobId: normalized.jobId || null,
        userId: null,
        input: this.buildAuditInput(normalized, options.includeActionInPayload || false),
        progress: DEFAULT_PROGRESS,
        currentStep: null,
        totalSteps: null,
        startedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      return runId;
    });
  }

  /**
   * Update run progress metrics from script progress events.
   */
  private async persistProgress(runId: string, data: RunProgressPayload): Promise<void> {
    const step = this.toFiniteNumber(data.step);
    const totalSteps = this.toFiniteNumber(data.totalSteps);

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
      updates.totalSteps = Math.min(MAX_PROGRESS_STEPS, Math.trunc(totalSteps));
    }

    if (Number.isFinite(step)) {
      const safeStep = Math.max(0, Math.trunc(step));
      updates.currentStep = updates.totalSteps ? Math.min(safeStep, updates.totalSteps) : safeStep;
      if (Number.isFinite(totalSteps) && totalSteps > 0) {
        updates.progress = Math.min(
          FINISHED_PROGRESS,
          Math.max(
            0,
            Math.round((updates.currentStep / (updates.totalSteps || 1)) * FINISHED_PROGRESS),
          ),
        );
      }
    }

    if (typeof data.status === "string") {
      updates.status = data.status;
    }

    if (!updates.status) {
      updates.status = "running";
    }

    await db.update(automationRuns).set(updates).where(eq(automationRuns.id, runId));
  }

  /**
   * Delete screenshot artifacts for completed runs older than retention window.
   */
  private async purgeExpiredAutomationScreenshots(retentionDays: number): Promise<void> {
    const retention = Math.trunc(
      Number.isFinite(retentionDays)
        ? retentionDays
        : DEFAULT_AUTOMATION_SETTINGS.screenshotRetention,
    );
    const safeRetention = Math.min(
      Math.max(retention, MIN_SCREENSHOT_RETENTION_DAYS),
      MAX_SCREENSHOT_RETENTION_DAYS,
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
      .limit(CLEANUP_LIMIT);

    for (const run of staleRuns) {
      try {
        const runDir = resolve(AUTOMATION_SCREENSHOT_DIR, run.id);
        if (existsSync(runDir)) {
          rmSync(runDir, { recursive: true, force: true });
        }
      } catch {
        // Best-effort retention cleanup should not break run state transitions.
      }
    }
  }

  /**
   * Persist a deterministic error result and completion timestamp.
   */
  private async markRunFailed(
    runId: string,
    errorMessage: string,
    automationSettings: AutomationSettings,
  ): Promise<void> {
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
        },
        error: errorMessage,
        progress: FINISHED_PROGRESS,
        currentStep: 0,
        totalSteps: 0,
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(automationRuns.id, runId));

    await this.purgeExpiredAutomationScreenshots(automationSettings.screenshotRetention);
  }

  /**
   * Persist run completion output and award deterministic metadata.
   */
  private async markRunCompleted(
    runId: string,
    output: RpaRunResult,
    automationSettings: AutomationSettings,
  ): Promise<void> {
    const now = new Date().toISOString();
    const finalStatus = output.success ? "success" : "error";
    const finalStep = Array.isArray(output.steps) ? output.steps.length : 0;

    await db
      .update(automationRuns)
      .set({
        status: finalStatus,
        output,
        screenshots: output.screenshots,
        error: output.error,
        progress: FINISHED_PROGRESS,
        currentStep: finalStep,
        totalSteps: finalStep,
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(automationRuns.id, runId));

    await this.purgeExpiredAutomationScreenshots(automationSettings.screenshotRetention);
  }

  /**
   * Run full job-application automation for an existing run.
   */
  async runJobApply(
    runId: string,
    payload: JobApplyPayload,
    onProgress?: (data: AutomationProgress) => void,
  ): Promise<void> {
    const normalized = this.normalizePayload(payload);

    const runRows = await db
      .select()
      .from(automationRuns)
      .where(eq(automationRuns.id, runId))
      .limit(1);
    if (runRows.length === 0) {
      const error = new AutomationRunNotFoundError(runId);
      throw error;
    }

    const automationSettings = await this.loadAutomationSettings();

    const resumeRows = await db
      .select()
      .from(resumes)
      .where(eq(resumes.id, normalized.resumeId))
      .limit(1);
    if (resumeRows.length === 0) {
      const error = new AutomationDependencyMissingError("resume", normalized.resumeId);
      await this.markRunFailed(runId, error.message, automationSettings);
      throw error;
    }

    const resume = resumeRows[0];
    let coverLetter: typeof coverLetters.$inferSelect | null = null;
    if (normalized.coverLetterId) {
      const coverLetterRows = await db
        .select()
        .from(coverLetters)
        .where(eq(coverLetters.id, normalized.coverLetterId))
        .limit(1);
      if (coverLetterRows.length === 0) {
        const error = new AutomationDependencyMissingError("coverLetter", normalized.coverLetterId);
        await this.markRunFailed(runId, error.message, automationSettings);
        throw error;
      }
      coverLetter = coverLetterRows[0];
    }

    let selectorMap: Record<string, string[]> = {};
    if (automationSettings.enableSmartSelectors) {
      const aiService = await this.tryLoadAIService();
      if (aiService) {
        try {
          selectorMap = await smartFieldMapper.analyze(
            normalized.jobUrl,
            ["fullName", "email", "phone", "resume", "coverLetter", "submit"],
            aiService,
          );
        } catch {
          selectorMap = {};
        }
      }
    }

    const progressHandler = (data: RunProgressPayload): void => {
      void this.persistProgress(runId, data);

      const step = this.toFiniteNumber(data.step);
      const totalSteps = this.toFiniteNumber(data.totalSteps);
      const event: AutomationProgress = {
        type: typeof data.type === "string" ? data.type : "progress",
        action: typeof data.action === "string" ? data.action : undefined,
        status: typeof data.status === "string" ? data.status : "running",
        message: typeof data.message === "string" ? data.message : undefined,
        runId,
      };

      if (Number.isFinite(step)) {
        event.step = Math.max(0, Math.trunc(step));
      }
      if (Number.isFinite(totalSteps)) {
        event.totalSteps = Math.max(0, Math.trunc(totalSteps));
      }

      broadcastProgress(runId, event);
      onProgress?.(event);
    };

    await db
      .update(automationRuns)
      .set({
        startedAt: new Date().toISOString(),
        status: "running",
        progress: DEFAULT_PROGRESS,
      })
      .where(eq(automationRuns.id, runId));

    try {
      const rawResult = await runRpaScript(
        "apply_job_rpa.py",
        {
          jobUrl: normalized.jobUrl,
          resume,
          coverLetter: coverLetter ? { content: coverLetter.content || {} } : null,
          customAnswers: normalized.customAnswers,
          selectorMap,
        },
        automationSettings,
        progressHandler,
      );

      const copiedScreenshots = await this.copyAndIndexScreenshots(runId, rawResult.screenshots);
      const sanitizedResult: RpaRunResult = {
        success: rawResult.success,
        error: rawResult.error,
        screenshots: copiedScreenshots,
        steps: sanitizeSteps(rawResult.steps),
      };

      await this.markRunCompleted(runId, sanitizedResult, automationSettings);
      broadcastProgress(runId, {
        type: "complete",
        status: sanitizedResult.success ? "success" : "error",
        action: sanitizedResult.success ? "completed" : "failed",
        message: sanitizedResult.error || undefined,
      });

      if (!sanitizedResult.success) {
        throw new Error(sanitizedResult.error || "Job application automation failed");
      }

      if (sanitizedResult.success) {
        try {
          await gamificationService.awardXP(50, "automation_success");
        } catch {
          // Gamification should not block the automation flow.
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Job application automation failed";
      await this.markRunFailed(runId, message, automationSettings);
      broadcastProgress(runId, {
        type: "complete",
        status: "error",
        action: "automation",
        message,
      });
      throw error instanceof Error ? error : new Error(message);
    }
  }

  private sanitizeRunId(runId: string): string {
    const safeId = runId.trim();
    if (!/^[0-9a-f-]+$/i.test(safeId) || safeId.length < MIN_ID_LENGTH) {
      throw new Error("runId is invalid");
    }
    return safeId;
  }

  private toFiniteNumber(value: unknown): number {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : Number.NaN;
    }
    if (typeof value === "string") {
      const parsed = Number.parseInt(value.trim(), 10);
      return Number.isFinite(parsed) ? parsed : Number.NaN;
    }
    return Number.NaN;
  }
}

function sanitizeSteps(
  steps: Array<{ action?: unknown; status?: unknown; message?: unknown }>,
): Array<{ action: string; status: "ok" | "error"; message?: string }> {
  return steps
    .map((step): { action: string; status: "ok" | "error"; message?: string } | null => {
      if (!step || typeof step !== "object") {
        return null;
      }

      const action =
        typeof step.action === "string" && step.action.length <= MAX_CUSTOM_ANSWER_KEY_LENGTH
          ? step.action
          : null;
      if (!action) {
        return null;
      }

      const status = step.status === "error" || step.status === "ok" ? step.status : "ok";
      const message =
        typeof step.message === "string" && step.message.length <= MAX_CUSTOM_ANSWER_VALUE_LENGTH
          ? step.message
          : undefined;
      return { action, status, ...(message ? { message } : {}) };
    })
    .filter(
      (step): step is { action: string; status: "ok" | "error"; message?: string } => step !== null,
    );
}

export const applicationAutomationService = new ApplicationAutomationService();
