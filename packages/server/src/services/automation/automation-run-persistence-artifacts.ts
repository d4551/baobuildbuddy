import { join, resolve } from "node:path";
import {
  AUTOMATION_MAX_SCREENSHOT_NAME_LENGTH,
  AUTOMATION_MIN_ID_LENGTH,
} from "@bao/shared/constants/automation";
import type { RpaRunResult } from "@bao/shared/schemas/rpa-events.schema";
import { settle } from "@bao/shared/utils/promise";
import { AUTOMATION_SCREENSHOT_DIR } from "../../config/paths";
import {
  MAX_CUSTOM_ANSWER_KEY_LENGTH,
  MAX_CUSTOM_ANSWER_VALUE_LENGTH,
} from "./automation-validation";
import type { RpaScriptExecutionResult } from "./rpa-runner-contracts";

const SUPPORTED_SCREENSHOT_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"] as const;
const RUN_SCREENSHOT_PREFIX = "step";
const RUN_ID_PATTERN = /^[0-9a-f-]+$/i;

const sanitizeStep = (step: {
  action?: unknown;
  status?: unknown;
  message?: unknown;
}): { action: string; status: "ok" | "error"; message?: string } | null => {
  if (!step || typeof step !== "object") {
    return null;
  }
  if (typeof step.action !== "string" || step.action.length > MAX_CUSTOM_ANSWER_KEY_LENGTH) {
    return null;
  }

  const status = step.status === "error" || step.status === "ok" ? step.status : "ok";
  if (typeof step.message !== "string" || step.message.length > MAX_CUSTOM_ANSWER_VALUE_LENGTH) {
    return { action: step.action, status };
  }

  return { action: step.action, status, message: step.message };
};

const sanitizeSteps = (
  steps: Array<{ action?: unknown; status?: unknown; message?: unknown }>,
): Array<{ action: string; status: "ok" | "error"; message?: string }> =>
  steps
    .map((step) => sanitizeStep(step))
    .filter(
      (step): step is { action: string; status: "ok" | "error"; message?: string } => step !== null,
    );

export const sanitizeRunId = (runId: string, invalidRunIdMessage: string): string => {
  const safeId = runId.trim();
  if (!RUN_ID_PATTERN.test(safeId) || safeId.length < AUTOMATION_MIN_ID_LENGTH) {
    throw new Error(invalidRunIdMessage);
  }
  return safeId;
};

export const resolveRunArtifactDir = (runId: string, invalidRunIdMessage: string): string =>
  join(AUTOMATION_SCREENSHOT_DIR, sanitizeRunId(runId, invalidRunIdMessage));

const resolveScreenshotExtension = (pathValue: string): string => {
  const lastDotIndex = pathValue.lastIndexOf(".");
  const extension = lastDotIndex >= 0 ? pathValue.slice(lastDotIndex).toLowerCase() : "";
  return SUPPORTED_SCREENSHOT_EXTENSIONS.some(
    (supportedExtension) => supportedExtension === extension,
  )
    ? extension
    : ".png";
};

const hashScreenshotSource = (sourcePath: string): string => {
  let hash = 0;
  for (let index = 0; index < sourcePath.length; index += 1) {
    hash = (hash * 31 + sourcePath.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(AUTOMATION_MIN_ID_LENGTH, "0");
};

const resolveScreenshotName = (index: number, sourcePath: string): string => {
  const extension = resolveScreenshotExtension(sourcePath);
  const stepToken = String(index + 1).padStart(2, "0");
  const shortName = `${RUN_SCREENSHOT_PREFIX}-${stepToken}${extension}`;
  if (shortName.length <= AUTOMATION_MAX_SCREENSHOT_NAME_LENGTH) {
    return shortName;
  }

  const fallbackHash = hashScreenshotSource(sourcePath);
  const base = `${RUN_SCREENSHOT_PREFIX}-${stepToken}-`;
  const maxSuffixLength = Math.max(
    4,
    AUTOMATION_MAX_SCREENSHOT_NAME_LENGTH - base.length - extension.length,
  );
  return `${base}${fallbackHash.slice(0, maxSuffixLength)}${extension}`;
};

const copySingleScreenshot = async (
  runDir: string,
  index: number,
  sourcePath: string,
): Promise<string | null> => {
  if (!sourcePath.trim()) {
    return null;
  }

  const sourceFile = Bun.file(sourcePath);
  if (!(await sourceFile.exists())) {
    return null;
  }

  const safeFileName = resolveScreenshotName(index, sourcePath);
  const sourceResolvedPath = resolve(sourcePath);
  const destination = join(runDir, safeFileName);
  if (sourceResolvedPath === destination) {
    return safeFileName;
  }

  const bytesResult = await settle(sourceFile.arrayBuffer());
  if (bytesResult.status === "rejected") {
    return null;
  }

  const writeResult = await settle(Bun.write(destination, bytesResult.value));
  if (writeResult.status === "rejected") {
    return null;
  }

  return safeFileName;
};

export const copyAndIndexScreenshots = async (
  runDir: string,
  sourceScreenshots: string[] | undefined,
): Promise<string[]> => {
  if (!Array.isArray(sourceScreenshots) || sourceScreenshots.length === 0) {
    return [];
  }

  const copiedScreenshots = await Promise.all(
    sourceScreenshots.map((sourcePath, index) => copySingleScreenshot(runDir, index, sourcePath)),
  );
  return copiedScreenshots.filter((fileName): fileName is string => typeof fileName === "string");
};

export const normalizeExecutionArtifacts = async (
  _runId: string,
  runDir: string,
  execution: RpaScriptExecutionResult,
): Promise<RpaRunResult> => {
  const terminalResult = execution.result;
  const copiedScreenshots = await copyAndIndexScreenshots(runDir, terminalResult?.screenshots);
  const mergedArtifacts = [
    ...(terminalResult?.artifacts ?? []),
    ...copiedScreenshots.map((fileName, index) => ({
      id: `screenshot-${String(index + 1).padStart(2, "0")}`,
      kind: "screenshot" as const,
      path: fileName,
    })),
  ];

  return {
    success: terminalResult?.success ?? false,
    error: terminalResult?.error ?? execution.error?.message ?? null,
    screenshots: copiedScreenshots,
    artifacts: mergedArtifacts,
    steps: sanitizeSteps(terminalResult?.steps ?? []),
  };
};
