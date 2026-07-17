import type { EmailResponseRequest } from "@bao/shared/schemas/automation-email.schema";
import type { JobApplyRequestBody, RunScrapeRequestBody, ScheduleEmailResponseRequestBody, ScheduleJobApplyRequestBody, ScheduleScrapeRequestBody } from "./automation-route-contracts";
export declare const handleVerifyAutomationContext: () => Promise<{
    status: 200;
    body: {
        resumeId: string;
    };
} | {
    status: 404;
    body: {
        error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
    };
}>;
export declare const handleJobApplyRoute: (payload: JobApplyRequestBody) => Promise<{
    status: 200;
    body: {
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
    };
} | {
    status: 404 | 409 | 422 | 500;
    body: {
        error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
    };
}>;
export declare const handleScheduledJobApplyRoute: (payload: ScheduleJobApplyRequestBody) => Promise<{
    status: 200;
    body: {
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
    };
} | {
    status: 404 | 409 | 422 | 500;
    body: {
        error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
    };
}>;
export declare const handleEmailResponseRoute: (payload: EmailResponseRequest) => Promise<{
    status: 200;
    body: {
        runId: string;
        status: "success";
        reply: string;
        provider: string;
        model: string;
        delivered: boolean;
        recipientEmail?: string | undefined;
        deliveredAt?: string | undefined;
        messageId?: string | undefined;
    };
} | {
    status: 404 | 409 | 422 | 500;
    body: {
        error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
    };
}>;
export declare const handleScheduledEmailResponseRoute: (payload: ScheduleEmailResponseRequestBody) => Promise<{
    status: 200;
    body: {
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
    };
} | {
    status: 404 | 409 | 422 | 500;
    body: {
        error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
    };
}>;
export declare const handleScrapeRoute: (payload: RunScrapeRequestBody) => Promise<{
    status: 200;
    body: {
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
    };
} | {
    status: 404 | 409 | 422 | 500;
    body: {
        error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
    };
}>;
export declare const handleScheduledScrapeRoute: (payload: ScheduleScrapeRequestBody) => Promise<{
    status: 200;
    body: {
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
    };
} | {
    status: 404 | 409 | 422 | 500;
    body: {
        error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
    };
}>;
export declare const handleAutomationCapabilitiesRoute: () => Promise<{
    status: 200;
    body: import("@bao/shared/constants/automation").RpaCapabilityAuditReport;
} | {
    status: 500;
    body: {
        error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
    };
}>;
export declare const handleAutomationRunByIdRoute: (runId: string) => Promise<{
    status: 200;
    body: {
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
    };
} | {
    status: 400;
    body: {
        error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
    };
} | {
    status: 404;
    body: {
        error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
    };
}>;
