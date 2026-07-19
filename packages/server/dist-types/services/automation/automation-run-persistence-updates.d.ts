import type { ErrorEnvelope } from "@bao/shared/schemas/error-envelope.schema";
import type { RpaRunEvent, RpaRunResult } from "@bao/shared/schemas/rpa-events.schema";
import type { JsonObject } from "@bao/shared/utils/json";
import type { RpaScriptExecutionResult } from "./rpa-runner-contracts";
type ProgressRunEvent = Extract<RpaRunEvent, {
    eventType: "progress";
}>;
export declare const toFiniteNumber: <T>(value: T) => number;
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
        errorEnvelope: ErrorEnvelope | null;
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
    output: JsonObject;
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
