import type { RpaRunEvent } from "@bao/shared/schemas/rpa-events.schema";
import type { JobApplyExecutionPayload, JobApplyPayload } from "./automation-run-inputs";
import type { JobApplyRunPreparation } from "./automation-service-contracts";
export declare const normalizeJobApplyPayload: (payload: JobApplyPayload) => JobApplyExecutionPayload;
export declare const assertJobApplyDependencies: (payload: JobApplyExecutionPayload) => Promise<void>;
export declare const prepareJobApplyRun: (params: {
    runId: string;
    payload: JobApplyPayload;
    progressHandler: (event: RpaRunEvent) => void;
    clearScheduledRunTimer: (runId: string) => void;
    invalidRunIdMessage: string;
}) => Promise<JobApplyRunPreparation>;
