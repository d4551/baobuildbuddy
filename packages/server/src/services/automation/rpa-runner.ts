import { join } from "node:path";

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
 * Runs a Python RPA script through stdin/stdout JSON integration and returns structured JSON.
 *
 * @param scriptName Relative name inside packages/scraper.
 * @param inputJson Payload sent to the Python process via stdin.
 * @throws Error when the process exits non-zero or emits invalid JSON.
 */
export async function runRpaScript(
  scriptName: string,
  inputJson: Record<string, unknown>,
): Promise<RpaRunResult> {
  const scriptPath = join(SCRAPER_DIR, scriptName);
  const payload = JSON.stringify(inputJson);

  const proc = Bun.spawn([PYTHON, scriptPath], {
    cwd: SCRAPER_DIR,
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });

  const encoder = new TextEncoder();
  const writer = proc.stdin.getWriter();
  await writer.write(encoder.encode(payload));
  writer.close();

  const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`RPA script failed (${exitCode}): ${stderr || stdout}`);
  }

  const output = stdout.trim();
  if (!output) {
    throw new Error(`RPA script did not return JSON output. ${stderr}`);
  }

  const parsed = JSON.parse(output) as unknown;
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
