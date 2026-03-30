import type { AutomationScriptId, AutomationSettings, ErrorEnvelope, JsonObject, RpaRunEvent, RpaRunResult } from "@bao/shared";
/**
 * Generic process-level result for automation script execution.
 */
export interface AutomationScriptExecutionResult {
    exitCode: number;
    timedOut: boolean;
    aborted: boolean;
    executionMs: number;
    stdoutLines: string[];
    stderrLines: string[];
}
/**
 * Options for generic Bun-based automation script execution.
 */
export interface RunAutomationScriptOptions {
    scriptId?: AutomationScriptId;
    scriptPath?: string;
    scriptInput: Record<string, unknown>;
    timeoutMs?: number;
    signal?: AbortSignal;
    runId: string;
    outputDir?: string;
    killSignal?: number | string;
    stdoutLineLimit?: number;
    stderrLineLimit?: number;
    onStdoutLine?: (line: string) => void;
    onStderrLine?: (line: string) => void;
}
/**
 * Options for contract-first RPA script execution.
 */
export interface RunRpaScriptOptions {
    scriptId?: AutomationScriptId;
    scriptPath?: string;
    scriptInput: Record<string, unknown>;
    executionContext: {
        runId: string;
        timeoutMs?: number;
        signal?: AbortSignal;
        outputDir?: string;
    };
    automationSettings?: AutomationSettings | null;
    onEvent?: (event: RpaRunEvent) => void;
}
/**
 * Result envelope for a contract-validated RPA script run.
 */
export interface RpaScriptExecutionResult {
    result: RpaRunResult | null;
    error: ErrorEnvelope | null;
    events: RpaRunEvent[];
    exitCode: number;
    timedOut: boolean;
    aborted: boolean;
    executionMs: number;
    stdoutLines: string[];
    stderrLines: string[];
}
export declare const buildErrorEnvelope: (code: ErrorEnvelope["code"], message: string, details?: JsonObject) => ErrorEnvelope;
