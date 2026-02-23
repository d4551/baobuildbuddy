import type { AutomationSettings, ErrorEnvelope, RpaRunEvent, RpaRunResult } from "@bao/shared";
/**
 * Generic process-level result for Python script execution.
 */
export interface PythonScriptExecutionResult {
    exitCode: number;
    timedOut: boolean;
    aborted: boolean;
    executionMs: number;
    stdoutLines: string[];
    stderrLines: string[];
}
/**
 * Options for generic Python script execution.
 */
export interface RunPythonScriptOptions {
    scriptName: string;
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
 * Executes a Python script with Bun-native lifecycle controls and bounded IO capture.
 */
export declare function runPythonScript(options: RunPythonScriptOptions): Promise<PythonScriptExecutionResult>;
/**
 * Options for contract-first RPA script execution.
 */
export interface RunRpaScriptOptions {
    scriptName: string;
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
/**
 * Runs an RPA script and validates protocol events using shared schemas.
 */
export declare function runRpaScript(options: RunRpaScriptOptions): Promise<RpaScriptExecutionResult>;
