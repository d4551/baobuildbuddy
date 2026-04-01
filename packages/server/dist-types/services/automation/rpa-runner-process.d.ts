import type { AutomationScriptExecutionResult, RunAutomationScriptOptions } from "./rpa-runner-contracts";
/**
 * Executes a Bun-based automation script with bounded IO capture and cancellation.
 */
export declare function runAutomationScript(options: RunAutomationScriptOptions): Promise<AutomationScriptExecutionResult>;
