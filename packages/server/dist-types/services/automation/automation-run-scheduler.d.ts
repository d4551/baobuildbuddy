export declare class AutomationRunScheduler {
    private readonly executeScheduledRun;
    private readonly scheduledRunTimers;
    private recoveryInFlight;
    constructor(executeScheduledRun: (runId: string) => Promise<void>);
    queue(runId: string, runAt: string): void;
    clear(runId: string): void;
    restorePendingRuns(limit: number): Promise<void>;
}
