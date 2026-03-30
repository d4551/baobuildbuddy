import type { EmailDeliveryResult, EmailGenerationResult, EmailResponseRuntime } from "./automation-email-response-contracts";
export declare const failEmailResponseRun: (runId: string, error: unknown, runtime: Pick<EmailResponseRuntime, "broadcastProgressEvent" | "createProgressEvent">, partialResult?: EmailGenerationResult) => Promise<never>;
export declare const markEmailResponseDraftGenerated: (runId: string, result: EmailGenerationResult, runtime: Pick<EmailResponseRuntime, "broadcastProgressEvent" | "createProgressEvent">, recipientEmail?: string) => Promise<void>;
export declare const completeEmailResponseRun: (runId: string, result: {
    reply: string;
    provider: string;
    model: string;
    delivery: EmailDeliveryResult;
}, runtime: Pick<EmailResponseRuntime, "broadcastProgressEvent" | "createProgressEvent">) => Promise<void>;
