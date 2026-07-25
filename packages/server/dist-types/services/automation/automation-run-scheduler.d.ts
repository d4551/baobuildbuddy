export declare const ORPHANED_RUNNING_RUN_RECLAIMED_MESSAGE = "Orphaned running run reclaimed on startup";
export declare const PENDING_RUN_MISSING_SCHEDULE_METADATA_MESSAGE = "Pending automation run missing schedule metadata";
export declare class AutomationRunScheduler {
    private readonly executeScheduledRun;
    private readonly scheduledRunTimers;
    private recoveryInFlight;
    constructor(executeScheduledRun: (runId: string) => Promise<void>);
    queue(runId: string, runAt: string): void;
    clear(runId: string): void;
    reclaimRunningRuns(): Promise<void>;
    restorePendingRuns(limit: number): Promise<void>;
    private markPendingRunWithoutScheduleMetadata;
}
