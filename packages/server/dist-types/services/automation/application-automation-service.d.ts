import type { EmailResponseRequest, EmailResponseResult, RpaRunEvent } from "@bao/shared";
interface JobApplyPayload {
    jobUrl: string;
    resumeId: string;
    coverLetterId?: string;
    jobId?: string;
    customAnswers?: Record<string, string>;
}
/**
 * Run-level error indicating the configured concurrency limit was exceeded.
 */
export declare class AutomationConcurrencyLimitError extends Error {
    readonly runningRuns: number;
    readonly maxConcurrentRuns: number;
    constructor(runningRuns: number, maxConcurrentRuns: number);
}
/**
 * Run-level error indicating a linked resource is missing.
 */
export declare class AutomationDependencyMissingError extends Error {
    readonly resource: "resume" | "coverLetter";
    readonly resourceId: string;
    constructor(resource: "resume" | "coverLetter", resourceId: string);
}
/**
 * Run-level error for malformed input payloads.
 */
export declare class AutomationValidationError extends Error {
}
/**
 * Run-level error when a run record cannot be resolved.
 */
export declare class AutomationRunNotFoundError extends Error {
    constructor(runId: string);
}
/**
 * Contract-driven job application automation workflow service.
 */
export declare class ApplicationAutomationService {
    private readonly scheduledRunTimers;
    private readonly runEventSequences;
    private schedulerRecoveryInFlight;
    constructor();
    /**
     * Execute a background task while consuming rejections.
     */
    private runBackgroundTask;
    /**
     * Returns the next monotonic event sequence for a run.
     */
    private nextRunEventSequence;
    /**
     * Builds a protocol-compliant progress event for websocket broadcasting.
     */
    private createProgressEvent;
    /**
     * Resolve automation settings from persisted values and apply safe defaults.
     */
    private loadAutomationSettings;
    /**
     * Clamp configured max-concurrency to safe runtime bounds.
     */
    private resolveMaxConcurrentRuns;
    /**
     * Resolve AI service for smart selector mapping when enabled.
     */
    private tryLoadAIService;
    /**
     * Resolve a validated SMTP delivery configuration from persisted settings.
     */
    private loadEmailTransportConfig;
    /**
     * Normalize and validate the inbound execution payload.
     */
    private normalizePayload;
    /**
     * Validate linked resume/cover letter entities before run creation.
     */
    private assertJobApplyDependencies;
    /**
     * Normalize and validate an email-response automation payload.
     */
    private normalizeEmailResponsePayload;
    /**
     * Validates normalized email response text fields against persisted limits.
     */
    private validateEmailResponseTextLengths;
    /**
     * Resolves the target recipient from explicit input or an email-like sender field.
     */
    private resolveEmailResponseRecipientEmail;
    /**
     * Maps optional tone input to a supported automation email tone.
     */
    private normalizeEmailResponseTone;
    /**
     * Normalize a scheduled run datetime with strict bounds.
     */
    private normalizeScheduledRunAt;
    /**
     * Resolve the output directory for a single automation run.
     */
    private resolveRunArtifactDir;
    /**
     * Copy screenshots from the automation process into the managed run directory.
     */
    private copyAndIndexScreenshots;
    private copySingleScreenshot;
    /**
     * Normalizes runner execution output into persisted run-result contract.
     */
    private normalizeExecutionResult;
    /**
     * Build safe, deterministic screenshot names from script output paths.
     */
    private resolveScreenshotName;
    /**
     * Deterministic fallback hash for screenshot naming.
     */
    private hashScreenshotSource;
    /**
     * Resolve a safe screenshot extension from script output.
     */
    private resolveScreenshotExtension;
    /**
     * Normalize a run payload for DB persistence.
     */
    private buildAuditInput;
    /**
     * Create a new run row after validating dependencies and concurrency limits.
     */
    createJobApplyRun(payload: JobApplyPayload, options?: {
        includeActionInPayload?: boolean;
    }): Promise<string>;
    /**
     * Parse schedule metadata from persisted run input.
     */
    private parseScheduledRunMetadata;
    /**
     * Parse custom-answers payload from persisted JSON.
     */
    private parseCustomAnswers;
    /**
     * Rebuild a job-apply payload from persisted automation run input.
     */
    private parseScheduledJobApplyPayload;
    /**
     * Queue a scheduled run in-memory and execute it when due.
     */
    private queueScheduledRun;
    /**
     * Clear a queued scheduled run timer.
     */
    private clearScheduledRunTimer;
    /**
     * Load pending scheduled runs after process start and queue any future executions.
     */
    private restoreScheduledRuns;
    /**
     * Schedule a new job-apply run for future execution.
     */
    createScheduledJobApplyRun(payload: JobApplyPayload, runAt: string): Promise<{
        runId: string;
        scheduledFor: string;
    }>;
    /**
     * Execute a queued scheduled run, retrying when concurrency is saturated.
     */
    private executeScheduledRun;
    private createEmailResponseRun;
    private failEmailResponseRun;
    private generateEmailResponse;
    /**
     * Persist draft-generation progress before attempting SMTP delivery.
     */
    private markEmailResponseDraftGenerated;
    /**
     * Deliver a generated reply through the configured SMTP transport.
     */
    private deliverGeneratedEmail;
    private completeEmailResponseRun;
    /**
     * Run an AI-assisted email response and persist output as an automation run.
     */
    runEmailResponse(payload: EmailResponseRequest): Promise<EmailResponseResult>;
    /**
     * Update run progress metrics from script progress events.
     */
    private persistProgress;
    /**
     * Delete screenshot artifacts for completed runs older than retention window.
     */
    private purgeExpiredAutomationScreenshots;
    /**
     * Persist a deterministic error result and completion timestamp.
     */
    private markRunFailed;
    /**
     * Persist run completion output and award deterministic metadata.
     */
    private markRunCompleted;
    private assertRunExists;
    private assertConcurrencyLimit;
    private loadResumeOrFail;
    private loadCoverLetterOrFail;
    private collectResumeHeaderLines;
    private appendSection;
    private collectResumeExperienceLines;
    private collectResumeEducationLines;
    private collectResumeSkillSections;
    private serializeResumeUploadFallback;
    private createResumeUploadArtifact;
    private normalizeGeneratedFieldAnswers;
    private createEmptyAutofillAnalysis;
    private buildSmartFieldAnalysisContext;
    private resolveAutofillAnalysis;
    private createProgressHandler;
    private markRunStarted;
    private createExecutionTracking;
    private runJobApplyScript;
    private finalizeJobApplySuccess;
    private executeJobApplyRun;
    private handleExecutionFailure;
    private prepareJobApplyRun;
    /**
     * Run full job-application automation for an existing run.
     */
    runJobApply(runId: string, payload: JobApplyPayload, onProgress?: (event: RpaRunEvent) => void): Promise<void>;
    private sanitizeRunId;
    private toFiniteNumber;
}
export declare const applicationAutomationService: ApplicationAutomationService;
export {};
