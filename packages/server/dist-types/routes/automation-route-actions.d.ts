import type { EmailResponseRequest } from "@bao/shared/schemas/automation-email.schema";
import type { JobApplyRequestBody, RunScrapeRequestBody, ScheduleEmailResponseRequestBody, ScheduleJobApplyRequestBody, ScheduleScrapeRequestBody } from "./automation-route-contracts";
interface RouteSetState {
    status?: number | string;
}
export declare const handleVerifyAutomationContext: (set: RouteSetState) => Promise<{
    error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
} | {
    resumeId: string;
}>;
export declare const handleJobApplyRoute: (payload: JobApplyRequestBody, set: RouteSetState) => Promise<{
    id: string;
    type: "email" | "job_apply" | "scrape";
    status: "error" | "pending" | "running" | "success";
    jobId: string | null;
    userId: string | null;
    input: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | null;
    output: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | {
        success: boolean;
        error: string | null;
        screenshots: string[];
        artifacts: {
            id: string;
            kind: "document" | "log" | "screenshot" | "trace";
            path: string;
            label?: string | undefined;
            mimeType?: string | undefined;
        }[];
        steps: {
            action: string;
            status: "error" | "ok";
            message?: string | undefined;
        }[];
    } | null;
    screenshots: string[] | null;
    error: string | {
        code: "AUTOMATION_CANCELLED" | "AUTOMATION_RUNTIME_ERROR" | "AUTOMATION_TIMEOUT" | "NETWORK_ERROR" | "OUTPUT_PERSISTENCE_ERROR" | "OUTPUT_VALIDATION_ERROR" | "SCRIPT_OUTPUT_INVALID" | "SCRIPT_PROTOCOL_ERROR" | "UNKNOWN_ERROR";
        message: string;
        details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
        source: string;
    } | null;
    progress: number | null;
    currentStep: number | null;
    totalSteps: number | null;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    exitCode: number | null;
    timedOut: boolean;
    aborted: boolean;
    executionMs: number | null;
} | {
    error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
}>;
export declare const handleScheduledJobApplyRoute: (payload: ScheduleJobApplyRequestBody, set: RouteSetState) => Promise<{
    id: string;
    type: "email" | "job_apply" | "scrape";
    status: "error" | "pending" | "running" | "success";
    jobId: string | null;
    userId: string | null;
    input: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | null;
    output: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | {
        success: boolean;
        error: string | null;
        screenshots: string[];
        artifacts: {
            id: string;
            kind: "document" | "log" | "screenshot" | "trace";
            path: string;
            label?: string | undefined;
            mimeType?: string | undefined;
        }[];
        steps: {
            action: string;
            status: "error" | "ok";
            message?: string | undefined;
        }[];
    } | null;
    screenshots: string[] | null;
    error: string | {
        code: "AUTOMATION_CANCELLED" | "AUTOMATION_RUNTIME_ERROR" | "AUTOMATION_TIMEOUT" | "NETWORK_ERROR" | "OUTPUT_PERSISTENCE_ERROR" | "OUTPUT_VALIDATION_ERROR" | "SCRIPT_OUTPUT_INVALID" | "SCRIPT_PROTOCOL_ERROR" | "UNKNOWN_ERROR";
        message: string;
        details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
        source: string;
    } | null;
    progress: number | null;
    currentStep: number | null;
    totalSteps: number | null;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    exitCode: number | null;
    timedOut: boolean;
    aborted: boolean;
    executionMs: number | null;
} | {
    error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
}>;
export declare const handleEmailResponseRoute: (payload: EmailResponseRequest, set: RouteSetState) => Promise<{
    runId: string;
    status: "success";
    reply: string;
    provider: string;
    model: string;
    delivered: boolean;
    recipientEmail?: string | undefined;
    deliveredAt?: string | undefined;
    messageId?: string | undefined;
} | {
    error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
}>;
export declare const handleScheduledEmailResponseRoute: (payload: ScheduleEmailResponseRequestBody, set: RouteSetState) => Promise<{
    id: string;
    type: "email" | "job_apply" | "scrape";
    status: "error" | "pending" | "running" | "success";
    jobId: string | null;
    userId: string | null;
    input: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | null;
    output: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | {
        success: boolean;
        error: string | null;
        screenshots: string[];
        artifacts: {
            id: string;
            kind: "document" | "log" | "screenshot" | "trace";
            path: string;
            label?: string | undefined;
            mimeType?: string | undefined;
        }[];
        steps: {
            action: string;
            status: "error" | "ok";
            message?: string | undefined;
        }[];
    } | null;
    screenshots: string[] | null;
    error: string | {
        code: "AUTOMATION_CANCELLED" | "AUTOMATION_RUNTIME_ERROR" | "AUTOMATION_TIMEOUT" | "NETWORK_ERROR" | "OUTPUT_PERSISTENCE_ERROR" | "OUTPUT_VALIDATION_ERROR" | "SCRIPT_OUTPUT_INVALID" | "SCRIPT_PROTOCOL_ERROR" | "UNKNOWN_ERROR";
        message: string;
        details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
        source: string;
    } | null;
    progress: number | null;
    currentStep: number | null;
    totalSteps: number | null;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    exitCode: number | null;
    timedOut: boolean;
    aborted: boolean;
    executionMs: number | null;
} | {
    error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
}>;
export declare const handleScrapeRoute: (payload: RunScrapeRequestBody, set: RouteSetState) => Promise<{
    id: string;
    type: "email" | "job_apply" | "scrape";
    status: "error" | "pending" | "running" | "success";
    jobId: string | null;
    userId: string | null;
    input: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | null;
    output: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | {
        success: boolean;
        error: string | null;
        screenshots: string[];
        artifacts: {
            id: string;
            kind: "document" | "log" | "screenshot" | "trace";
            path: string;
            label?: string | undefined;
            mimeType?: string | undefined;
        }[];
        steps: {
            action: string;
            status: "error" | "ok";
            message?: string | undefined;
        }[];
    } | null;
    screenshots: string[] | null;
    error: string | {
        code: "AUTOMATION_CANCELLED" | "AUTOMATION_RUNTIME_ERROR" | "AUTOMATION_TIMEOUT" | "NETWORK_ERROR" | "OUTPUT_PERSISTENCE_ERROR" | "OUTPUT_VALIDATION_ERROR" | "SCRIPT_OUTPUT_INVALID" | "SCRIPT_PROTOCOL_ERROR" | "UNKNOWN_ERROR";
        message: string;
        details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
        source: string;
    } | null;
    progress: number | null;
    currentStep: number | null;
    totalSteps: number | null;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    exitCode: number | null;
    timedOut: boolean;
    aborted: boolean;
    executionMs: number | null;
} | {
    error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
}>;
export declare const handleScheduledScrapeRoute: (payload: ScheduleScrapeRequestBody, set: RouteSetState) => Promise<{
    id: string;
    type: "email" | "job_apply" | "scrape";
    status: "error" | "pending" | "running" | "success";
    jobId: string | null;
    userId: string | null;
    input: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | null;
    output: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | {
        success: boolean;
        error: string | null;
        screenshots: string[];
        artifacts: {
            id: string;
            kind: "document" | "log" | "screenshot" | "trace";
            path: string;
            label?: string | undefined;
            mimeType?: string | undefined;
        }[];
        steps: {
            action: string;
            status: "error" | "ok";
            message?: string | undefined;
        }[];
    } | null;
    screenshots: string[] | null;
    error: string | {
        code: "AUTOMATION_CANCELLED" | "AUTOMATION_RUNTIME_ERROR" | "AUTOMATION_TIMEOUT" | "NETWORK_ERROR" | "OUTPUT_PERSISTENCE_ERROR" | "OUTPUT_VALIDATION_ERROR" | "SCRIPT_OUTPUT_INVALID" | "SCRIPT_PROTOCOL_ERROR" | "UNKNOWN_ERROR";
        message: string;
        details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
        source: string;
    } | null;
    progress: number | null;
    currentStep: number | null;
    totalSteps: number | null;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    exitCode: number | null;
    timedOut: boolean;
    aborted: boolean;
    executionMs: number | null;
} | {
    error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
}>;
export declare const handleAutomationCapabilitiesRoute: (set: RouteSetState) => Promise<import("@bao/shared/constants/automation").RpaCapabilityAuditReport | {
    error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
}>;
export declare const handleAutomationRunByIdRoute: (runId: string, set: RouteSetState) => Promise<{
    id: string;
    type: "email" | "job_apply" | "scrape";
    status: "error" | "pending" | "running" | "success";
    jobId: string | null;
    userId: string | null;
    input: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | null;
    output: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | {
        success: boolean;
        error: string | null;
        screenshots: string[];
        artifacts: {
            id: string;
            kind: "document" | "log" | "screenshot" | "trace";
            path: string;
            label?: string | undefined;
            mimeType?: string | undefined;
        }[];
        steps: {
            action: string;
            status: "error" | "ok";
            message?: string | undefined;
        }[];
    } | null;
    screenshots: string[] | null;
    error: string | {
        code: "AUTOMATION_CANCELLED" | "AUTOMATION_RUNTIME_ERROR" | "AUTOMATION_TIMEOUT" | "NETWORK_ERROR" | "OUTPUT_PERSISTENCE_ERROR" | "OUTPUT_VALIDATION_ERROR" | "SCRIPT_OUTPUT_INVALID" | "SCRIPT_PROTOCOL_ERROR" | "UNKNOWN_ERROR";
        message: string;
        details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
        source: string;
    } | null;
    progress: number | null;
    currentStep: number | null;
    totalSteps: number | null;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    exitCode: number | null;
    timedOut: boolean;
    aborted: boolean;
    executionMs: number | null;
} | {
    error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
}>;
export {};
