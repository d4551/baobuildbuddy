import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { rmSync } from "fs";
import { join } from "path";
import { generateId } from "@bao/shared";
import { SCRAPER_DIR } from "../../config/paths";
import { runRpaScript } from "./rpa-runner";

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
    const context = createExecutionContext(5_000);
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
    const context = createExecutionContext(5_000);
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
    const context = createExecutionContext(5_000);
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
    const context = createExecutionContext(5_000);
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
    const context = createExecutionContext(100);
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

describe("runRpaScript", () => {
  registerSuccessCase();
  registerMalformedPayloadCase();
  registerRuntimeFailureCase();
  registerUnexpectedProgressCase();
  registerTimeoutCase();
});
