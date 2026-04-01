import type { RpaScriptExecutionResult, RunRpaScriptOptions } from "./rpa-runner-contracts";
/**
 * Runs an RPA script and validates protocol events using shared schemas.
 */
export declare function runRpaScript(options: RunRpaScriptOptions): Promise<RpaScriptExecutionResult>;
