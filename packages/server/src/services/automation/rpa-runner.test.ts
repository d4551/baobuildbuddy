import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { generateId } from "@bao/shared/utils/validation";
import { SCRAPER_DIR } from "../../config/paths";
import { runRpaScript } from "./rpa-runner-protocol";
const NUM_100 = 100;
const NUM_5000 = 5_000;

const TEST_SCRIPT_NAME = "rpa_runner_contract_test.ts";
const TEST_SCRIPT_PATH = join(SCRAPER_DIR, TEST_SCRIPT_NAME);

beforeAll(async () => {
  await Bun.write(
    TEST_SCRIPT_PATH,
    `const payload = JSON.parse((await Bun.stdin.text()) || "{}");
const runId = typeof payload.runId === "string" && payload.runId.length > 0 ? payload.runId : "run-missing";
const protocolVersion =
  typeof payload.protocolVersion === "string" && payload.protocolVersion.length > 0
    ? payload.protocolVersion
    : "1.0";
const mode = typeof payload.mode === "string" ? payload.mode : "success";

if (mode === "success") {
  process.stderr.write(
    \`\${JSON.stringify({
      protocolVersion,
      runId,
      sequence: 0,
      timestamp: "2026-02-23T00:00:00+00:00",
      eventType: "progress",
      action: "fill_form",
      status: "running",
      step: 1,
      totalSteps: 2,
    })}\\n\`,
  );
  process.stdout.write(
    \`\${JSON.stringify({
      protocolVersion,
      runId,
      sequence: 1,
      timestamp: "2026-02-23T00:00:01+00:00",
      eventType: "result",
      result: {
        success: true,
        error: null,
        screenshots: [],
        artifacts: [],
        steps: [{ action: "fill_form", status: "ok" }],
      },
    })}\\n\`,
  );
  process.exit(0);
}

if (mode === "malformed") {
  process.stdout.write("not-json\\n");
  process.exit(0);
}

if (mode === "stdout_progress") {
  process.stdout.write(
    \`\${JSON.stringify({
      protocolVersion,
      runId,
      sequence: 0,
      timestamp: "2026-02-23T00:00:00+00:00",
      eventType: "progress",
      action: "wrong_stream",
      status: "running",
    })}\\n\`,
  );
  process.exit(0);
}

if (mode === "timeout") {
  await Bun.sleep(2_000);
  process.exit(0);
}

if (mode === "browser_missing" || mode === "browser_crash" || mode === "browser_polluted") {
  const failureMode =
    mode === "browser_missing"
      ? "BROWSER_EXECUTABLE_MISSING"
      : mode === "browser_crash"
        ? "BROWSER_PROCESS_CRASHED"
        : "BROWSER_PATH_POLLUTED";
  const causeMessage =
    mode === "browser_missing"
      ? "browserType.launch: Executable doesn't exist at /tmp/chromium"
      : mode === "browser_crash"
        ? "browserType.launch: Target closed (Received signal SIGSEGV)"
        : "browserType.launch: Failed to launch browser from cursor-sandbox-cache";
  process.stdout.write(
    \`\${JSON.stringify({
      protocolVersion,
      runId,
      sequence: 0,
      timestamp: "2026-02-23T00:00:02+00:00",
      eventType: "error",
      error: {
        code: "AUTOMATION_RUNTIME_ERROR",
        message: \`Unable to launch automation browser (\${failureMode}).\`,
        source: "@bao/scraper",
        details: {
          failureMode,
          causeMessage,
          stage: "launch",
        },
      },
    })}\\n\`,
  );
  process.exit(1);
}

process.stderr.write("runtime failure\\n");
process.exit(1);
`,
  );
});

afterAll(() => {
  rmSync(TEST_SCRIPT_PATH, { force: true });
});

const createExecutionContext = (timeoutMs: number): { runId: string; timeoutMs: number } => ({
  runId: generateId(),
  timeoutMs,
});

const registerSuccessCase = (): void => {
  test("parses NDJSON protocol progress/result events", async () => {
    const context = createExecutionContext(NUM_5000);
    const execution = await runRpaScript({
      scriptPath: TEST_SCRIPT_NAME,
      scriptInput: {
        mode: "success",
      },
      executionContext: context,
    });

    expect(execution.error).toBeNull();
    expect(execution.result?.success).toBe(true);
    expect(execution.events.length).toBe(2);
    expect(execution.events[0]?.eventType).toBe("progress");
    expect(execution.events[1]?.eventType).toBe("result");
  });
};

const registerMalformedPayloadCase = (): void => {
  test("returns protocol error for malformed terminal payload", async () => {
    const context = createExecutionContext(NUM_5000);
    const execution = await runRpaScript({
      scriptPath: TEST_SCRIPT_NAME,
      scriptInput: {
        mode: "malformed",
      },
      executionContext: context,
    });

    expect(execution.result).toBeNull();
    expect(execution.error?.code).toBe("SCRIPT_PROTOCOL_ERROR");
  });
};

const registerRuntimeFailureCase = (): void => {
  test("returns runtime error when script exits non-zero", async () => {
    const context = createExecutionContext(NUM_5000);
    const execution = await runRpaScript({
      scriptPath: TEST_SCRIPT_NAME,
      scriptInput: {
        mode: "runtime",
      },
      executionContext: context,
    });

    expect(execution.result).toBeNull();
    expect(execution.error?.code).toBe("AUTOMATION_RUNTIME_ERROR");
    expect(execution.exitCode).not.toBe(0);
  });
};

const registerUnexpectedProgressCase = (): void => {
  test("returns protocol error when stdout emits unexpected progress events", async () => {
    const context = createExecutionContext(NUM_5000);
    const execution = await runRpaScript({
      scriptPath: TEST_SCRIPT_NAME,
      scriptInput: {
        mode: "stdout_progress",
      },
      executionContext: context,
    });

    expect(execution.result).toBeNull();
    expect(execution.error?.code).toBe("SCRIPT_PROTOCOL_ERROR");
  });
};

const registerTimeoutCase = (): void => {
  test("returns timeout error when process exceeds timeout", async () => {
    const context = createExecutionContext(NUM_100);
    const execution = await runRpaScript({
      scriptPath: TEST_SCRIPT_NAME,
      scriptInput: {
        mode: "timeout",
      },
      executionContext: context,
    });

    expect(execution.result).toBeNull();
    expect(execution.timedOut).toBe(true);
    expect(execution.error?.code).toBe("AUTOMATION_TIMEOUT");
  });
};

const registerBrowserLaunchFailureDifferentiationCase = (): void => {
  test("surfaces distinct browser launch failure modes through protocol error details", async () => {
    const missing = await runRpaScript({
      scriptPath: TEST_SCRIPT_NAME,
      scriptInput: { mode: "browser_missing" },
      executionContext: createExecutionContext(NUM_5000),
    });
    const crashed = await runRpaScript({
      scriptPath: TEST_SCRIPT_NAME,
      scriptInput: { mode: "browser_crash" },
      executionContext: createExecutionContext(NUM_5000),
    });
    const polluted = await runRpaScript({
      scriptPath: TEST_SCRIPT_NAME,
      scriptInput: { mode: "browser_polluted" },
      executionContext: createExecutionContext(NUM_5000),
    });

    expect(missing.error?.code).toBe("AUTOMATION_RUNTIME_ERROR");
    expect(crashed.error?.code).toBe("AUTOMATION_RUNTIME_ERROR");
    expect(polluted.error?.code).toBe("AUTOMATION_RUNTIME_ERROR");

    expect(missing.error?.details?.failureMode).toBe("BROWSER_EXECUTABLE_MISSING");
    expect(crashed.error?.details?.failureMode).toBe("BROWSER_PROCESS_CRASHED");
    expect(polluted.error?.details?.failureMode).toBe("BROWSER_PATH_POLLUTED");

    expect(missing.error?.details?.failureMode).not.toBe(crashed.error?.details?.failureMode);
    expect(crashed.error?.details?.failureMode).not.toBe(polluted.error?.details?.failureMode);
    expect(polluted.error?.details?.failureMode).not.toBe(missing.error?.details?.failureMode);

    expect(String(missing.error?.details?.causeMessage)).toContain("Executable doesn't exist");
    expect(String(crashed.error?.details?.causeMessage)).toContain("SIGSEGV");
    expect(String(polluted.error?.details?.causeMessage)).toContain("cursor-sandbox-cache");

    expect(missing.error?.message).toContain("BROWSER_EXECUTABLE_MISSING");
    expect(crashed.error?.message).toContain("BROWSER_PROCESS_CRASHED");
    expect(polluted.error?.message).toContain("BROWSER_PATH_POLLUTED");
  });
};

describe("runRpaScript", () => {
  registerSuccessCase();
  registerMalformedPayloadCase();
  registerRuntimeFailureCase();
  registerUnexpectedProgressCase();
  registerTimeoutCase();
  registerBrowserLaunchFailureDifferentiationCase();
});
