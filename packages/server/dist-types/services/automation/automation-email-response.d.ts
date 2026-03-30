import type { EmailResponseResult } from "@bao/shared";
import { type EmailTransportRuntimeConfig } from "../email-delivery-service";
import type { AIService } from "../ai/ai-service";
import type { EmailResponseExecutionPayload } from "./automation-run-inputs";
import type { BroadcastProgressEvent, CreateProgressEvent } from "./automation-service-contracts";
interface EmailResponseRuntime {
    loadAIService: () => Promise<AIService | null>;
    loadEmailTransportConfig: () => Promise<EmailTransportRuntimeConfig>;
    createProgressEvent: CreateProgressEvent;
    broadcastProgressEvent: BroadcastProgressEvent;
}
export declare const createEmailResponseRun: (runId: string, normalized: EmailResponseExecutionPayload, options?: {
    status: "running" | "pending";
    scheduledFor?: string;
}) => Promise<void>;
export declare const markEmailResponseRunStarted: (runId: string, normalized: EmailResponseExecutionPayload) => Promise<void>;
export declare const executeEmailResponseRun: (runId: string, normalized: EmailResponseExecutionPayload, runtime: EmailResponseRuntime) => Promise<EmailResponseResult>;
export {};
