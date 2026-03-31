import type { ErrorEnvelope } from "@bao/shared/schemas/error-envelope.schema";
import type { RpaRunEvent, RpaRunResult } from "@bao/shared/schemas/rpa-events.schema";
import type { AutomationSettings } from "@bao/shared/types/settings-contracts";
import type { RpaScriptExecutionResult } from "./rpa-runner-contracts";
export declare const resolveRunArtifactDir: (runId: string, invalidRunIdMessage: string) => string;
export declare const normalizeExecutionResult: (runId: string, execution: RpaScriptExecutionResult, invalidRunIdMessage: string) => Promise<RpaRunResult>;
export declare const persistProgress: (event: RpaRunEvent) => Promise<void>;
export declare const markRunFailed: (runId: string, errorMessage: string, automationSettings: AutomationSettings, execution?: {
    exitCode?: number | null;
    timedOut?: boolean;
    aborted?: boolean;
    executionMs?: number | null;
    errorEnvelope?: ErrorEnvelope | null;
}) => Promise<void>;
export declare const markRunCompleted: (runId: string, output: RpaRunResult, automationSettings: AutomationSettings, execution: Pick<RpaScriptExecutionResult, "exitCode" | "timedOut" | "aborted" | "executionMs">) => Promise<void>;
export declare const assertRunExists: (runId: string, createRunNotFoundError: (runId: string) => Error) => Promise<void>;
