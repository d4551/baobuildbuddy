import type { AutomationSettings } from "@bao/shared";
/**
 * Standard result shape for RPA-Python scripts.
 */
export interface RpaRunResult {
    success: boolean;
    error: string | null;
    screenshots: string[];
    steps: Array<{
        action: string;
        status: "ok" | "error";
        message?: string;
    }>;
}
/**
 * Callback for receiving real-time progress events from RPA scripts via stderr.
 */
export type RpaProgressCallback = (data: Record<string, unknown>) => void;
/**
 * Runs a Python RPA script through stdin/stdout JSON integration and returns structured JSON.
 *
 * @param scriptName Relative name inside packages/scraper.
 * @param inputJson Payload sent to the Python process via stdin.
 * @param automationSettings Optional RPA settings (headless, timeout, etc.)
 * @param onProgress Optional callback for real-time progress events streamed via stderr.
 * @throws Error when the process exits non-zero or emits invalid JSON.
 */
export declare function runRpaScript(scriptName: string, inputJson: Record<string, unknown>, automationSettings?: AutomationSettings | null, onProgress?: RpaProgressCallback): Promise<RpaRunResult>;
