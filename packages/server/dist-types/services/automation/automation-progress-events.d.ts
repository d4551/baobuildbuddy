import { type RpaRunEvent } from "@bao/shared/schemas/rpa-events.schema";
import type { ProgressEventParams } from "./automation-service-contracts";
export declare class AutomationProgressEvents {
    private readonly runEventSequences;
    private nextRunEventSequence;
    createProgressEvent(params: ProgressEventParams): RpaRunEvent;
    createProgressHandler(onProgress?: (event: RpaRunEvent) => void): (event: RpaRunEvent) => void;
}
