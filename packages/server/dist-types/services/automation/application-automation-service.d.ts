interface JobApplyPayload {
    jobUrl: string;
    resumeId: string;
    coverLetterId?: string;
    jobId?: string;
    customAnswers?: Record<string, string>;
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
    /**
     * Resolve automation settings from persisted values and apply safe defaults.
     */
    private loadAutomationSettings;
    /**
     * Resolve AI service for smart selector mapping when enabled.
     */
    private tryLoadAIService;
    /**
     * Normalize and validate the inbound execution payload.
     */
    private normalizePayload;
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
