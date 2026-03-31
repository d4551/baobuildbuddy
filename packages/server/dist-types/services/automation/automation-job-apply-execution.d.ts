import type { AutomationSettings } from "@bao/shared/types/settings-contracts";
import type { CreateProgressEvent, JobApplyExecutionTracking, JobApplyRunPreparation } from "./automation-service-contracts";
export declare const createExecutionTracking: () => JobApplyExecutionTracking;
export declare const markJobApplyRunStarted: (runId: string) => Promise<void>;
export declare const executePreparedJobApplyRun: (preparation: JobApplyRunPreparation, tracking: JobApplyExecutionTracking, createProgressEvent: CreateProgressEvent) => Promise<void>;
export declare const handleJobApplyExecutionFailure: (params: {
    runId: string;
    automationSettings: AutomationSettings;
    tracking: JobApplyExecutionTracking;
    reason: unknown;
    createProgressEvent: CreateProgressEvent;
}) => Promise<never>;
