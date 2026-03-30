import type { AutomationSettings, ErrorEnvelope, RpaRunEvent, RpaRunResult } from "@bao/shared";
import type { RpaScriptExecutionResult } from "./rpa-runner";
export declare const sanitizeRunId: (runId: string, invalidRunIdMessage: string) => string;
export declare const toFiniteNumber: (value: unknown) => number;
export declare const resolveRunArtifactDir: (runId: string, invalidRunIdMessage: string) => string;
export declare const normalizeExecutionResult: (runId: string, execution: RpaScriptExecutionResult, invalidRunIdMessage: string) => Promise<RpaRunResult>;
export declare const persistProgress: (event: RpaRunEvent) => Promise<void>;
export declare const purgeExpiredAutomationScreenshots: (retentionDays: number) => Promise<void>;
export declare const markRunFailed: (runId: string, errorMessage: string, automationSettings: AutomationSettings, execution?: {
    exitCode?: number | null;
    timedOut?: boolean;
    aborted?: boolean;
    executionMs?: number | null;
    errorEnvelope?: ErrorEnvelope | null;
}) => Promise<void>;
export declare const markRunCompleted: (runId: string, output: RpaRunResult, automationSettings: AutomationSettings, execution: Pick<RpaScriptExecutionResult, "exitCode" | "timedOut" | "aborted" | "executionMs">) => Promise<void>;
export declare const assertRunExists: (runId: string, createRunNotFoundError: (runId: string) => Error) => Promise<void>;
