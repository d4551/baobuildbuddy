import type { AutomationScrapeTarget, EmailResponseRequest } from "@bao/shared";
import { type JobApplyPayload } from "./automation-run-inputs";
import type { CreateProgressEvent } from "./automation-service-contracts";
type ScheduledRunQueue = (runId: string, runAt: string) => void;
interface AutomationRunCreatorOptions {
    createProgressEvent: CreateProgressEvent;
    queueScheduledRun: ScheduledRunQueue;
}
export declare class AutomationRunCreator {
    private readonly options;
    static readonly maxRecoverableScheduledRuns = 500;
    constructor(options: AutomationRunCreatorOptions);
    createJobApplyRun(payload: JobApplyPayload, runOptions?: {
        includeActionInPayload?: boolean;
    }): Promise<string>;
    createScheduledJobApplyRun(payload: JobApplyPayload, runAt: string): Promise<{
        runId: string;
        scheduledFor: string;
    }>;
    createScheduledEmailResponseRun(payload: EmailResponseRequest, runAt: string): Promise<{
        runId: string;
        scheduledFor: string;
    }>;
    createScheduledScrapeRun(target: AutomationScrapeTarget, runAt: string): Promise<{
        runId: string;
        scheduledFor: string;
    }>;
    createScrapeRun(target: AutomationScrapeTarget): Promise<string>;
}
export {};
