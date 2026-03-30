import type { ErrorEnvelope, RpaRunEvent, RpaRunResult } from "@bao/shared";
import type { RpaScriptExecutionResult } from "./rpa-runner";
type ProgressRunEvent = Extract<RpaRunEvent, {
    eventType: "progress";
}>;
export declare const toFiniteNumber: (value: unknown) => number;
export declare const createProgressUpdate: (event: ProgressRunEvent) => {
    status?: string;
    progress?: number;
    currentStep?: number | null;
    totalSteps?: number | null;
    updatedAt: string;
};
export declare const purgeExpiredAutomationScreenshots: (retentionDays: number) => Promise<void>;
export declare const createFailedRunUpdate: (errorMessage: string, execution?: {
    exitCode?: number | null;
    timedOut?: boolean;
    aborted?: boolean;
    executionMs?: number | null;
    errorEnvelope?: ErrorEnvelope | null;
}) => {
    status: string;
    output: {
        success: boolean;
        error: string;
        screenshots: never[];
        steps: {
            action: string;
            status: "error";
            message: string;
        }[];
        errorEnvelope: {
            code: "AUTOMATION_RUNTIME_ERROR" | "AUTOMATION_TIMEOUT" | "AUTOMATION_CANCELLED" | "SCRIPT_PROTOCOL_ERROR" | "SCRIPT_OUTPUT_INVALID" | "OUTPUT_PERSISTENCE_ERROR" | "OUTPUT_VALIDATION_ERROR" | "NETWORK_ERROR" | "UNKNOWN_ERROR";
            message: string;
            details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
        } | null;
    };
    error: string;
    progress: number;
    currentStep: number;
    totalSteps: number;
    exitCode: number | null;
    timedOut: boolean;
    aborted: boolean;
    executionMs: number | null;
    completedAt: string;
    updatedAt: string;
};
export declare const createCompletedRunUpdate: (output: RpaRunResult, execution: Pick<RpaScriptExecutionResult, "exitCode" | "timedOut" | "aborted" | "executionMs">) => {
    status: string;
    output: Record<string, unknown>;
    screenshots: string[];
    error: string | null;
    progress: number;
    currentStep: number;
    totalSteps: number;
    exitCode: number;
    timedOut: boolean;
    aborted: boolean;
    executionMs: number;
    completedAt: string;
    updatedAt: string;
};
export {};
