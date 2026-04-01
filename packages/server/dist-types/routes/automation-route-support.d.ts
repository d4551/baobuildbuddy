import { type RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import type { JobApplyRequestBody } from "./automation-route-contracts";
import { AUTOMATION_RUN_STATUSES, AUTOMATION_RUN_TYPES } from "./automation-route-contracts";
export declare const readAutomationRunById: (runId: string) => Promise<RpaRunExecutionEnvelope | null>;
export declare const listAutomationRuns: (query: {
    type?: (typeof AUTOMATION_RUN_TYPES)[number];
    status?: (typeof AUTOMATION_RUN_STATUSES)[number];
}) => Promise<{
    id: string;
    type: "scrape" | "job_apply" | "email";
    status: "error" | "success" | "pending" | "running";
    jobId: string | null;
    userId: string | null;
    input: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | null;
    output: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | {
        success: boolean;
        error: string | null;
        screenshots: string[];
        artifacts: {
            id: string;
            kind: "screenshot" | "trace" | "document" | "log";
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
        code: "AUTOMATION_RUNTIME_ERROR" | "AUTOMATION_TIMEOUT" | "AUTOMATION_CANCELLED" | "SCRIPT_PROTOCOL_ERROR" | "SCRIPT_OUTPUT_INVALID" | "OUTPUT_PERSISTENCE_ERROR" | "OUTPUT_VALIDATION_ERROR" | "NETWORK_ERROR" | "UNKNOWN_ERROR";
        message: string;
        source: string;
        details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
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
}[]>;
export declare const ensureAutomationVerifyContext: () => Promise<{
    resumeId: string;
}>;
export declare const runJobApplyInBackground: (runId: string, payload: JobApplyRequestBody) => void;
