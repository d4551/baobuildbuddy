import { type RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import type { JsonObject } from "@bao/shared/utils/json";
import type { JobApplyRequestBody } from "./automation-route-contracts";
import { AUTOMATION_RUN_STATUSES, AUTOMATION_RUN_TYPES } from "./automation-route-contracts";
export declare const readAutomationRunById: (runId: string) => Promise<RpaRunExecutionEnvelope | null>;
export declare const listAutomationRuns: (query: {
    type?: (typeof AUTOMATION_RUN_TYPES)[number];
    status?: (typeof AUTOMATION_RUN_STATUSES)[number];
}) => Promise<{
    id: string;
    type: "email" | "job_apply" | "scrape";
    status: "error" | "pending" | "running" | "success";
    jobId: string | null;
    userId: string | null;
    input: JsonObject | null;
    output: JsonObject | {
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
        details?: JsonObject | undefined;
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
}[]>;
export declare const ensureAutomationVerifyContext: () => Promise<{
    resumeId: string;
}>;
export declare const runJobApplyInBackground: (runId: string, payload: JobApplyRequestBody) => void;
