import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { generateId } from "@bao/shared";
import { SCRAPER_DIR } from "../../config/paths";
import { runRpaScript } from "./rpa-runner";

const TEST_SCRIPT_NAME = "rpa_runner_contract_test.py";
const TEST_SCRIPT_PATH = join(SCRAPER_DIR, TEST_SCRIPT_NAME);

beforeAll(async () => {
  await Bun.write(
    TEST_SCRIPT_PATH,
    `#!/usr/bin/env python3
import json
import sys

payload = json.loads(sys.stdin.read() or "{}")
run_id = payload.get("runId", "run-missing")
protocol_version = payload.get("protocolVersion", "1.0")
mode = payload.get("mode", "success")

if mode == "success":
    sys.stderr.write(json.dumps({
        "protocolVersion": protocol_version,
        "runId": run_id,
        "sequence": 0,
        "timestamp": "2026-02-23T00:00:00+00:00",
        "eventType": "progress",
        "action": "fill_form",
        "status": "running",
        "step": 1,
        "totalSteps": 2,
    }) + "\\n")
    sys.stdout.write(json.dumps({
        "protocolVersion": protocol_version,
        "runId": run_id,
        "sequence": 1,
        "timestamp": "2026-02-23T00:00:01+00:00",
        "eventType": "result",
        "result": {
            "success": True,
            "error": None,
            "screenshots": [],
            "artifacts": [],
            "steps": [{"action": "fill_form", "status": "ok"}],
        },
    }) + "\\n")
    sys.exit(0)

if mode == "malformed":
    sys.stdout.write("not-json\\n")
    sys.exit(0)

if mode == "stdout_progress":
    sys.stdout.write(json.dumps({
        "protocolVersion": protocol_version,
        "runId": run_id,
        "sequence": 0,
        "timestamp": "2026-02-23T00:00:00+00:00",
        "eventType": "progress",
        "action": "wrong_stream",
        "status": "running",
    }) + "\\n")
    sys.exit(0)

if mode == "timeout":
    import time
    time.sleep(2.0)
    sys.exit(0)

sys.stderr.write("runtime failure\\n")
sys.exit(1)
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
      scriptName: TEST_SCRIPT_NAME,
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
      scriptName: TEST_SCRIPT_NAME,
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
      scriptName: TEST_SCRIPT_NAME,
      scriptInput: {
        mode: "runtime",
      },
      executionContext: context,
    });

    expect(execution.result).toBeNull();
    expect(execution.error?.code).toBe("PYTHON_RUNTIME_ERROR");
    expect(execution.exitCode).not.toBe(0);
  });
};

const registerUnexpectedProgressCase = (): void => {
  test("returns protocol error when stdout emits unexpected progress events", async () => {
    const context = createExecutionContext(5_000);
    const execution = await runRpaScript({
      scriptName: TEST_SCRIPT_NAME,
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
      scriptName: TEST_SCRIPT_NAME,
      scriptInput: {
        mode: "timeout",
      },
      executionContext: context,
    });

    expect(execution.result).toBeNull();
    expect(execution.timedOut).toBe(true);
    expect(execution.error?.code).toBe("PYTHON_TIMEOUT");
  });
};

describe("runRpaScript", () => {
  registerSuccessCase();
  registerMalformedPayloadCase();
  registerRuntimeFailureCase();
  registerUnexpectedProgressCase();
  registerTimeoutCase();
});
