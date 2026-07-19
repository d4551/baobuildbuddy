import { basename } from "node:path";
import { jobApplyScriptEnvelopeSchema } from "@bao/shared/schemas/automation-scripts.schema";
import type { RpaRunResult } from "@bao/shared/schemas/rpa-events.schema";
import { resumeDataSchema } from "@bao/shared/schemas/resume.schema";
import type { JsonObject, JsonValue } from "@bao/shared/utils/json";
import { parseScriptInput } from "../runtime/io";
import { ProtocolEmitter } from "../runtime/protocol";

const VERIFY_TOTAL_STEPS = 3 as const;

const flattenJsonStrings = (value: JsonValue, parts: string[] = []): string => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      parts.push(trimmed);
    }
    return parts.join(" ");
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      flattenJsonStrings(item, parts);
    }
    return parts.join(" ");
  }

  if (value !== null && typeof value === "object") {
    for (const item of Object.values(value)) {
      flattenJsonStrings(item, parts);
    }
  }

  return parts.join(" ");
};

const resolveSubmitUrl = (jobUrl: string): string => {
  const parsed = new URL(jobUrl);
  return new URL("/submit", parsed.origin).toString();
};

const appendResumeArtifact = async (
  form: FormData,
  resumeFilePath: string | undefined,
): Promise<string | null> => {
  if (!resumeFilePath) {
    return null;
  }

  const file = Bun.file(resumeFilePath);
  if (!(await file.exists())) {
    return "Resume artifact missing for verification submission.";
  }

  const bytes = await file.arrayBuffer();
  const fileName = basename(resumeFilePath);
  form.append(
    "resume",
    new File([bytes], fileName, {
      type: file.type.length > 0 ? file.type : "application/pdf",
    }),
  );
  return null;
};

const emitProgress = (
  emitter: ProtocolEmitter,
  action: string,
  step: number,
  message: string,
): void => {
  emitter.emitProgress({
    action,
    status: "running",
    message,
    step,
    totalSteps: VERIFY_TOTAL_STEPS,
  });
};

/**
 * Deterministic job-apply path for BAO_ENABLE_AUTOMATION_VERIFY.
 * Posts multipart form fields to the job fixture submit URL without Playwright.
 */
export const emitVerificationRun = async (): Promise<number> => {
  const inputResult = await parseScriptInput(jobApplyScriptEnvelopeSchema);
  const runId = inputResult.ok ? inputResult.value.runId : "automation-verify-run";
  const emitter = new ProtocolEmitter(runId);

  if (!inputResult.ok) {
    emitter.emitError("OUTPUT_VALIDATION_ERROR", inputResult.message);
    return 1;
  }

  const envelope = inputResult.value;
  const resumeParsed = resumeDataSchema.safeParse(envelope.resume);
  if (!resumeParsed.success) {
    emitter.emitError("OUTPUT_VALIDATION_ERROR", "Verification resume payload is invalid.");
    return 1;
  }

  emitProgress(
    emitter,
    "verify_bootstrap",
    1,
    "Preparing deterministic verification automation run.",
  );
  await Bun.sleep(50);

  const personalInfo = resumeParsed.data.personalInfo;
  const form = new FormData();
  form.set("name", personalInfo?.name?.trim() ?? "");
  form.set("email", personalInfo?.email?.trim() ?? "");
  form.set("phone", personalInfo?.phone?.trim() ?? "");

  const coverLetterContent: JsonObject | undefined = envelope.coverLetter?.content;
  if (coverLetterContent) {
    form.set("coverLetter", flattenJsonStrings(coverLetterContent));
  }

  for (const [fieldName, fieldValue] of Object.entries(envelope.customAnswers)) {
    form.set(fieldName, fieldValue);
  }

  emitProgress(emitter, "verify_fields", 2, "Applying deterministic verification answers.");
  await Bun.sleep(50);

  const resumeError = await appendResumeArtifact(form, envelope.resumeFilePath);
  if (resumeError !== null) {
    emitter.emitError("SCRIPT_OUTPUT_INVALID", resumeError);
    return 1;
  }

  emitProgress(
    emitter,
    "verify_submission",
    3,
    "Completing deterministic verification submission.",
  );

  const submitResponse = await fetch(resolveSubmitUrl(envelope.jobUrl), {
    method: "POST",
    body: form,
  });

  if (!submitResponse.ok) {
    emitter.emitError(
      "SCRIPT_OUTPUT_INVALID",
      `Verification submission failed with status ${String(submitResponse.status)}.`,
    );
    return 1;
  }

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
