import { type JobApplyPayload } from "./automation-run-inputs";
import type { AutomationRunRow, CreateProgressEvent } from "./automation-service-contracts";
type ScheduledRunQueue = (runId: string, runAt: string) => void;
type ReadRunRow = (runId: string) => Promise<AutomationRunRow | null>;
type RunJobApply = (runId: string, payload: JobApplyPayload) => Promise<void>;
interface AutomationScheduledRunExecutorOptions {
    createProgressEvent: CreateProgressEvent;
    queueScheduledRun: ScheduledRunQueue;
    readRunRow: ReadRunRow;
    runJobApply: RunJobApply;
}
export declare class AutomationScheduledRunExecutor {
    private readonly options;
    constructor(options: AutomationScheduledRunExecutorOptions);
    execute(runId: string): Promise<void>;
    private failValidation;
    private executeJobApply;
    private requeueJobApplyRun;
    private executeEmail;
    private executeScrape;
}
export {};
