import type { RpaRunResult } from "@bao/shared/schemas/rpa-events.schema";
import { ProtocolEmitter } from "../runtime/protocol";

const emitVerificationRun = async (): Promise<number> => {
  const rawPayload = await Bun.stdin.text();
  const payload =
    rawPayload.trim().length > 0 ? (JSON.parse(rawPayload) as { runId?: unknown }) : {};
  const runId =
    typeof payload.runId === "string" && payload.runId.trim().length > 0
      ? payload.runId.trim()
      : "automation-verify-run";
  const emitter = new ProtocolEmitter(runId);

  emitter.emitProgress({
    action: "verify_bootstrap",
    status: "running",
    message: "Preparing deterministic verification automation run.",
    step: 1,
    totalSteps: 3,
  });
  await Bun.sleep(300);
  emitter.emitProgress({
    action: "verify_fields",
    status: "running",
    message: "Applying deterministic verification answers.",
    step: 2,
    totalSteps: 3,
  });
  await Bun.sleep(300);
  emitter.emitProgress({
    action: "verify_submission",
    status: "running",
    message: "Completing deterministic verification submission.",
    step: 3,
    totalSteps: 3,
  });
  await Bun.sleep(300);

  const result: RpaRunResult = {
    success: true,
    error: null,
    screenshots: [],
    artifacts: [],
    steps: [
      { action: "verify_bootstrap", status: "ok" },
      { action: "verify_fields", status: "ok" },
      { action: "verify_submission", status: "ok" },
    ],
  };
  emitter.emitResult(result);
  return 0;
};

const runJobApplyScript = async (): Promise<number> => {
  const runtimeModule = await import("../job-apply/runtime");
  return runtimeModule.runJobApplyAutomation();
};

process.exitCode =
  process.env.BAO_ENABLE_AUTOMATION_VERIFY === "true"
    ? await emitVerificationRun()
    : await runJobApplyScript();
