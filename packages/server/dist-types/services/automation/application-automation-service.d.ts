interface JobApplyPayload {
    jobUrl: string;
    resumeId: string;
    coverLetterId?: string;
    jobId?: string;
    customAnswers?: Record<string, string>;
}
type EmailResponseTone = "professional" | "friendly" | "concise";
interface EmailResponsePayload {
    subject: string;
    message: string;
    sender?: string;
    tone?: EmailResponseTone;
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
    private schedulerRecoveryInFlight;
    constructor();
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
     * Normalize a scheduled run datetime with strict bounds.
     */
    private normalizeScheduledRunAt;
    /**
     * Resolve the output directory for a single automation run.
     */
    private resolveRunArtifactDir;
    /**
     * Copy screenshots from the Python process into the managed run directory.
     */
    private copyAndIndexScreenshots;
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
    /**
     * Run an AI-assisted email response and persist output as an automation run.
     */
    runEmailResponse(payload: EmailResponsePayload): Promise<{
        runId: string;
        status: "success";
        reply: string;
        provider: string;
        model: string;
    }>;
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
    /**
     * Run full job-application automation for an existing run.
     */
    runJobApply(runId: string, payload: JobApplyPayload, onProgress?: (data: AutomationProgress) => void): Promise<void>;
    private sanitizeRunId;
    private toFiniteNumber;
}
export declare const applicationAutomationService: ApplicationAutomationService;
export {};
