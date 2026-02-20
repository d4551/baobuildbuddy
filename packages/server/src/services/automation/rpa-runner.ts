import { join } from "node:path";

import type { AutomationSettings } from "@bao/shared";
import { SCRAPER_DIR } from "../../config/paths";

const PYTHON = process.platform === "win32" ? "python" : "python3";

/**
 * Standard result shape for RPA-Python scripts.
 */
export interface RpaRunResult {
  success: boolean;
  error: string | null;
  screenshots: string[];
  steps: Array<{ action: string; status: "ok" | "error"; message?: string }>;
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
export async function runRpaScript(
  scriptName: string,
  inputJson: Record<string, unknown>,
  automationSettings?: AutomationSettings | null,
  onProgress?: RpaProgressCallback,
): Promise<RpaRunResult> {
  const scriptPath = join(SCRAPER_DIR, scriptName);
  const payload = JSON.stringify({
    ...inputJson,
    settings: automationSettings || {},
  });

  const proc = Bun.spawn([PYTHON, scriptPath], {
    cwd: SCRAPER_DIR,
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });

  const encoder = new TextEncoder();
  await proc.stdin.write(encoder.encode(payload));
  await proc.stdin.end();

  // Collect stdout for the final result
  const stdoutPromise = new Response(proc.stdout).text();

  // Parse stderr for progress events, collecting non-JSON lines for error reporting
  const stderrLines: string[] = [];
  const decoder = new TextDecoder();
  const stderrReader = proc.stderr.getReader();
  const stderrParsePromise = (async () => {
    try {
      while (true) {
        const { done, value } = await stderrReader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const progress = JSON.parse(line) as Record<string, unknown>;
            if (progress.type === "progress" && onProgress) {
              onProgress(progress);
            }
          } catch {
            // Non-JSON stderr line — collect for error reporting
            stderrLines.push(line);
          }
        }
      }
    } catch {
      // stderr reader closed
    }
  })();

  const [stdout] = await Promise.all([stdoutPromise, stderrParsePromise]);
  const stderr = stderrLines.join("\n");

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`RPA script failed (${exitCode}): ${stderr || stdout}`);
  }

  const output = stdout.trim();
  if (!output) {
    throw new Error(`RPA script did not return JSON output. ${stderr}`);
  }

  const candidateLines = output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("{") && line.endsWith("}"))
    .reverse();
  let parsed: unknown;
  for (const candidate of candidateLines) {
    try {
      parsed = JSON.parse(candidate);
      break;
    } catch {
      // Continue scanning for valid JSON on earlier lines.
    }
  }
  if (parsed === undefined) {
    try {
      parsed = JSON.parse(output);
    } catch {
      throw new Error(`RPA script returned unparsable output. ${stderr}`);
    }
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("success" in parsed) ||
    !Array.isArray((parsed as Record<string, unknown>).screenshots) ||
    !Array.isArray((parsed as Record<string, unknown>).steps)
  ) {
    throw new Error("RPA script returned unexpected output shape.");
  }

  return parsed as RpaRunResult;
}
