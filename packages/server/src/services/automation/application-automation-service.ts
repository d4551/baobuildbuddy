import { existsSync, mkdirSync, rmSync } from "node:fs";
import { extname, resolve } from "node:path";
import { and, count, eq, inArray, ne, sql } from "drizzle-orm";

import type { AutomationSettings } from "@bao/shared";
import { DEFAULT_AUTOMATION_SETTINGS, automationSettingsSchema, generateId } from "@bao/shared";
import { AUTOMATION_SCREENSHOT_DIR } from "../../config/paths";
import { db } from "../../db/client";
import { coverLetters, resumes } from "../../db/schema";
import { automationRuns } from "../../db/schema/automation-runs";
import { DEFAULT_SETTINGS_ID, settings } from "../../db/schema/settings";
import { broadcastProgress } from "../../ws/automation.ws";
import { AIService } from "../ai/ai-service";
import { emailResponsePrompt } from "../ai/prompts";
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

type EmailResponseTone = "professional" | "friendly" | "concise";

interface EmailResponsePayload {
  subject: string;
  message: string;
  sender?: string;
  tone?: EmailResponseTone;
}

interface EmailResponseExecutionPayload {
  subject: string;
  message: string;
  sender?: string;
  tone: EmailResponseTone;
}

interface ScheduledRunMetadata {
  runAt: string;
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
const SUPPORTED_SCREENSHOT_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"] as const;
const RUN_SCREENSHOT_PREFIX = "step";
const MIN_SCREENSHOT_RETENTION_DAYS = 1;
const MAX_SCREENSHOT_RETENTION_DAYS = 30;
const MS_PER_DAY = 86_400_000;
const CLEANUP_LIMIT = 500;
const MAX_CONCURRENT_RUNS = 5;
const AUTOMATION_TERMINAL_STATUSES = ["success", "error"];
const MAX_EMAIL_SUBJECT_LENGTH = 200;
const MAX_EMAIL_MESSAGE_LENGTH = 12_000;
const MAX_EMAIL_SENDER_LENGTH = 200;
const DEFAULT_EMAIL_RESPONSE_TONE: EmailResponseTone = "professional";
const EMAIL_RESPONSE_TONES: readonly EmailResponseTone[] = [
  "professional",
  "friendly",
  "concise",
] as const;
const MIN_SCHEDULE_LEAD_TIME_MS = 1_000;
const MAX_SCHEDULE_LEAD_TIME_MS = 2_592_000_000;
const SCHEDULE_RETRY_DELAY_MS = 30_000;
const MAX_RECOVERABLE_SCHEDULED_RUNS = 500;

type SchedulerTimer = ReturnType<typeof setTimeout>;

const toErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const captureError = async (operation: Promise<unknown>): Promise<unknown | null> =>
  operation.then(
    () => null,
    (error: unknown) => error,
  );

const toJsonRecord = (value: object): Record<string, unknown> => {
  const record: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    record[key] = entry;
  }
  return record;
};

const toProgressRecord = (value: AutomationProgress): Record<string, unknown> => {
  const record: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) {
      record[key] = entry;
    }
  }
  return record;
};

const isEmailResponseTone = (value: string): value is EmailResponseTone =>
  EMAIL_RESPONSE_TONES.some((tone) => tone === value);

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
  private readonly scheduledRunTimers = new Map<string, SchedulerTimer>();
  private schedulerRecoveryInFlight = false;

  constructor() {
    void this.restoreScheduledRuns();
  }

  /**
   * Resolve automation settings from persisted values and apply safe defaults.
   */
  private async loadAutomationSettings(): Promise<AutomationSettings> {
    return db
      .select()
      .from(settings)
      .where(eq(settings.id, DEFAULT_SETTINGS_ID))
      .limit(1)
      .then((rows) => {
        if (rows.length > 0 && rows[0].automationSettings) {
          const parsedSettings = automationSettingsSchema.safeParse(rows[0].automationSettings);
          if (parsedSettings.success) {
            return parsedSettings.data;
          }
        }
        return DEFAULT_AUTOMATION_SETTINGS;
      })
      .catch(() => {
        // Fallback to hard defaults if settings read fails.
        return DEFAULT_AUTOMATION_SETTINGS;
      });
  }

  /**
   * Clamp configured max-concurrency to safe runtime bounds.
   */
  private resolveMaxConcurrentRuns(settingsValue: AutomationSettings): number {
    const configured = Number.isFinite(settingsValue.maxConcurrentRuns)
      ? Math.trunc(settingsValue.maxConcurrentRuns)
      : DEFAULT_AUTOMATION_SETTINGS.maxConcurrentRuns;

    return Math.min(Math.max(MIN_CONCURRENT_RUNS, configured), MAX_CONCURRENT_RUNS);
  }

  /**
   * Resolve AI service for smart selector mapping when enabled.
   */
  private async tryLoadAIService(): Promise<AIService | null> {
    return db
      .select()
      .from(settings)
      .where(eq(settings.id, DEFAULT_SETTINGS_ID))
      .limit(1)
      .then(([row]) => AIService.fromSettings(row))
      .catch(() => null);
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

    const normalizedPayload: JobApplyExecutionPayload = {
      jobUrl,
      resumeId,
      customAnswers,
    };
    const jobId = payload.jobId?.trim();
    if (jobId) {
      normalizedPayload.jobId = jobId;
    }
    const coverLetterId = payload.coverLetterId?.trim();
    if (coverLetterId) {
      normalizedPayload.coverLetterId = coverLetterId;
    }

    return normalizedPayload;
  }

  /**
   * Validate linked resume/cover letter entities before run creation.
   */
  private async assertJobApplyDependencies(payload: JobApplyExecutionPayload): Promise<void> {
    const resumeRows = await db
      .select()
      .from(resumes)
      .where(eq(resumes.id, payload.resumeId))
      .limit(1);
    if (resumeRows.length === 0) {
      throw new AutomationDependencyMissingError("resume", payload.resumeId);
    }

    if (!payload.coverLetterId) {
      return;
    }

    const coverLetterRows = await db
      .select()
      .from(coverLetters)
      .where(eq(coverLetters.id, payload.coverLetterId))
      .limit(1);
    if (coverLetterRows.length === 0) {
      throw new AutomationDependencyMissingError("coverLetter", payload.coverLetterId);
    }
  }

  /**
   * Normalize and validate an email-response automation payload.
   */
  private normalizeEmailResponsePayload(
    payload: EmailResponsePayload,
  ): EmailResponseExecutionPayload {
    const subject = payload.subject?.trim() ?? "";
    const message = payload.message?.trim() ?? "";
    const sender = payload.sender?.trim();
    const toneRaw = payload.tone?.trim();

    if (subject.length === 0 || subject.length > MAX_EMAIL_SUBJECT_LENGTH) {
      throw new AutomationValidationError(
        `subject is required and must be <= ${MAX_EMAIL_SUBJECT_LENGTH} characters`,
      );
    }

    if (message.length === 0 || message.length > MAX_EMAIL_MESSAGE_LENGTH) {
      throw new AutomationValidationError(
        `message is required and must be <= ${MAX_EMAIL_MESSAGE_LENGTH} characters`,
      );
    }

    if (sender && sender.length > MAX_EMAIL_SENDER_LENGTH) {
      throw new AutomationValidationError(
        `sender must be <= ${MAX_EMAIL_SENDER_LENGTH} characters`,
      );
    }

    const tone = toneRaw && isEmailResponseTone(toneRaw) ? toneRaw : DEFAULT_EMAIL_RESPONSE_TONE;

    return {
      subject,
      message,
      tone,
      ...(sender ? { sender } : {}),
    };
  }

  /**
   * Normalize a scheduled run datetime with strict bounds.
   */
  private normalizeScheduledRunAt(runAt: string): string {
    const parsedRunAt = new Date(runAt);
    const targetMs = parsedRunAt.getTime();
    if (Number.isNaN(targetMs)) {
      throw new AutomationValidationError("runAt must be a valid ISO timestamp");
    }

    const leadTimeMs = targetMs - Date.now();
    if (leadTimeMs < MIN_SCHEDULE_LEAD_TIME_MS) {
      throw new AutomationValidationError("runAt must be at least 1 second in the future");
    }
    if (leadTimeMs > MAX_SCHEDULE_LEAD_TIME_MS) {
      throw new AutomationValidationError("runAt must be within 30 days");
    }

    return parsedRunAt.toISOString();
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
      const copied = await sourceFile
        .arrayBuffer()
        .then(async (bytes) => {
          await Bun.write(destination, bytes);
          return true;
        })
        .catch(() => false);
      if (!copied) {
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
    const maxConcurrentRuns = this.resolveMaxConcurrentRuns(settingsSnapshot);

    await this.assertJobApplyDependencies(normalized);

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
   * Parse schedule metadata from persisted run input.
   */
  private parseScheduledRunMetadata(
    input: Record<string, unknown> | null,
  ): ScheduledRunMetadata | null {
    if (!input) {
      return null;
    }

    const scheduleValue = input.schedule;
    if (!scheduleValue || typeof scheduleValue !== "object" || Array.isArray(scheduleValue)) {
      return null;
    }

    if (!("runAt" in scheduleValue)) {
      return null;
    }

    const runAt = scheduleValue.runAt;
    if (typeof runAt !== "string" || runAt.trim().length === 0) {
      return null;
    }

    return { runAt: runAt.trim() };
  }

  /**
   * Parse custom-answers payload from persisted JSON.
   */
  private parseCustomAnswers(input: Record<string, unknown> | null): Record<string, string> {
    if (!input) {
      return {};
    }

    const value = input.customAnswers;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }

    const parsedAnswers: Record<string, string> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (typeof entry === "string" && entry.length > 0) {
        parsedAnswers[key] = entry;
      }
    }
    return parsedAnswers;
  }

  /**
   * Rebuild a job-apply payload from persisted automation run input.
   */
  private parseScheduledJobApplyPayload(
    input: Record<string, unknown> | null,
  ): JobApplyPayload | null {
    if (!input) {
      return null;
    }

    const jobUrl = typeof input.jobUrl === "string" ? input.jobUrl.trim() : "";
    const resumeId = typeof input.resumeId === "string" ? input.resumeId.trim() : "";
    if (jobUrl.length === 0 || resumeId.length === 0) {
      return null;
    }

    const payload: JobApplyPayload = {
      jobUrl,
      resumeId,
    };

    if (typeof input.coverLetterId === "string" && input.coverLetterId.trim().length > 0) {
      payload.coverLetterId = input.coverLetterId.trim();
    }
    if (typeof input.jobId === "string" && input.jobId.trim().length > 0) {
      payload.jobId = input.jobId.trim();
    }

    const customAnswers = this.parseCustomAnswers(input);
    if (Object.keys(customAnswers).length > 0) {
      payload.customAnswers = customAnswers;
    }

    return payload;
  }

  /**
   * Queue a scheduled run in-memory and execute it when due.
   */
  private queueScheduledRun(runId: string, payload: JobApplyPayload, runAt: string): void {
    this.clearScheduledRunTimer(runId);

    const delayMs = Math.max(0, new Date(runAt).getTime() - Date.now());
    const timer = setTimeout(() => {
      this.scheduledRunTimers.delete(runId);
      void this.executeScheduledRun(runId, payload);
    }, delayMs);
    if (typeof timer === "object" && timer !== null && "unref" in timer) {
      const possibleUnref = timer.unref;
      if (typeof possibleUnref === "function") {
        possibleUnref.call(timer);
      }
    }

    this.scheduledRunTimers.set(runId, timer);
  }

  /**
   * Clear a queued scheduled run timer.
   */
  private clearScheduledRunTimer(runId: string): void {
    const timer = this.scheduledRunTimers.get(runId);
    if (!timer) {
      return;
    }

    clearTimeout(timer);
    this.scheduledRunTimers.delete(runId);
  }

  /**
   * Load pending scheduled runs after process start and queue any future executions.
   */
  private async restoreScheduledRuns(): Promise<void> {
    if (this.schedulerRecoveryInFlight) {
      return;
    }

    this.schedulerRecoveryInFlight = true;
    await db
      .select()
      .from(automationRuns)
      .where(and(eq(automationRuns.status, "pending"), eq(automationRuns.type, "job_apply")))
      .limit(MAX_RECOVERABLE_SCHEDULED_RUNS)
      .then(async (pendingRows) => {
        for (const row of pendingRows) {
          const metadata = this.parseScheduledRunMetadata(row.input ?? null);
          const payload = this.parseScheduledJobApplyPayload(row.input ?? null);
          if (!metadata || !payload) {
            continue;
          }

          this.queueScheduledRun(row.id, payload, metadata.runAt);
        }
      })
      .finally(() => {
        this.schedulerRecoveryInFlight = false;
      });
  }

  /**
   * Schedule a new job-apply run for future execution.
   */
  async createScheduledJobApplyRun(
    payload: JobApplyPayload,
    runAt: string,
  ): Promise<{ runId: string; scheduledFor: string }> {
    const normalized = this.normalizePayload(payload);
    const scheduledFor = this.normalizeScheduledRunAt(runAt);
    await this.assertJobApplyDependencies(normalized);

    const now = new Date().toISOString();
    const runId = generateId();
    const scheduleInput = {
      ...this.buildAuditInput(normalized, true),
      schedule: { runAt: scheduledFor },
    } satisfies Record<string, unknown>;

    await db.insert(automationRuns).values({
      id: runId,
      type: "job_apply",
      status: "pending",
      jobId: normalized.jobId || null,
      userId: null,
      input: scheduleInput,
      progress: DEFAULT_PROGRESS,
      currentStep: null,
      totalSteps: null,
      startedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    this.queueScheduledRun(runId, normalized, scheduledFor);
    broadcastProgress(runId, {
      type: "scheduled",
      status: "pending",
      action: "job_apply",
      message: `Scheduled for ${scheduledFor}`,
      runId,
    });

    return { runId, scheduledFor };
  }

  /**
   * Execute a queued scheduled run, retrying when concurrency is saturated.
   */
  private async executeScheduledRun(runId: string, payload: JobApplyPayload): Promise<void> {
    const row = await db.select().from(automationRuns).where(eq(automationRuns.id, runId)).limit(1);
    if (row.length === 0 || row[0].status !== "pending") {
      return;
    }

    const executionError = await captureError(this.runJobApply(runId, payload));
    if (!executionError) {
      return;
    }

    if (executionError instanceof AutomationConcurrencyLimitError) {
      const nextRunAt = new Date(Date.now() + SCHEDULE_RETRY_DELAY_MS).toISOString();
      await db
        .update(automationRuns)
        .set({
          input: {
            ...this.buildAuditInput(this.normalizePayload(payload), true),
            schedule: { runAt: nextRunAt },
          },
          status: "pending",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(automationRuns.id, runId));

      this.queueScheduledRun(runId, payload, nextRunAt);
      broadcastProgress(runId, {
        type: "scheduled-retry",
        status: "pending",
        action: "job_apply",
        message: `Concurrency limit reached, retrying at ${nextRunAt}`,
        runId,
      });
      return;
    }

    throw executionError;
  }

  /**
   * Run an AI-assisted email response and persist output as an automation run.
   */
  async runEmailResponse(payload: EmailResponsePayload): Promise<{
    runId: string;
    status: "success";
    reply: string;
    provider: string;
    model: string;
  }> {
    const normalized = this.normalizeEmailResponsePayload(payload);
    const now = new Date().toISOString();
    const runId = generateId();

    await db.insert(automationRuns).values({
      id: runId,
      type: "email",
      status: "running",
      jobId: null,
      userId: null,
      input: {
        subject: normalized.subject,
        message: normalized.message,
        tone: normalized.tone,
        ...(normalized.sender ? { sender: normalized.sender } : {}),
      },
      progress: DEFAULT_PROGRESS,
      currentStep: 0,
      totalSteps: 1,
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return Promise.resolve()
      .then(async () => {
        const aiService = await this.tryLoadAIService();
        if (!aiService) {
          throw new Error("No AI provider is available for email response generation");
        }

        const aiResult = await aiService.generate(
          emailResponsePrompt(
            normalized.subject,
            normalized.message,
            normalized.tone,
            normalized.sender,
          ),
        );
        const reply = aiResult.content.trim();
        if (reply.length === 0) {
          throw new Error("AI provider returned an empty email response");
        }

        const completedAt = new Date().toISOString();
        await db
          .update(automationRuns)
          .set({
            status: "success",
            output: {
              success: true,
              reply,
              provider: aiResult.provider,
              model: aiResult.model,
            },
            error: null,
            progress: FINISHED_PROGRESS,
            currentStep: 1,
            totalSteps: 1,
            completedAt,
            updatedAt: completedAt,
          })
          .where(eq(automationRuns.id, runId));

        broadcastProgress(runId, {
          type: "complete",
          status: "success",
          action: "email_response",
          message: "Email response generated",
          runId,
        });

        return {
          runId,
          status: "success" as const,
          reply,
          provider: aiResult.provider,
          model: aiResult.model,
        };
      })
      .catch(async (error: unknown) => {
        const message = toErrorMessage(error, "Failed to generate email response");
        const completedAt = new Date().toISOString();

        await db
          .update(automationRuns)
          .set({
            status: "error",
            output: {
              success: false,
              error: message,
            },
            error: message,
            progress: FINISHED_PROGRESS,
            currentStep: 1,
            totalSteps: 1,
            completedAt,
            updatedAt: completedAt,
          })
          .where(eq(automationRuns.id, runId));

        broadcastProgress(runId, {
          type: "complete",
          status: "error",
          action: "email_response",
          message,
          runId,
        });

        throw error instanceof Error ? error : new Error(message);
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
      await Promise.resolve()
        .then(() => {
          const runDir = resolve(AUTOMATION_SCREENSHOT_DIR, run.id);
          if (existsSync(runDir)) {
            rmSync(runDir, { recursive: true, force: true });
          }
        })
        .catch(() => {
          // Best-effort retention cleanup should not break run state transitions.
        });
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
        output: toJsonRecord(output),
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
    this.clearScheduledRunTimer(runId);
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
    const maxConcurrentRuns = this.resolveMaxConcurrentRuns(automationSettings);
    const runningRows = await db
      .select({ count: count() })
      .from(automationRuns)
      .where(
        and(
          eq(automationRuns.status, "running"),
          eq(automationRuns.type, "job_apply"),
          ne(automationRuns.id, runId),
        ),
      );
    const runningCount = runningRows[0]?.count || 0;
    if (runningCount >= maxConcurrentRuns) {
      throw new AutomationConcurrencyLimitError(runningCount, maxConcurrentRuns);
    }

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
        selectorMap = await smartFieldMapper
          .analyze(
            normalized.jobUrl,
            ["fullName", "email", "phone", "resume", "coverLetter", "submit"],
            aiService,
          )
          .catch(() => ({}));
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

      broadcastProgress(runId, toProgressRecord(event));
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
    const executionPromise = Promise.resolve().then(async () => {
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
        const completionPayload: Record<string, string> = {
          type: "complete",
          status: sanitizedResult.success ? "success" : "error",
          action: sanitizedResult.success ? "completed" : "failed",
        };
        if (sanitizedResult.error) {
          completionPayload.message = sanitizedResult.error;
        }
        broadcastProgress(runId, {
          ...completionPayload,
        });

        if (!sanitizedResult.success) {
          throw new Error(sanitizedResult.error || "Job application automation failed");
        }

        if (sanitizedResult.success) {
          await gamificationService
            .awardXP(50, "automation_success")
            .then(() => undefined)
            .catch(() => {
              // Gamification should not block the automation flow.
            });
        }
      });
    const executionError = await captureError(executionPromise);
    if (executionError) {
      const message = toErrorMessage(executionError, "Job application automation failed");
      await this.markRunFailed(runId, message, automationSettings);
      broadcastProgress(runId, {
        type: "complete",
        status: "error",
        action: "automation",
        message,
      });
      throw executionError instanceof Error ? executionError : new Error(message);
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
