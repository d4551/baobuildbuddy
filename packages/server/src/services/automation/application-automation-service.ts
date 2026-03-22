import { mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import type {
  AutomationScrapeTarget,
  AutomationSettings,
  EmailResponseRequest,
  EmailResponseResult,
  EmailResponseTone,
  ErrorEnvelope,
  ResumeData,
  RpaCapabilityAuditEntry,
  RpaCapabilityAuditReport,
  RpaCapabilityAuditSummary,
  RpaRunEvent,
  RpaRunResult,
} from "@bao/shared";
import {
  API_ERROR_EMAIL_DELIVERY_FAILED,
  API_ERROR_EMAIL_DELIVERY_SETTINGS_MISSING,
  API_ERROR_EMPTY_EMAIL_RESPONSE,
  API_ERROR_GENERATE_EMAIL_RESPONSE,
  API_ERROR_JOB_APPLICATION_AUTOMATION_FAILED,
  API_ERROR_NO_AI_PROVIDER_EMAIL,
  API_ERROR_RUN_ID_INVALID,
  API_ERROR_SCRAPE_JOBS_FAILED,
  API_ERROR_SCRAPE_STUDIOS_FAILED,
  API_MESSAGE_EMAIL_RESPONSE_DELIVERED,
  API_MESSAGE_EMAIL_RESPONSE_GENERATED,
  API_MESSAGE_JOB_APPLICATION_AUTOMATION_COMPLETED,
  AUTOMATION_CLEANUP_LIMIT,
  AUTOMATION_FINISHED_PROGRESS,
  AUTOMATION_MAX_CONCURRENT_RUNS,
  AUTOMATION_MAX_EMAIL_MESSAGE_LENGTH,
  AUTOMATION_MAX_PROGRESS_STEPS,
  AUTOMATION_MAX_SCHEDULE_LEAD_TIME_MS,
  AUTOMATION_MAX_SCREENSHOT_NAME_LENGTH,
  AUTOMATION_MAX_SCREENSHOT_RETENTION_DAYS,
  AUTOMATION_MIN_ID_LENGTH,
  AUTOMATION_SCHEDULE_RETRY_DELAY_MS,
  AUTOMATION_SCRAPE_JOB_TARGETS,
  AUTOMATION_SCRAPE_TARGETS,
  automationScrapeTargetToAction,
  automationScrapeTargetToPortalId,
  automationSettingsSchema,
  buildRpaCapabilityIdFromScrapeTarget,
  DECIMAL_RADIX,
  DEFAULT_AUTOMATION_SETTINGS,
  DEFAULT_EMAIL_TRANSPORT_SETTINGS,
  emailTransportSettingsSchema,
  generateId,
  isAutomationJobScrapeTarget,
  isEmailTransportConfigured,
  isValidEmail,
  MS_PER_DAY,
  ROUTE_GAMIFICATION_XP,
  RPA_PROTOCOL_VERSION,
  rpaProgressEventSchema,
  SCHEMA_MAX_ITEMS_BOARDS,
  SCHEMA_MAX_LENGTH_SHORT,
  settle,
  toErrorMessage,
} from "@bao/shared";
import { and, count, eq, inArray, ne, sql } from "drizzle-orm";
import { config } from "../../config/env";
import { AUTOMATION_SCREENSHOT_DIR } from "../../config/paths";
import { db } from "../../db/client";
import { automationRuns } from "../../db/schema/automation-runs";
import { coverLetters, resumes } from "../../db/schema/schema-modules";
import { DEFAULT_SETTINGS_ID, settings } from "../../db/schema/settings";
import { createServerLogger } from "../../utils/logger";
import { broadcastAutomationEvent } from "../../ws/automation.ws";
import { AIService } from "../ai/ai-service";
import { emailResponsePrompt } from "../ai/prompts";
import { type EmailTransportRuntimeConfig, emailDeliveryService } from "../email-delivery-service";
import { exportService } from "../export-service";
import { gamificationService } from "../gamification-service";
import { loadJobProviderSettings } from "../jobs/providers/provider-settings";
import { resumeService } from "../resume-service";
import { scraperService } from "../scraper-service";
import {
  MAX_CUSTOM_ANSWER_KEY_LENGTH,
  MAX_CUSTOM_ANSWER_VALUE_LENGTH,
  sanitizeAndValidateJobUrl,
  sanitizeCustomAnswers,
} from "./automation-validation";
import { type RpaScriptExecutionResult, runRpaScript } from "./rpa-runner";
import {
  type SmartFieldAnalysisContext,
  type SmartFieldAnalysisResult,
  smartFieldMapper,
} from "./smart-field-mapper";

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

interface EmailResponseExecutionPayload {
  subject: string;
  message: string;
  sender?: string;
  tone: EmailResponseTone;
  recipientEmail?: string;
  deliverAfterGeneration: boolean;
}

interface EmailDeliveryDetails {
  delivered: boolean;
  recipientEmail?: string;
  deliveredAt?: string;
  messageId?: string;
}

interface ScheduledRunMetadata {
  runAt: string;
}

interface ScrapeExecutionPayload {
  target: AutomationScrapeTarget;
}

interface ScrapePortalAuditConfig {
  name: string;
  enabled: boolean;
  fallbackUrl: string;
}

interface ScrapePortalAuditSnapshot {
  portalConfigById: Map<string, ScrapePortalAuditConfig>;
  sharedSettingsIssue: string | null;
}

const createJobApplyCapabilityAuditEntry = (): RpaCapabilityAuditEntry => ({
  id: "job_apply",
  category: "job_apply",
  name: "Job Apply",
  target: null,
  implemented: true,
  configured: true,
  enabled: true,
  manualRunAvailable: true,
  scheduledRunAvailable: true,
  runHistoryAvailable: true,
  liveUpdatesAvailable: true,
  issues: [],
});

const createStudioScrapeCapabilityAuditEntry = (): RpaCapabilityAuditEntry => ({
  id: buildRpaCapabilityIdFromScrapeTarget("studios"),
  category: "scrape",
  name: "Studios",
  target: "studios",
  implemented: true,
  configured: true,
  enabled: true,
  manualRunAvailable: true,
  scheduledRunAvailable: true,
  runHistoryAvailable: true,
  liveUpdatesAvailable: true,
  issues: [],
});

const summarizeRpaCapabilities = (
  capabilities: readonly RpaCapabilityAuditEntry[],
): RpaCapabilityAuditSummary =>
  capabilities.reduce<RpaCapabilityAuditSummary>(
    (accumulator, capability) => ({
      total: accumulator.total + 1,
      configured: accumulator.configured + (capability.configured ? 1 : 0),
      manualRunAvailable: accumulator.manualRunAvailable + (capability.manualRunAvailable ? 1 : 0),
      scheduledRunAvailable:
        accumulator.scheduledRunAvailable + (capability.scheduledRunAvailable ? 1 : 0),
      runHistoryAvailable:
        accumulator.runHistoryAvailable + (capability.runHistoryAvailable ? 1 : 0),
      liveUpdatesAvailable:
        accumulator.liveUpdatesAvailable + (capability.liveUpdatesAvailable ? 1 : 0),
    }),
    {
      total: 0,
      configured: 0,
      manualRunAvailable: 0,
      scheduledRunAvailable: 0,
      runHistoryAvailable: 0,
      liveUpdatesAvailable: 0,
    },
  );

interface JobApplyRunPreparation {
  runId: string;
  automationSettings: AutomationSettings;
  normalized: JobApplyExecutionPayload;
  resume: ResumeData;
  coverLetter: typeof coverLetters.$inferSelect | null;
  selectorMap: Record<string, string[]>;
  resumeFilePath?: string;
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

interface AutofillAnalysisOptions {
  automationSettings: AutomationSettings;
  jobUrl: string;
  resume: ResumeData;
  coverLetter: typeof coverLetters.$inferSelect | null;
  existingAnswers: Record<string, string>;
}

type AutomationRunRow = typeof automationRuns.$inferSelect;

const DEFAULT_PROGRESS = 0;
const MIN_CONCURRENT_RUNS = 1;
const MIN_RESUME_ID_LENGTH = 1;
const SMART_FIELD_CORE_KEYS = [
  "fullName",
  "email",
  "phone",
  "resume",
  "coverLetter",
  "submit",
] as const;
const SUPPORTED_SCREENSHOT_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"] as const;
const RUN_SCREENSHOT_PREFIX = "step";
const MIN_SCREENSHOT_RETENTION_DAYS = 1;
const AUTOMATION_TERMINAL_STATUSES = ["success", "error"];
const MAX_EMAIL_SUBJECT_LENGTH = SCHEMA_MAX_LENGTH_SHORT;
const MAX_EMAIL_SENDER_LENGTH = SCHEMA_MAX_LENGTH_SHORT;
const DEFAULT_EMAIL_RESPONSE_TONE: EmailResponseTone = "professional";
const EMAIL_RESPONSE_TONES: readonly EmailResponseTone[] = [
  "professional",
  "friendly",
  "concise",
] as const;
const MIN_SCHEDULE_LEAD_TIME_MS = 1_000;
const MAX_RECOVERABLE_SCHEDULED_RUNS = SCHEMA_MAX_ITEMS_BOARDS;
const RUN_ID_PATTERN = /^[0-9a-f-]+$/i;
const SCHEDULED_ACTION_JOB_APPLY = "job_apply";
const SCHEDULED_ACTION_EMAIL_RESPONSE = "email_response";
const AUTOMATION_SCRAPE_TARGET_VALUES = new Set<AutomationScrapeTarget>(AUTOMATION_SCRAPE_TARGETS);
const automationServiceLogger = createServerLogger("application-automation-service");

type SchedulerTimer = ReturnType<typeof setTimeout>;

const toJsonRecord = (value: object): Record<string, unknown> => {
  const record: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    record[key] = entry;
  }
  return record;
};

const isEmailResponseTone = (value: string): value is EmailResponseTone =>
  EMAIL_RESPONSE_TONES.some((tone) => tone === value);

const asJsonRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value))
    : null;

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
      (error: unknown) => {
        automationServiceLogger.error("[automation] background task failed", error);
      },
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

    const parsed = rpaProgressEventSchema.safeParse(event);
    if (!parsed.success) {
      automationServiceLogger.warn("Invalid progress event shape", {
        params,
        error: parsed.error.flatten(),
      });
      return {
        ...event,
        action: "validation_error",
        status: "error" as const,
      } as RpaRunEvent;
    }
    return parsed.data;
  }

  /**
   * Resolve automation settings from persisted values and apply safe defaults.
   */
  private async loadAutomationSettings(): Promise<AutomationSettings> {
    const settingsQueryResult = await settle(
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

    return Math.min(Math.max(MIN_CONCURRENT_RUNS, configured), AUTOMATION_MAX_CONCURRENT_RUNS);
  }

  /**
   * Resolve AI service for smart selector mapping when enabled.
   */
  private async tryLoadAIService(): Promise<AIService | null> {
    const settingsQueryResult = await settle(
      db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID)).limit(1),
    );
    if (settingsQueryResult.status === "rejected") {
      return null;
    }

    const [row] = settingsQueryResult.value;
    return AIService.fromSettings(row);
  }

  /**
   * Resolve a validated SMTP delivery configuration from persisted settings.
   */
  private async loadEmailTransportConfig(): Promise<EmailTransportRuntimeConfig> {
    const settingsQueryResult = await settle(
      db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID)).limit(1),
    );
    if (settingsQueryResult.status === "rejected") {
      throw new Error(API_ERROR_EMAIL_DELIVERY_SETTINGS_MISSING);
    }

    const [row] = settingsQueryResult.value;
    const parsedTransportSettings = emailTransportSettingsSchema.safeParse(
      row?.emailTransportSettings ?? DEFAULT_EMAIL_TRANSPORT_SETTINGS,
    );

    if (!parsedTransportSettings.success) {
      throw new Error(API_ERROR_EMAIL_DELIVERY_SETTINGS_MISSING);
    }

    const hasPassword = Boolean(row?.emailTransportPassword);
    if (!isEmailTransportConfigured(parsedTransportSettings.data, hasPassword)) {
      throw new Error(API_ERROR_EMAIL_DELIVERY_SETTINGS_MISSING);
    }

    return {
      ...parsedTransportSettings.data,
      password: row?.emailTransportPassword ?? null,
    };
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
    payload: EmailResponseRequest,
  ): EmailResponseExecutionPayload {
    const subject = payload.subject?.trim() ?? "";
    const message = payload.message?.trim() ?? "";
    const sender = payload.sender?.trim();
    const explicitRecipient = payload.recipientEmail?.trim();
    const deliverAfterGeneration = payload.deliverAfterGeneration === true;
    this.validateEmailResponseTextLengths(subject, message, sender);
    const recipientEmail = this.resolveEmailResponseRecipientEmail(
      sender,
      explicitRecipient,
      deliverAfterGeneration,
    );
    const tone = this.normalizeEmailResponseTone(payload.tone);

    return {
      subject,
      message,
      tone,
      deliverAfterGeneration,
      ...(sender ? { sender } : {}),
      ...(recipientEmail ? { recipientEmail } : {}),
    };
  }

  /**
   * Validates normalized email response text fields against persisted limits.
   */
  private validateEmailResponseTextLengths(
    subject: string,
    message: string,
    sender?: string,
  ): void {
    if (subject.length === 0 || subject.length > MAX_EMAIL_SUBJECT_LENGTH) {
      throw new AutomationValidationError(
        `subject is required and must be <= ${MAX_EMAIL_SUBJECT_LENGTH} characters`,
      );
    }

    if (message.length === 0 || message.length > AUTOMATION_MAX_EMAIL_MESSAGE_LENGTH) {
      throw new AutomationValidationError(
        `message is required and must be <= ${AUTOMATION_MAX_EMAIL_MESSAGE_LENGTH} characters`,
      );
    }

    if (sender && sender.length > MAX_EMAIL_SENDER_LENGTH) {
      throw new AutomationValidationError(
        `sender must be <= ${MAX_EMAIL_SENDER_LENGTH} characters`,
      );
    }
  }

  /**
   * Resolves the target recipient from explicit input or an email-like sender field.
   */
  private resolveEmailResponseRecipientEmail(
    sender: string | undefined,
    explicitRecipient: string | undefined,
    deliverAfterGeneration: boolean,
  ): string | undefined {
    if (explicitRecipient && !isValidEmail(explicitRecipient)) {
      throw new AutomationValidationError("recipientEmail must be a valid email address");
    }

    const inferredRecipient = sender && isValidEmail(sender) ? sender : undefined;
    const recipientEmail = explicitRecipient || inferredRecipient;
    if (deliverAfterGeneration && !recipientEmail) {
      throw new AutomationValidationError("recipientEmail is required when delivery is enabled");
    }

    return recipientEmail;
  }

  /**
   * Maps optional tone input to a supported automation email tone.
   */
  private normalizeEmailResponseTone(toneValue: EmailResponseRequest["tone"]): EmailResponseTone {
    const normalizedTone = toneValue?.trim();
    if (normalizedTone && isEmailResponseTone(normalizedTone)) {
      return normalizedTone;
    }

    return DEFAULT_EMAIL_RESPONSE_TONE;
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
    if (leadTimeMs > AUTOMATION_MAX_SCHEDULE_LEAD_TIME_MS) {
      throw new AutomationValidationError("runAt must be within 30 days");
    }

    return parsedRunAt.toISOString();
  }

  /**
   * Resolve the output directory for a single automation run.
   */
  private resolveRunArtifactDir(runId: string): string {
    const safeRunId = this.sanitizeRunId(runId);
    const directory = join(AUTOMATION_SCREENSHOT_DIR, safeRunId);
    mkdirSync(directory, { recursive: true });
    return directory;
  }

  /**
   * Copy screenshots from the automation process into the managed run directory.
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
      sourceScreenshots.map((sourcePath, index) =>
        this.copySingleScreenshot(runDir, index, sourcePath),
      ),
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
    const sourceExists = await sourceFile.exists();
    if (!sourceExists) {
      return null;
    }

    const safeFileName = this.resolveScreenshotName(index, sourcePath);
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
    if (shortName.length <= AUTOMATION_MAX_SCREENSHOT_NAME_LENGTH) {
      return shortName;
    }

    const fallbackHash = this.hashScreenshotSource(sourcePath);
    const base = `${RUN_SCREENSHOT_PREFIX}-${stepToken}-`;
    const maxSuffixLength = Math.max(
      4,
      AUTOMATION_MAX_SCREENSHOT_NAME_LENGTH - base.length - extension.length,
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
    return hash.toString(16).padStart(AUTOMATION_MIN_ID_LENGTH, "0");
  }

  /**
   * Resolve a safe screenshot extension from script output.
   */
  private resolveScreenshotExtension(pathValue: string): string {
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
   * Attach schedule metadata to an automation input payload.
   */
  private withScheduleMetadata(
    input: Record<string, unknown>,
    runAt: string,
  ): Record<string, unknown> {
    return {
      ...input,
      schedule: { runAt },
    };
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
   * Build a persisted input payload for a scheduled job-apply run.
   */
  private buildScheduledJobApplyInput(
    payload: JobApplyExecutionPayload,
    scheduledFor: string,
  ): Record<string, unknown> {
    return this.withScheduleMetadata(this.buildAuditInput(payload, true), scheduledFor);
  }

  /**
   * Build a persisted input payload for an email automation run.
   */
  private buildEmailResponseInput(
    normalized: EmailResponseExecutionPayload,
    options: { includeAction: boolean; scheduledFor?: string },
  ): Record<string, unknown> {
    const baseInput: Record<string, unknown> = {
      subject: normalized.subject,
      message: normalized.message,
      tone: normalized.tone,
      deliverAfterGeneration: normalized.deliverAfterGeneration,
      ...(normalized.sender ? { sender: normalized.sender } : {}),
      ...(normalized.recipientEmail ? { recipientEmail: normalized.recipientEmail } : {}),
      ...(options.includeAction ? { action: SCHEDULED_ACTION_EMAIL_RESPONSE } : {}),
    };

    return options.scheduledFor
      ? this.withScheduleMetadata(baseInput, options.scheduledFor)
      : baseInput;
  }

  /**
   * Rebuild an email payload from persisted automation run input.
   */
  private parseScheduledEmailResponsePayload(
    input: Record<string, unknown> | null,
  ): EmailResponseExecutionPayload | null {
    if (!input) {
      return null;
    }

    const subject = typeof input.subject === "string" ? input.subject.trim() : "";
    const message = typeof input.message === "string" ? input.message.trim() : "";
    if (subject.length === 0 || message.length === 0) {
      return null;
    }

    const toneCandidate = typeof input.tone === "string" ? input.tone.trim() : "";
    const tone = isEmailResponseTone(toneCandidate) ? toneCandidate : DEFAULT_EMAIL_RESPONSE_TONE;

    return {
      subject,
      message,
      tone,
      deliverAfterGeneration: input.deliverAfterGeneration === true,
      ...(typeof input.sender === "string" && input.sender.trim().length > 0
        ? { sender: input.sender.trim() }
        : {}),
      ...(typeof input.recipientEmail === "string" && input.recipientEmail.trim().length > 0
        ? { recipientEmail: input.recipientEmail.trim() }
        : {}),
    };
  }

  /**
   * Map a scrape target to the action string stored in scheduled-run input.
   */
  private resolveScrapeAction(target: AutomationScrapeTarget): string {
    return automationScrapeTargetToAction(target);
  }

  /**
   * Validate and normalize a scheduled scrape target.
   */
  private normalizeScrapeTarget(target: string): AutomationScrapeTarget {
    const normalized = target.trim() as AutomationScrapeTarget;
    if (!AUTOMATION_SCRAPE_TARGET_VALUES.has(normalized)) {
      throw new AutomationValidationError("target must be a supported scrape target");
    }
    return normalized;
  }

  /**
   * Build a persisted input payload for a scheduled scrape run.
   */
  private buildScrapeInput(
    payload: ScrapeExecutionPayload,
    options: { includeAction: boolean; scheduledFor?: string },
  ): Record<string, unknown> {
    const baseInput: Record<string, unknown> = {
      target: payload.target,
      ...(options.includeAction ? { action: this.resolveScrapeAction(payload.target) } : {}),
    };

    return options.scheduledFor
      ? this.withScheduleMetadata(baseInput, options.scheduledFor)
      : baseInput;
  }

  /**
   * Rebuild a scrape payload from persisted automation run input.
   */
  private parseScheduledScrapePayload(
    input: Record<string, unknown> | null,
  ): ScrapeExecutionPayload | null {
    if (!input || typeof input.target !== "string") {
      return null;
    }

    const normalized = input.target.trim();
    if (!AUTOMATION_SCRAPE_TARGET_VALUES.has(normalized as AutomationScrapeTarget)) {
      return null;
    }

    return {
      target: normalized as AutomationScrapeTarget,
    };
  }

  /**
   * Execute the concrete scraper service call for a supported scrape target.
   */
  private executeScrapeTarget(
    target: AutomationScrapeTarget,
  ): Promise<{ scraped: number; upserted: number; errors: string[] }> {
    if (!isAutomationJobScrapeTarget(target)) {
      return scraperService.scrapeStudios();
    }

    return scraperService.scrapeJobsForTarget(target);
  }

  /**
   * Load a single automation run row.
   */
  private async readRunRow(runId: string): Promise<AutomationRunRow | null> {
    const rows = await db
      .select()
      .from(automationRuns)
      .where(eq(automationRuns.id, runId))
      .limit(1);
    return rows[0] ?? null;
  }

  /**
   * Queue a scheduled run in-memory and execute it when due.
   */
  private queueScheduledRun(runId: string, runAt: string): void {
    this.clearScheduledRunTimer(runId);

    const delayMs = Math.max(0, new Date(runAt).getTime() - Date.now());
    const timer = setTimeout(() => {
      this.scheduledRunTimers.delete(runId);
      this.runBackgroundTask(this.executeScheduledRun(runId));
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
    const pendingRowsResult = await settle(
      db
        .select()
        .from(automationRuns)
        .where(eq(automationRuns.status, "pending"))
        .limit(MAX_RECOVERABLE_SCHEDULED_RUNS),
    );

    if (pendingRowsResult.status === "fulfilled") {
      for (const row of pendingRowsResult.value) {
        const metadata = this.parseScheduledRunMetadata(asJsonRecord(row.input));
        if (!metadata) {
          automationServiceLogger.warn(
            `[automation] skipping pending run without schedule metadata: ${row.id}`,
          );
          continue;
        }

        this.queueScheduledRun(row.id, metadata.runAt);
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
    const scheduleInput = this.buildScheduledJobApplyInput(normalized, scheduledFor);

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

    this.queueScheduledRun(runId, scheduledFor);
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
   * Schedule a new email-response run for future execution.
   */
  async createScheduledEmailResponseRun(
    payload: EmailResponseRequest,
    runAt: string,
  ): Promise<{ runId: string; scheduledFor: string }> {
    const normalized = this.normalizeEmailResponsePayload(payload);
    const scheduledFor = this.normalizeScheduledRunAt(runAt);
    const now = new Date().toISOString();
    const runId = generateId();

    await db.insert(automationRuns).values({
      id: runId,
      type: "email",
      status: "pending",
      jobId: null,
      userId: null,
      input: this.buildEmailResponseInput(normalized, {
        includeAction: true,
        scheduledFor,
      }),
      progress: DEFAULT_PROGRESS,
      currentStep: null,
      totalSteps: null,
      exitCode: 0,
      timedOut: false,
      aborted: false,
      executionMs: null,
      startedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    this.queueScheduledRun(runId, scheduledFor);
    broadcastAutomationEvent(
      this.createProgressEvent({
        runId,
        action: SCHEDULED_ACTION_EMAIL_RESPONSE,
        status: "pending",
        message: `Scheduled for ${scheduledFor}`,
      }),
    );

    return { runId, scheduledFor };
  }

  /**
   * Schedule a new scrape run for future execution.
   */
  async createScheduledScrapeRun(
    target: AutomationScrapeTarget,
    runAt: string,
  ): Promise<{ runId: string; scheduledFor: string }> {
    const normalizedTarget = this.normalizeScrapeTarget(target);
    const scheduledFor = this.normalizeScheduledRunAt(runAt);
    const now = new Date().toISOString();
    const runId = generateId();

    await db.insert(automationRuns).values({
      id: runId,
      type: "scrape",
      status: "pending",
      jobId: null,
      userId: null,
      input: this.buildScrapeInput(
        {
          target: normalizedTarget,
        },
        {
          includeAction: true,
          scheduledFor,
        },
      ),
      progress: DEFAULT_PROGRESS,
      currentStep: null,
      totalSteps: null,
      exitCode: 0,
      timedOut: false,
      aborted: false,
      executionMs: null,
      startedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    this.queueScheduledRun(runId, scheduledFor);
    broadcastAutomationEvent(
      this.createProgressEvent({
        runId,
        action: this.resolveScrapeAction(normalizedTarget),
        status: "pending",
        message: `Scheduled for ${scheduledFor}`,
      }),
    );

    return { runId, scheduledFor };
  }

  /**
   * Create a pending scrape run for immediate execution.
   */
  async createScrapeRun(target: AutomationScrapeTarget): Promise<string> {
    const normalizedTarget = this.normalizeScrapeTarget(target);
    const now = new Date().toISOString();
    const runId = generateId();

    await db.insert(automationRuns).values({
      id: runId,
      type: "scrape",
      status: "pending",
      jobId: null,
      userId: null,
      input: this.buildScrapeInput(
        {
          target: normalizedTarget,
        },
        {
          includeAction: false,
        },
      ),
      progress: DEFAULT_PROGRESS,
      currentStep: null,
      totalSteps: null,
      exitCode: 0,
      timedOut: false,
      aborted: false,
      executionMs: null,
      startedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    broadcastAutomationEvent(
      this.createProgressEvent({
        runId,
        action: this.resolveScrapeAction(normalizedTarget),
        status: "pending",
        message: `Queued ${normalizedTarget} scrape`,
      }),
    );

    return runId;
  }

  /**
   * Execute a scrape run immediately and persist the final run outcome.
   */
  async runScrape(target: AutomationScrapeTarget): Promise<string> {
    const normalizedTarget = this.normalizeScrapeTarget(target);
    const runId = await this.createScrapeRun(normalizedTarget);
    await this.executeScrapeRun(runId, normalizedTarget);
    return runId;
  }

  private async loadScrapePortalAuditSnapshot(): Promise<ScrapePortalAuditSnapshot> {
    const providerSettingsResult = await settle(loadJobProviderSettings());
    const portalConfigById = new Map<string, ScrapePortalAuditConfig>();
    const sharedSettingsIssue =
      providerSettingsResult.status === "rejected"
        ? toErrorMessage(providerSettingsResult.reason, "Job provider settings are unavailable.")
        : null;

    if (providerSettingsResult.status === "fulfilled") {
      for (const portal of providerSettingsResult.value.gamingPortals) {
        portalConfigById.set(portal.id, {
          name: portal.name,
          enabled: portal.enabled,
          fallbackUrl: portal.fallbackUrl,
        });
      }
    }

    return {
      portalConfigById,
      sharedSettingsIssue,
    };
  }

  private buildScrapeCapabilityIssues(
    configuredPortal: ScrapePortalAuditConfig | null,
    portalId: string,
    sharedSettingsIssue: string | null,
  ): string[] {
    if (sharedSettingsIssue) {
      return [sharedSettingsIssue];
    }

    if (!configuredPortal) {
      return [`Missing ${portalId} gaming portal configuration.`];
    }

    const issues: string[] = [];
    if (!configuredPortal.enabled) {
      issues.push(`${configuredPortal.name} is disabled in job provider settings.`);
    }
    if (configuredPortal.fallbackUrl.trim().length === 0) {
      issues.push(`${configuredPortal.name} is missing a fallback URL.`);
    }
    return issues;
  }

  private buildJobScrapeCapabilityAuditEntry(
    target: (typeof AUTOMATION_SCRAPE_JOB_TARGETS)[number],
    auditSnapshot: ScrapePortalAuditSnapshot,
  ): RpaCapabilityAuditEntry {
    const portalId = automationScrapeTargetToPortalId(target);
    const configuredPortal = auditSnapshot.portalConfigById.get(portalId) ?? null;
    const issues = this.buildScrapeCapabilityIssues(
      configuredPortal,
      portalId,
      auditSnapshot.sharedSettingsIssue,
    );
    const enabled = configuredPortal?.enabled === true;
    const configured = Boolean(
      configuredPortal?.enabled && configuredPortal.fallbackUrl.trim().length > 0,
    );

    return {
      id: buildRpaCapabilityIdFromScrapeTarget(target),
      category: "scrape",
      name: configuredPortal?.name ?? portalId,
      target,
      implemented: true,
      configured,
      enabled,
      manualRunAvailable: true,
      scheduledRunAvailable: true,
      runHistoryAvailable: true,
      liveUpdatesAvailable: true,
      issues,
    };
  }

  /**
   * Build an up-to-date audit report for the full RPA capability surface.
   */
  async getRpaCapabilityAudit(): Promise<RpaCapabilityAuditReport> {
    const auditSnapshot = await this.loadScrapePortalAuditSnapshot();
    const capabilities: RpaCapabilityAuditEntry[] = [
      createJobApplyCapabilityAuditEntry(),
      createStudioScrapeCapabilityAuditEntry(),
      ...AUTOMATION_SCRAPE_JOB_TARGETS.map((target) =>
        this.buildJobScrapeCapabilityAuditEntry(target, auditSnapshot),
      ),
    ];

    return {
      generatedAt: new Date().toISOString(),
      summary: summarizeRpaCapabilities(capabilities),
      capabilities,
    };
  }

  /**
   * Mark a malformed scheduled run as failed.
   */
  private async failScheduledRunValidation(runId: string, errorMessage: string): Promise<void> {
    const automationSettings = await this.loadAutomationSettings();
    await this.markRunFailed(runId, errorMessage, automationSettings);
    broadcastAutomationEvent(
      this.createProgressEvent({
        runId,
        action: "automation",
        status: "error",
        message: errorMessage,
      }),
    );
  }

  /**
   * Execute a queued scheduled run based on the persisted pending row type.
   */
  private async executeScheduledRun(runId: string): Promise<void> {
    const row = await this.readRunRow(runId);
    if (!row || row.status !== "pending") {
      return;
    }

    if (row.type === "job_apply") {
      await this.executeScheduledJobApplyRun(row);
      return;
    }

    if (row.type === "email") {
      await this.executeScheduledEmailResponseRun(row);
      return;
    }

    if (row.type === "scrape") {
      await this.executeScheduledScrapeRun(row);
      return;
    }
  }

  /**
   * Execute a queued scheduled job-apply run, retrying when concurrency is saturated.
   */
  private async executeScheduledJobApplyRun(row: AutomationRunRow): Promise<void> {
    const input = asJsonRecord(row.input);
    const payload = this.parseScheduledJobApplyPayload(input);
    if (!payload) {
      await this.failScheduledRunValidation(row.id, "Scheduled job-apply payload is invalid");
      return;
    }

    const executionResult = await settle(this.runJobApply(row.id, payload));
    if (executionResult.status === "fulfilled") {
      return;
    }

    if (executionResult.reason instanceof AutomationConcurrencyLimitError) {
      const nextRunAt = new Date(Date.now() + AUTOMATION_SCHEDULE_RETRY_DELAY_MS).toISOString();
      const normalizedPayload = this.normalizePayload(payload);
      await db
        .update(automationRuns)
        .set({
          input: this.buildScheduledJobApplyInput(normalizedPayload, nextRunAt),
          status: "pending",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(automationRuns.id, row.id));

      this.queueScheduledRun(row.id, nextRunAt);
      broadcastAutomationEvent(
        this.createProgressEvent({
          runId: row.id,
          action: SCHEDULED_ACTION_JOB_APPLY,
          status: "pending",
          message: `Concurrency limit reached, retrying at ${nextRunAt}`,
        }),
      );
      return;
    }

    throw executionResult.reason;
  }

  /**
   * Execute a queued scheduled email-response run.
   */
  private async executeScheduledEmailResponseRun(row: AutomationRunRow): Promise<void> {
    const payload = this.parseScheduledEmailResponsePayload(asJsonRecord(row.input));
    if (!payload) {
      await this.failScheduledRunValidation(row.id, "Scheduled email payload is invalid");
      return;
    }

    await this.markEmailResponseRunStarted(row.id, payload);
    await this.executeEmailResponseRun(row.id, payload);
  }

  /**
   * Execute a queued scheduled scrape run.
   */
  private async executeScheduledScrapeRun(row: AutomationRunRow): Promise<void> {
    const payload = this.parseScheduledScrapePayload(asJsonRecord(row.input));
    if (!payload) {
      await this.failScheduledRunValidation(row.id, "Scheduled scrape payload is invalid");
      return;
    }

    await this.executeScrapeRun(row.id, payload.target);
  }

  private async createEmailResponseRun(
    runId: string,
    normalized: EmailResponseExecutionPayload,
    options: { status: "running" | "pending"; scheduledFor?: string } = { status: "running" },
  ): Promise<void> {
    const now = new Date().toISOString();
    const totalSteps = normalized.deliverAfterGeneration ? 2 : 1;
    await db.insert(automationRuns).values({
      id: runId,
      type: "email",
      status: options.status,
      jobId: null,
      userId: null,
      input: this.buildEmailResponseInput(normalized, {
        includeAction: options.status === "pending",
        scheduledFor: options.scheduledFor,
      }),
      progress: DEFAULT_PROGRESS,
      currentStep: options.status === "running" ? 0 : null,
      totalSteps: options.status === "running" ? totalSteps : null,
      exitCode: 0,
      timedOut: false,
      aborted: false,
      executionMs: null,
      startedAt: options.status === "running" ? now : null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Mark a scheduled email-response run as running.
   */
  private async markEmailResponseRunStarted(
    runId: string,
    normalized: EmailResponseExecutionPayload,
  ): Promise<void> {
    const totalSteps = normalized.deliverAfterGeneration ? 2 : 1;
    const startedAt = new Date().toISOString();
    await db
      .update(automationRuns)
      .set({
        status: "running",
        input: this.buildEmailResponseInput(normalized, { includeAction: false }),
        progress: DEFAULT_PROGRESS,
        currentStep: 0,
        totalSteps,
        exitCode: 0,
        timedOut: false,
        aborted: false,
        executionMs: null,
        startedAt,
        completedAt: null,
        updatedAt: startedAt,
      })
      .where(eq(automationRuns.id, runId));
  }

  private async failEmailResponseRun(
    runId: string,
    error: unknown,
    partialResult?: {
      reply: string;
      provider: string;
      model: string;
    },
  ): Promise<never> {
    const message = toErrorMessage(
      error,
      partialResult ? API_ERROR_EMAIL_DELIVERY_FAILED : API_ERROR_GENERATE_EMAIL_RESPONSE,
    );
    const completedAt = new Date().toISOString();
    await db
      .update(automationRuns)
      .set({
        status: "error",
        output: {
          success: false,
          error: message,
          ...(partialResult
            ? {
                reply: partialResult.reply,
                provider: partialResult.provider,
                model: partialResult.model,
                delivered: false,
              }
            : {}),
        },
        error: message,
        progress: AUTOMATION_FINISHED_PROGRESS,
        currentStep: partialResult ? 2 : 1,
        totalSteps: partialResult ? 2 : 1,
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
        step: partialResult ? 2 : 1,
        totalSteps: partialResult ? 2 : 1,
      }),
    );
    throw error instanceof Error ? error : new Error(message);
  }

  private async generateEmailResponse(
    normalized: EmailResponseExecutionPayload,
  ): Promise<{ reply: string; provider: string; model: string }> {
    const aiService = await this.tryLoadAIService();
    if (!aiService) {
      throw new Error(API_ERROR_NO_AI_PROVIDER_EMAIL);
    }
    const aiResultOutcome = await settle(
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
      throw new Error(API_ERROR_EMPTY_EMAIL_RESPONSE);
    }
    return { reply, provider: aiResult.provider, model: aiResult.model };
  }

  /**
   * Persist draft-generation progress before attempting SMTP delivery.
   */
  private async markEmailResponseDraftGenerated(
    runId: string,
    result: { reply: string; provider: string; model: string },
    recipientEmail?: string,
  ): Promise<void> {
    const updatedAt = new Date().toISOString();
    await db
      .update(automationRuns)
      .set({
        output: {
          success: true,
          reply: result.reply,
          provider: result.provider,
          model: result.model,
          delivered: false,
          ...(recipientEmail ? { recipientEmail } : {}),
        },
        progress: Math.round(AUTOMATION_FINISHED_PROGRESS / 2),
        currentStep: 1,
        totalSteps: 2,
        updatedAt,
      })
      .where(eq(automationRuns.id, runId));
    broadcastAutomationEvent(
      this.createProgressEvent({
        runId,
        action: "email_response",
        status: "running",
        message: API_MESSAGE_EMAIL_RESPONSE_GENERATED,
        step: 1,
        totalSteps: 2,
      }),
    );
  }

  /**
   * Deliver a generated reply through the configured SMTP transport.
   */
  private async deliverGeneratedEmail(
    normalized: EmailResponseExecutionPayload,
    reply: string,
  ): Promise<EmailDeliveryDetails> {
    if (!normalized.recipientEmail) {
      throw new Error("recipientEmail is required for email delivery");
    }

    const deliveryConfig = await this.loadEmailTransportConfig();
    const deliveryResult = await emailDeliveryService.send(deliveryConfig, {
      recipientEmail: normalized.recipientEmail,
      subject: normalized.subject,
      body: reply,
    });

    return {
      delivered: true,
      recipientEmail: deliveryResult.recipientEmail,
      deliveredAt: deliveryResult.deliveredAt,
      messageId: deliveryResult.messageId,
    };
  }

  private async completeEmailResponseRun(
    runId: string,
    result: {
      reply: string;
      provider: string;
      model: string;
      delivery: EmailDeliveryDetails;
    },
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
          delivered: result.delivery.delivered,
          ...(result.delivery.recipientEmail
            ? { recipientEmail: result.delivery.recipientEmail }
            : {}),
          ...(result.delivery.deliveredAt ? { deliveredAt: result.delivery.deliveredAt } : {}),
          ...(result.delivery.messageId ? { messageId: result.delivery.messageId } : {}),
        },
        error: null,
        progress: AUTOMATION_FINISHED_PROGRESS,
        currentStep: result.delivery.delivered ? 2 : 1,
        totalSteps: result.delivery.delivered ? 2 : 1,
        completedAt,
        updatedAt: completedAt,
      })
      .where(eq(automationRuns.id, runId));
    broadcastAutomationEvent(
      this.createProgressEvent({
        runId,
        action: "email_response",
        status: "success",
        message: result.delivery.delivered
          ? API_MESSAGE_EMAIL_RESPONSE_DELIVERED
          : API_MESSAGE_EMAIL_RESPONSE_GENERATED,
        step: result.delivery.delivered ? 2 : 1,
        totalSteps: result.delivery.delivered ? 2 : 1,
      }),
    );
  }

  /**
   * Execute the core email automation flow for an existing run row.
   */
  private async executeEmailResponseRun(
    runId: string,
    normalized: EmailResponseExecutionPayload,
  ): Promise<EmailResponseResult> {
    const responseResult = await settle(this.generateEmailResponse(normalized));
    if (responseResult.status === "rejected") {
      return this.failEmailResponseRun(runId, responseResult.reason);
    }

    if (normalized.deliverAfterGeneration) {
      await this.markEmailResponseDraftGenerated(
        runId,
        responseResult.value,
        normalized.recipientEmail,
      );
    }

    const noDelivery: EmailDeliveryDetails = {
      delivered: false,
      ...(normalized.recipientEmail ? { recipientEmail: normalized.recipientEmail } : {}),
    };
    const deliveryResult: PromiseSettledResult<EmailDeliveryDetails> =
      normalized.deliverAfterGeneration
        ? await settle(this.deliverGeneratedEmail(normalized, responseResult.value.reply))
        : {
            status: "fulfilled",
            value: noDelivery,
          };

    if (deliveryResult.status === "rejected") {
      return this.failEmailResponseRun(runId, deliveryResult.reason, responseResult.value);
    }

    await this.completeEmailResponseRun(runId, {
      ...responseResult.value,
      delivery: deliveryResult.value,
    });
    return {
      runId,
      status: "success",
      ...responseResult.value,
      delivered: deliveryResult.value.delivered,
      ...(deliveryResult.value.recipientEmail
        ? { recipientEmail: deliveryResult.value.recipientEmail }
        : {}),
      ...(deliveryResult.value.deliveredAt
        ? { deliveredAt: deliveryResult.value.deliveredAt }
        : {}),
      ...(deliveryResult.value.messageId ? { messageId: deliveryResult.value.messageId } : {}),
    };
  }

  /**
   * Run an AI-assisted email response and persist output as an automation run.
   */
  async runEmailResponse(payload: EmailResponseRequest): Promise<EmailResponseResult> {
    const normalized = this.normalizeEmailResponsePayload(payload);
    const runId = generateId();
    await this.createEmailResponseRun(runId, normalized);
    return this.executeEmailResponseRun(runId, normalized);
  }

  /**
   * Mark a scrape run as running.
   */
  private async markScrapeRunStarted(runId: string, target: AutomationScrapeTarget): Promise<void> {
    const now = new Date().toISOString();
    await db
      .update(automationRuns)
      .set({
        status: "running",
        input: this.buildScrapeInput({ target }, { includeAction: false }),
        progress: DEFAULT_PROGRESS,
        currentStep: 0,
        totalSteps: 1,
        exitCode: 0,
        timedOut: false,
        aborted: false,
        executionMs: null,
        startedAt: now,
        completedAt: null,
        updatedAt: now,
      })
      .where(eq(automationRuns.id, runId));

    broadcastAutomationEvent(
      this.createProgressEvent({
        runId,
        action: this.resolveScrapeAction(target),
        status: "running",
        message: `Running ${target} scrape`,
        step: 0,
        totalSteps: 1,
      }),
    );
  }

  /**
   * Persist a failed scrape run.
   */
  private async failScrapeRun(
    runId: string,
    target: AutomationScrapeTarget,
    reason: unknown,
    executionMs: number,
  ): Promise<void> {
    const automationSettings = await this.loadAutomationSettings();
    const errorMessage = toErrorMessage(
      reason,
      target === "studios" ? API_ERROR_SCRAPE_STUDIOS_FAILED : API_ERROR_SCRAPE_JOBS_FAILED,
    );
    await this.markRunFailed(runId, errorMessage, automationSettings, {
      exitCode: 1,
      timedOut: false,
      aborted: false,
      executionMs,
      errorEnvelope: null,
    });
    broadcastAutomationEvent(
      this.createProgressEvent({
        runId,
        action: this.resolveScrapeAction(target),
        status: "error",
        message: errorMessage,
        step: 1,
        totalSteps: 1,
      }),
    );
  }

  /**
   * Persist a successful scrape run.
   */
  private async completeScrapeRun(
    runId: string,
    target: AutomationScrapeTarget,
    result: { scraped: number; upserted: number; errors: string[] },
    executionMs: number,
  ): Promise<void> {
    const completedAt = new Date().toISOString();
    const output = {
      target,
      scraped: result.scraped,
      upserted: result.upserted,
      errors: result.errors,
    } satisfies Record<string, unknown>;

    await db
      .update(automationRuns)
      .set({
        status: "success",
        output,
        error: null,
        progress: AUTOMATION_FINISHED_PROGRESS,
        currentStep: 1,
        totalSteps: 1,
        exitCode: 0,
        timedOut: false,
        aborted: false,
        executionMs,
        completedAt,
        updatedAt: completedAt,
      })
      .where(eq(automationRuns.id, runId));

    broadcastAutomationEvent(
      this.createProgressEvent({
        runId,
        action: this.resolveScrapeAction(target),
        status: "success",
        message: `${target} scrape completed (${result.scraped} scraped, ${result.upserted} upserted)`,
        step: 1,
        totalSteps: 1,
      }),
    );
  }

  /**
   * Execute a scrape target and persist the run result.
   */
  private async executeScrapeRun(runId: string, target: AutomationScrapeTarget): Promise<void> {
    const startedAt = Date.now();
    await this.markScrapeRunStarted(runId, target);
    const scrapeResult = await settle(this.executeScrapeTarget(target));
    if (scrapeResult.status === "rejected") {
      await this.failScrapeRun(runId, target, scrapeResult.reason, Date.now() - startedAt);
      return;
    }

    await this.completeScrapeRun(runId, target, scrapeResult.value, Date.now() - startedAt);
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
            Math.round(
              (updates.currentStep / (updates.totalSteps || 1)) * AUTOMATION_FINISHED_PROGRESS,
            ),
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
  ): Promise<ResumeData> {
    const resume = await resumeService.getResume(resumeId);
    if (!resume) {
      const error = new AutomationDependencyMissingError("resume", resumeId);
      await this.markRunFailed(runId, error.message, automationSettings);
      throw error;
    }
    return resume;
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

  private collectResumeHeaderLines(resume: ResumeData): string[] {
    const lines: string[] = [];
    const personalInfo = resume.personalInfo;

    if (resume.name) {
      lines.push(resume.name);
    }
    if (personalInfo?.name && personalInfo.name !== resume.name) {
      lines.push(personalInfo.name);
    }

    const contactLines = [
      personalInfo?.email,
      personalInfo?.phone,
      personalInfo?.location,
      personalInfo?.website,
      personalInfo?.linkedIn,
      personalInfo?.github,
      personalInfo?.portfolio,
    ].filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
    if (contactLines.length > 0) {
      lines.push(contactLines.join(" | "));
    }

    return lines;
  }

  private appendSection(lines: string[], title: string, entries: string[]): void {
    if (entries.length === 0) {
      return;
    }

    lines.push("", title, ...entries);
  }

  private collectResumeExperienceLines(resume: ResumeData): string[] {
    const lines: string[] = [];

    for (const experience of resume.experience ?? []) {
      const headerParts = [experience.title, experience.company].filter(
        (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
      );
      if (headerParts.length > 0) {
        lines.push(headerParts.join(" - "));
      }
      if (experience.description?.trim()) {
        lines.push(experience.description.trim());
      }
      for (const achievement of experience.achievements ?? []) {
        if (achievement.trim().length > 0) {
          lines.push(`- ${achievement.trim()}`);
        }
      }
    }

    return lines;
  }

  private collectResumeEducationLines(resume: ResumeData): string[] {
    const lines: string[] = [];

    for (const education of resume.education ?? []) {
      const headerParts = [education.degree, education.field, education.school].filter(
        (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
      );
      if (headerParts.length > 0) {
        lines.push(headerParts.join(" - "));
      }
    }

    return lines;
  }

  private collectResumeSkillSections(
    resume: ResumeData,
  ): Array<{ title: string; lines: string[] }> {
    const skillSections = [
      ["Technical Skills", resume.skills?.technical],
      ["Soft Skills", resume.skills?.soft],
      ["Gaming Skills", resume.skills?.gaming],
    ] as const;

    return skillSections.reduce<Array<{ title: string; lines: string[] }>>(
      (sections, [title, values]) => {
        if (Array.isArray(values) && values.length > 0) {
          sections.push({ title, lines: [values.join(", ")] });
        }
        return sections;
      },
      [],
    );
  }

  private serializeResumeUploadFallback(resume: ResumeData): string {
    const lines = this.collectResumeHeaderLines(resume);
    this.appendSection(lines, "Summary", resume.summary?.trim() ? [resume.summary.trim()] : []);
    this.appendSection(lines, "Experience", this.collectResumeExperienceLines(resume));
    this.appendSection(lines, "Education", this.collectResumeEducationLines(resume));
    for (const section of this.collectResumeSkillSections(resume)) {
      this.appendSection(lines, section.title, section.lines);
    }
    return lines.join("\n").trim();
  }

  private async createResumeUploadArtifact(
    runArtifactDir: string,
    resume: ResumeData,
  ): Promise<string | undefined> {
    const pdfResult = await settle(exportService.exportResumePDF(resume, resume.template));
    if (pdfResult.status === "fulfilled") {
      const pdfPath = join(runArtifactDir, "resume.pdf");
      const writePdfResult = await settle(Bun.write(pdfPath, pdfResult.value));
      if (writePdfResult.status === "fulfilled") {
        return pdfPath;
      }
    }

    const fallbackResumePath = join(runArtifactDir, "resume.txt");
    const fallbackResume = this.serializeResumeUploadFallback(resume);
    const writeFallbackResult = await settle(Bun.write(fallbackResumePath, fallbackResume));
    if (writeFallbackResult.status === "fulfilled") {
      return fallbackResumePath;
    }

    return;
  }

  private normalizeGeneratedFieldAnswers(
    fieldAnswers: Record<string, string>,
  ): Record<string, string> {
    const reservedFieldKeys = new Set<string>(SMART_FIELD_CORE_KEYS);
    const normalizedAnswers: Record<string, string> = {};

    for (const [key, value] of Object.entries(fieldAnswers)) {
      const normalizedKey = key.trim();
      const normalizedValue = value.trim();
      if (
        normalizedKey.length === 0 ||
        normalizedValue.length === 0 ||
        reservedFieldKeys.has(normalizedKey)
      ) {
        continue;
      }

      normalizedAnswers[normalizedKey] = normalizedValue;
    }

    return normalizedAnswers;
  }

  private createEmptyAutofillAnalysis(): SmartFieldAnalysisResult {
    return {
      selectorMap: {},
      fieldAnswers: {},
    };
  }

  private buildSmartFieldAnalysisContext(
    options: Pick<AutofillAnalysisOptions, "resume" | "coverLetter" | "existingAnswers">,
  ): SmartFieldAnalysisContext {
    return {
      resume: toJsonRecord(options.resume),
      coverLetter: options.coverLetter ? { content: options.coverLetter.content || {} } : null,
      existingAnswers: options.existingAnswers,
    };
  }

  private async resolveAutofillAnalysis(
    options: AutofillAnalysisOptions,
  ): Promise<SmartFieldAnalysisResult> {
    if (!options.automationSettings.enableSmartSelectors) {
      automationServiceLogger.debug("Smart field mapping skipped: enableSmartSelectors is off");
      return this.createEmptyAutofillAnalysis();
    }

    const aiService = await this.tryLoadAIService();
    if (!aiService) {
      automationServiceLogger.debug("Smart field mapping skipped: AI service unavailable");
      return this.createEmptyAutofillAnalysis();
    }

    const result = await smartFieldMapper.analyze(
      options.jobUrl,
      [...SMART_FIELD_CORE_KEYS],
      this.buildSmartFieldAnalysisContext(options),
      aiService,
    );
    const isEmpty =
      Object.keys(result.selectorMap).length === 0 && Object.keys(result.fieldAnswers).length === 0;
    if (isEmpty) {
      automationServiceLogger.debug("Smart field mapping returned empty result", {
        jobUrl: options.jobUrl,
      });
    }
    return result;
  }

  private createProgressHandler(
    onProgress?: (event: RpaRunEvent) => void,
  ): (event: RpaRunEvent) => void {
    return (event: RpaRunEvent): void => {
      if (event.eventType !== "progress") {
        return;
      }

      const normalizedEvent = {
        ...event,
        sequence: this.nextRunEventSequence(event.runId),
        timestamp: new Date().toISOString(),
      } satisfies RpaRunEvent;

      this.runBackgroundTask(this.persistProgress(normalizedEvent));
      broadcastAutomationEvent(normalizedEvent);
      onProgress?.(normalizedEvent);
    };
  }

  private async markRunStarted(runId: string): Promise<void> {
    const startedAt = new Date().toISOString();
    await db
      .update(automationRuns)
      .set({
        startedAt,
        status: "running",
        progress: DEFAULT_PROGRESS,
        exitCode: null,
        timedOut: false,
        aborted: false,
        executionMs: null,
        completedAt: null,
        updatedAt: startedAt,
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
      throw new Error(normalizedResult.error || API_ERROR_JOB_APPLICATION_AUTOMATION_FAILED);
    }

    broadcastAutomationEvent(
      this.createProgressEvent({
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
    const message = toErrorMessage(reason, API_ERROR_JOB_APPLICATION_AUTOMATION_FAILED);
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
    const runArtifactDir = this.resolveRunArtifactDir(runId);
    const resumeFilePath = await this.createResumeUploadArtifact(runArtifactDir, resume);
    const autofillAnalysis = await this.resolveAutofillAnalysis({
      automationSettings,
      jobUrl: normalized.jobUrl,
      resume,
      coverLetter,
      existingAnswers: normalized.customAnswers,
    });
    const selectorMap = autofillAnalysis.selectorMap;
    const generatedFieldAnswers = this.normalizeGeneratedFieldAnswers(
      autofillAnalysis.fieldAnswers,
    );
    const progressHandler = this.createProgressHandler(onProgress);

    return {
      runId,
      automationSettings,
      normalized: {
        ...normalized,
        customAnswers: {
          ...generatedFieldAnswers,
          ...normalized.customAnswers,
        },
      },
      resume,
      coverLetter,
      selectorMap,
      resumeFilePath,
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
    const executionResult = await settle(this.executeJobApplyRun(preparation, tracking));
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
    if (!RUN_ID_PATTERN.test(safeId) || safeId.length < AUTOMATION_MIN_ID_LENGTH) {
      throw new Error(API_ERROR_RUN_ID_INVALID);
    }
    return safeId;
  }

  private toFiniteNumber(value: unknown): number {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : Number.NaN;
    }
    if (typeof value === "string") {
      const parsed = Number.parseInt(value.trim(), DECIMAL_RADIX);
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

function sanitizeStep(step: {
  action?: unknown;
  status?: unknown;
  message?: unknown;
}): { action: string; status: "ok" | "error"; message?: string } | null {
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
