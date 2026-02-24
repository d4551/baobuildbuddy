import { mkdirSync, rmSync } from "node:fs";
import { extname, resolve } from "node:path";
import type { AutomationSettings, ErrorEnvelope, RpaRunEvent, RpaRunResult } from "@bao/shared";
import {
  automationSettingsSchema,
  DEFAULT_AUTOMATION_SETTINGS,
  generateId,
  RPA_PROTOCOL_VERSION,
  rpaProgressEventSchema,
} from "@bao/shared";
import { and, count, eq, inArray, ne, sql } from "drizzle-orm";
import { config } from "../../config/env";
import { AUTOMATION_SCREENSHOT_DIR } from "../../config/paths";
import { db } from "../../db/client";
import { coverLetters, resumes } from "../../db/schema/schema-modules";
import { automationRuns } from "../../db/schema/automation-runs";
import { DEFAULT_SETTINGS_ID, settings } from "../../db/schema/settings";
import { broadcastAutomationEvent } from "../../ws/automation.ws";
import { AIService } from "../ai/ai-service";
import { emailResponsePrompt } from "../ai/prompts";
import { gamificationService } from "../gamification-service";
import {
  MAX_CUSTOM_ANSWER_KEY_LENGTH,
  MAX_CUSTOM_ANSWER_VALUE_LENGTH,
  sanitizeAndValidateJobUrl,
  sanitizeCustomAnswers,
} from "./automation-validation";
import { type RpaScriptExecutionResult, runRpaScript } from "./rpa-runner";
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

interface JobApplyRunPreparation {
  runId: string;
  automationSettings: AutomationSettings;
  normalized: JobApplyExecutionPayload;
  resume: typeof resumes.$inferSelect;
  coverLetter: typeof coverLetters.$inferSelect | null;
  selectorMap: Record<string, string[]>;
  progressHandler: (event: RpaRunEvent) => void;
  runArtifactDir: string;
}

interface JobApplyExecutionTracking {
  exitCode: number | null;
  timedOut: boolean;
  aborted: boolean;
  executionMs: number | null;
  errorEnvelope: ErrorEnvelope | null;
  terminalPersisted: boolean;
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
const RUN_ID_PATTERN = /^[0-9a-f-]+$/i;

type SchedulerTimer = ReturnType<typeof setTimeout>;

const toErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const settlePromise = async <T>(operation: Promise<T>): Promise<PromiseSettledResult<T>> => {
  const [result] = await Promise.allSettled([operation]);
  return result;
};

const toJsonRecord = (value: object): Record<string, unknown> => {
  const record: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    record[key] = entry;
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
  private readonly runEventSequences = new Map<string, number>();
  private schedulerRecoveryInFlight = false;

  constructor() {
    this.runBackgroundTask(this.restoreScheduledRuns());
  }

  /**
   * Execute a background task while consuming rejections.
   */
  private runBackgroundTask(task: Promise<unknown>): void {
    task.then(
      () => undefined,
      () => undefined,
    );
  }

  /**
   * Returns the next monotonic event sequence for a run.
   */
  private nextRunEventSequence(runId: string): number {
    const current = this.runEventSequences.get(runId) ?? 0;
    this.runEventSequences.set(runId, current + 1);
    return current;
  }

  /**
   * Builds a protocol-compliant progress event for websocket broadcasting.
   */
  private createProgressEvent(params: {
    runId: string;
    action: string;
    status: "pending" | "running" | "success" | "error";
    message?: string;
    step?: number;
    totalSteps?: number;
  }): RpaRunEvent {
    const event = {
      protocolVersion: RPA_PROTOCOL_VERSION,
      runId: params.runId,
      sequence: this.nextRunEventSequence(params.runId),
      timestamp: new Date().toISOString(),
      eventType: "progress",
      action: params.action,
      status: params.status,
      ...(params.message ? { message: params.message } : {}),
      ...(typeof params.step === "number" ? { step: params.step } : {}),
      ...(typeof params.totalSteps === "number" ? { totalSteps: params.totalSteps } : {}),
    } as const;

    const validated = rpaProgressEventSchema.parse(event);
    return validated;
  }

  /**
   * Resolve automation settings from persisted values and apply safe defaults.
   */
  private async loadAutomationSettings(): Promise<AutomationSettings> {
    const settingsQueryResult = await settlePromise(
      db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID)).limit(1),
    );
    if (settingsQueryResult.status === "rejected") {
      return DEFAULT_AUTOMATION_SETTINGS;
    }

    const rows = settingsQueryResult.value;
    if (rows.length > 0 && rows[0].automationSettings) {
      const parsedSettings = automationSettingsSchema.safeParse(rows[0].automationSettings);
      if (parsedSettings.success) {
        return parsedSettings.data;
      }
    }

    return DEFAULT_AUTOMATION_SETTINGS;
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
    const settingsQueryResult = await settlePromise(
      db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID)).limit(1),
    );
    if (settingsQueryResult.status === "rejected") {
      return null;
    }

    const [row] = settingsQueryResult.value;
    return AIService.fromSettings(row);
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
    mkdirSync(directory, { recursive: true });
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
    const copiedScreenshots = await Promise.all(
      sourceScreenshots.map((sourcePath, index) => this.copySingleScreenshot(runDir, index, sourcePath)),
    );
    return copiedScreenshots.filter((fileName): fileName is string => typeof fileName === "string");
  }

  private async copySingleScreenshot(
    runDir: string,
    index: number,
    sourcePath: string,
  ): Promise<string | null> {
    if (!sourcePath.trim()) {
      return null;
    }

    const sourceFile = Bun.file(sourcePath);
    if (!(await sourceFile.exists())) {
      return null;
    }

    const safeFileName = this.resolveScreenshotName(index, sourcePath);
    const destination = resolve(runDir, safeFileName);
    const sourceResolvedPath = resolve(sourcePath);
    if (sourceResolvedPath === destination) {
      return safeFileName;
    }

    const bytesResult = await settlePromise(sourceFile.arrayBuffer());
    if (bytesResult.status === "rejected") {
      return null;
    }
    const writeResult = await settlePromise(Bun.write(destination, bytesResult.value));
    if (writeResult.status === "rejected") {
      return null;
    }
    return safeFileName;
  }

  /**
   * Normalizes runner execution output into persisted run-result contract.
   */
  private async normalizeExecutionResult(
    runId: string,
    execution: RpaScriptExecutionResult,
  ): Promise<RpaRunResult> {
    const terminalResult = execution.result;
    const copiedScreenshots = await this.copyAndIndexScreenshots(
      runId,
      terminalResult?.screenshots,
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
        input: this.buildAuditInput(normalized, options.includeActionInPayload ?? false),
        progress: DEFAULT_PROGRESS,
        currentStep: null,
        totalSteps: null,
        exitCode: null,
        timedOut: false,
        aborted: false,
        executionMs: null,
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
      this.runBackgroundTask(this.executeScheduledRun(runId, payload));
    }, delayMs);
    if (
      typeof timer === "object" &&
      timer !== null &&
      "unref" in timer &&
      typeof timer.unref === "function"
    ) {
      timer.unref();
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
    const pendingRowsResult = await settlePromise(
      db
        .select()
        .from(automationRuns)
        .where(and(eq(automationRuns.status, "pending"), eq(automationRuns.type, "job_apply")))
        .limit(MAX_RECOVERABLE_SCHEDULED_RUNS),
    );

    if (pendingRowsResult.status === "fulfilled") {
      for (const row of pendingRowsResult.value) {
        const metadata = this.parseScheduledRunMetadata(row.input ?? null);
        const payload = this.parseScheduledJobApplyPayload(row.input ?? null);
        if (!(metadata && payload)) {
          continue;
        }

        this.queueScheduledRun(row.id, payload, metadata.runAt);
      }
    }

    this.schedulerRecoveryInFlight = false;
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
      exitCode: null,
      timedOut: false,
      aborted: false,
      executionMs: null,
      startedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    this.queueScheduledRun(runId, normalized, scheduledFor);
    broadcastAutomationEvent(
      this.createProgressEvent({
        runId,
        action: "job_apply",
        status: "pending",
        message: `Scheduled for ${scheduledFor}`,
      }),
    );

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

    const executionResult = await settlePromise(this.runJobApply(runId, payload));
    if (executionResult.status === "fulfilled") {
      return;
    }

    if (executionResult.reason instanceof AutomationConcurrencyLimitError) {
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
      broadcastAutomationEvent(
        this.createProgressEvent({
          runId,
          action: "job_apply",
          status: "pending",
          message: `Concurrency limit reached, retrying at ${nextRunAt}`,
        }),
      );
      return;
    }

    throw executionResult.reason;
  }

  private async createEmailResponseRun(
    runId: string,
    normalized: EmailResponseExecutionPayload,
  ): Promise<void> {
    const now = new Date().toISOString();
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
      exitCode: 0,
      timedOut: false,
      aborted: false,
      executionMs: null,
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  private async failEmailResponseRun(runId: string, error: unknown): Promise<never> {
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
    broadcastAutomationEvent(
      this.createProgressEvent({
        runId,
        action: "email_response",
        status: "error",
        message,
        step: 1,
        totalSteps: 1,
      }),
    );
    throw error instanceof Error ? error : new Error(message);
  }

  private async generateEmailResponse(
    normalized: EmailResponseExecutionPayload,
  ): Promise<{ reply: string; provider: string; model: string }> {
    const aiService = await this.tryLoadAIService();
    if (!aiService) {
      throw new Error("No AI provider is available for email response generation");
    }
    const aiResultOutcome = await settlePromise(
      aiService.generate(
        emailResponsePrompt(
          normalized.subject,
          normalized.message,
          normalized.tone,
          normalized.sender,
        ),
      ),
    );
    if (aiResultOutcome.status === "rejected") {
      throw aiResultOutcome.reason;
    }
    const aiResult = aiResultOutcome.value;
    const reply = aiResult.content.trim();
    if (reply.length === 0) {
      throw new Error("AI provider returned an empty email response");
    }
    return { reply, provider: aiResult.provider, model: aiResult.model };
  }

  private async completeEmailResponseRun(
    runId: string,
    result: { reply: string; provider: string; model: string },
  ): Promise<void> {
    const completedAt = new Date().toISOString();
    await db
      .update(automationRuns)
      .set({
        status: "success",
        output: {
          success: true,
          reply: result.reply,
          provider: result.provider,
          model: result.model,
        },
        error: null,
        progress: FINISHED_PROGRESS,
        currentStep: 1,
        totalSteps: 1,
        completedAt,
        updatedAt: completedAt,
      })
      .where(eq(automationRuns.id, runId));
    broadcastAutomationEvent(
      this.createProgressEvent({
        runId,
        action: "email_response",
        status: "success",
        message: "Email response generated",
        step: 1,
        totalSteps: 1,
      }),
    );
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
    const runId = generateId();
    await this.createEmailResponseRun(runId, normalized);
    const responseResult = await settlePromise(this.generateEmailResponse(normalized));
    if (responseResult.status === "rejected") {
      return this.failEmailResponseRun(runId, responseResult.reason);
    }
    await this.completeEmailResponseRun(runId, responseResult.value);
    return { runId, status: "success", ...responseResult.value };
  }

  /**
   * Update run progress metrics from script progress events.
   */
  private async persistProgress(event: RpaRunEvent): Promise<void> {
    if (event.eventType !== "progress") {
      return;
    }

    const step = this.toFiniteNumber(event.step);
    const totalSteps = this.toFiniteNumber(event.totalSteps);

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

    if (typeof event.status === "string") {
      updates.status = event.status;
    }

    if (!updates.status) {
      updates.status = "running";
    }

    await db.update(automationRuns).set(updates).where(eq(automationRuns.id, event.runId));
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

    await Promise.allSettled(
      staleRuns.map((run) =>
        Promise.resolve().then(() => {
          const runDir = resolve(AUTOMATION_SCREENSHOT_DIR, run.id);
          rmSync(runDir, { recursive: true, force: true });
        }),
      ),
    );
  }

  /**
   * Persist a deterministic error result and completion timestamp.
   */
  private async markRunFailed(
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
          errorEnvelope: execution?.errorEnvelope ?? null,
        },
        error: errorMessage,
        progress: FINISHED_PROGRESS,
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

    await this.purgeExpiredAutomationScreenshots(automationSettings.screenshotRetention);
  }

  /**
   * Persist run completion output and award deterministic metadata.
   */
  private async markRunCompleted(
    runId: string,
    output: RpaRunResult,
    automationSettings: AutomationSettings,
    execution: Pick<RpaScriptExecutionResult, "exitCode" | "timedOut" | "aborted" | "executionMs">,
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
        exitCode: execution.exitCode,
        timedOut: execution.timedOut,
        aborted: execution.aborted,
        executionMs: execution.executionMs,
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(automationRuns.id, runId));

    await this.purgeExpiredAutomationScreenshots(automationSettings.screenshotRetention);
  }

  private async assertRunExists(runId: string): Promise<void> {
    const runRows = await db
      .select()
      .from(automationRuns)
      .where(eq(automationRuns.id, runId))
      .limit(1);
    if (runRows.length === 0) {
      throw new AutomationRunNotFoundError(runId);
    }
  }

  private async assertConcurrencyLimit(runId: string, maxConcurrentRuns: number): Promise<void> {
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
  }

  private async loadResumeOrFail(
    runId: string,
    resumeId: string,
    automationSettings: AutomationSettings,
  ): Promise<typeof resumes.$inferSelect> {
    const resumeRows = await db
      .select()
      .from(resumes)
      .where(eq(resumes.id, resumeId))
      .limit(1);
    if (resumeRows.length === 0) {
      const error = new AutomationDependencyMissingError("resume", resumeId);
      await this.markRunFailed(runId, error.message, automationSettings);
      throw error;
    }
    return resumeRows[0];
  }

  private async loadCoverLetterOrFail(
    runId: string,
    coverLetterId: string | undefined,
    automationSettings: AutomationSettings,
  ): Promise<typeof coverLetters.$inferSelect | null> {
    if (!coverLetterId) {
      return null;
    }

    const coverLetterRows = await db
      .select()
      .from(coverLetters)
      .where(eq(coverLetters.id, coverLetterId))
      .limit(1);
    if (coverLetterRows.length === 0) {
      const error = new AutomationDependencyMissingError("coverLetter", coverLetterId);
      await this.markRunFailed(runId, error.message, automationSettings);
      throw error;
    }
    return coverLetterRows[0];
  }

  private async resolveSelectorMap(
    automationSettings: AutomationSettings,
    jobUrl: string,
  ): Promise<Record<string, string[]>> {
    if (!automationSettings.enableSmartSelectors) {
      return {};
    }

    const aiService = await this.tryLoadAIService();
    if (!aiService) {
      return {};
    }

    return smartFieldMapper.analyze(jobUrl, ["fullName", "email", "phone", "resume", "coverLetter", "submit"], aiService);
  }

  private createProgressHandler(onProgress?: (event: RpaRunEvent) => void): (event: RpaRunEvent) => void {
    return (event: RpaRunEvent): void => {
      if (event.eventType !== "progress") {
        return;
      }

      this.runBackgroundTask(this.persistProgress(event));
      broadcastAutomationEvent(event);
      onProgress?.(event);
    };
  }

  private async markRunStarted(runId: string): Promise<void> {
    await db
      .update(automationRuns)
      .set({
        startedAt: new Date().toISOString(),
        status: "running",
        progress: DEFAULT_PROGRESS,
        exitCode: null,
        timedOut: false,
        aborted: false,
        executionMs: null,
      })
      .where(eq(automationRuns.id, runId));
  }

  private createExecutionTracking(): JobApplyExecutionTracking {
    return {
      exitCode: null,
      timedOut: false,
      aborted: false,
      executionMs: null,
      errorEnvelope: null,
      terminalPersisted: false,
    };
  }

  private async runJobApplyScript(
    preparation: JobApplyRunPreparation,
    tracking: JobApplyExecutionTracking,
  ): Promise<RpaScriptExecutionResult> {
    const execution = await runRpaScript({
      scriptName: "apply_job_rpa.py",
      scriptInput: {
        jobUrl: preparation.normalized.jobUrl,
        resume: preparation.resume,
        coverLetter: preparation.coverLetter ? { content: preparation.coverLetter.content || {} } : null,
        customAnswers: preparation.normalized.customAnswers,
        selectorMap: preparation.selectorMap,
      },
      executionContext: {
        runId: preparation.runId,
        timeoutMs:
          Number.isFinite(preparation.automationSettings.defaultTimeout) &&
          preparation.automationSettings.defaultTimeout > 0
            ? Math.trunc(preparation.automationSettings.defaultTimeout * 1_000)
            : config.automationScriptTimeoutMs,
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
  }

  private async finalizeJobApplySuccess(
    preparation: JobApplyRunPreparation,
    tracking: JobApplyExecutionTracking,
    execution: RpaScriptExecutionResult,
  ): Promise<void> {
    const normalizedResult = await this.normalizeExecutionResult(preparation.runId, execution);
    await this.markRunCompleted(
      preparation.runId,
      normalizedResult,
      preparation.automationSettings,
      execution,
    );
    tracking.terminalPersisted = true;

    if (!normalizedResult.success) {
      throw new Error(normalizedResult.error || "Job application automation failed");
    }

    broadcastAutomationEvent(
      this.createProgressEvent({
        runId: preparation.runId,
        action: "completed",
        status: "success",
        message: "Job application automation completed",
      }),
    );

    const awardXpResult = await settlePromise(
      gamificationService.awardXP(50, "automation_success"),
    );
    if (awardXpResult.status === "rejected") {
      return;
    }
  }

  private async executeJobApplyRun(
    preparation: JobApplyRunPreparation,
    tracking: JobApplyExecutionTracking,
  ): Promise<void> {
    const execution = await this.runJobApplyScript(preparation, tracking);
    await this.finalizeJobApplySuccess(preparation, tracking, execution);
  }

  private async handleExecutionFailure(
    runId: string,
    automationSettings: AutomationSettings,
    tracking: JobApplyExecutionTracking,
    reason: unknown,
  ): Promise<never> {
    const message = toErrorMessage(reason, "Job application automation failed");
    if (!tracking.terminalPersisted) {
      await this.markRunFailed(runId, message, automationSettings, {
        exitCode: tracking.exitCode,
        timedOut: tracking.timedOut,
        aborted: tracking.aborted,
        executionMs: tracking.executionMs,
        errorEnvelope: tracking.errorEnvelope,
      });
    }
    broadcastAutomationEvent(
      this.createProgressEvent({
        runId,
        action: "automation",
        status: "error",
        message,
      }),
    );
    throw reason instanceof Error ? reason : new Error(message);
  }

  private async prepareJobApplyRun(
    runId: string,
    payload: JobApplyPayload,
    onProgress?: (event: RpaRunEvent) => void,
  ): Promise<JobApplyRunPreparation> {
    this.clearScheduledRunTimer(runId);
    const normalized = this.normalizePayload(payload);
    await this.assertRunExists(runId);

    const automationSettings = await this.loadAutomationSettings();
    const maxConcurrentRuns = this.resolveMaxConcurrentRuns(automationSettings);
    await this.assertConcurrencyLimit(runId, maxConcurrentRuns);

    const resume = await this.loadResumeOrFail(runId, normalized.resumeId, automationSettings);
    const coverLetter = await this.loadCoverLetterOrFail(
      runId,
      normalized.coverLetterId,
      automationSettings,
    );
    const selectorMap = await this.resolveSelectorMap(automationSettings, normalized.jobUrl);
    const progressHandler = this.createProgressHandler(onProgress);
    const runArtifactDir = this.resolveRunArtifactDir(runId);

    return {
      runId,
      automationSettings,
      normalized,
      resume,
      coverLetter,
      selectorMap,
      progressHandler,
      runArtifactDir,
    };
  }

  /**
   * Run full job-application automation for an existing run.
   */
  async runJobApply(
    runId: string,
    payload: JobApplyPayload,
    onProgress?: (event: RpaRunEvent) => void,
  ): Promise<void> {
    const preparation = await this.prepareJobApplyRun(runId, payload, onProgress);
    await this.markRunStarted(runId);

    const tracking = this.createExecutionTracking();
    const executionResult = await settlePromise(this.executeJobApplyRun(preparation, tracking));
    if (executionResult.status === "rejected") {
      await this.handleExecutionFailure(
        runId,
        preparation.automationSettings,
        tracking,
        executionResult.reason,
      );
    }
  }

  private sanitizeRunId(runId: string): string {
    const safeId = runId.trim();
    if (!RUN_ID_PATTERN.test(safeId) || safeId.length < MIN_ID_LENGTH) {
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
    .map((step) => sanitizeStep(step))
    .filter(
      (step): step is { action: string; status: "ok" | "error"; message?: string } => step !== null,
    );
}

function sanitizeStep(
  step: { action?: unknown; status?: unknown; message?: unknown },
): { action: string; status: "ok" | "error"; message?: string } | null {
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
}

export const applicationAutomationService = new ApplicationAutomationService();
