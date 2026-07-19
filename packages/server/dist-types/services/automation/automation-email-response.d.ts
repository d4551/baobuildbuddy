import type { EmailExecutionResult, EmailResponseRuntime } from "./automation-email-response-contracts";
import type { EmailResponseExecutionPayload } from "./automation-run-inputs";
export declare const createEmailResponseRun: (runId: string, normalized: EmailResponseExecutionPayload, options?: {
    status: "running" | "pending";
    scheduledFor?: string;
}) => Promise<void>;
export declare const markEmailResponseRunStarted: (runId: string, normalized: EmailResponseExecutionPayload) => Promise<void>;
export declare const executeEmailResponseRun: (runId: string, normalized: EmailResponseExecutionPayload, runtime: EmailResponseRuntime) => Promise<EmailExecutionResult>;
