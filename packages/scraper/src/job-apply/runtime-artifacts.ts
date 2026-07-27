import { mkdir } from "node:fs/promises";
import { basename, join } from "node:path";
import { settle } from "@bao/shared/utils/promise";
import { isRecord } from "@bao/shared/utils/type-guards";
import type { Locator } from "playwright";
import {
  type CaptureScreenshotOptions,
  type ResumeCandidateFields,
  RUN_SCREENSHOT_PREFIX,
  type StepRecord,
  type StepStatus,
  type UploadResumeArtifactOptions,
} from "./runtime-contracts";
import { runOnFirstMatchingLocator } from "./runtime-locators";

const getRecordValue = (value: unknown, key: string): unknown => {
  if (!isRecord(value)) {
    return;
  }

  return value[key];
};

const getStringValue = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const getStringCandidates = (value: unknown, keys: readonly string[]): string[] =>
  keys
    .map((key) => getStringValue(getRecordValue(value, key)))
    .filter((candidate) => candidate.length > 0);

export const collectResumeCandidateFields = (
  resume: Record<string, unknown>,
): ResumeCandidateFields => {
  const personalInfo = getRecordValue(resume, "personalInfo");
  const fullName =
    getStringCandidates(personalInfo, ["fullName", "name", "full_name", "firstName"])[0] ?? "";
  const email = getStringCandidates(personalInfo, ["email", "emailAddress"])[0] ?? "";
  const phone = getStringCandidates(personalInfo, ["phone", "phoneNumber", "mobile"])[0] ?? "";

  return {
    fullName,
    email,
    phone,
  };
};

export const flattenJsonStrings = (value: unknown): string[] => {
  if (typeof value === "string") {
    return value.trim().length > 0 ? [value.trim()] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenJsonStrings(entry));
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  return Object.values(value).flatMap((entry) => flattenJsonStrings(entry));
};

const serializeResumeArtifact = (resume: Record<string, unknown>): string => {
  const lines = flattenJsonStrings(resume);
  return lines.length > 0 ? lines.join("\n") : JSON.stringify(resume, null, 2);
};

export const addStep = (
  steps: StepRecord[],
  action: string,
  status: StepStatus,
  message?: string,
): void => {
  steps.push({
    action,
    status,
    ...(message ? { message } : {}),
  });
};

export const createArtifacts = (screenshots: string[]) =>
  screenshots.map((screenshotPath, index) => ({
    id: `screenshot-${String(index + 1).padStart(2, "0")}`,
    kind: "screenshot" as const,
    path: screenshotPath,
    label: basename(screenshotPath),
    mimeType: "image/png",
  }));

export const buildOutputDirectory = async (payload: {
  outputDir?: string | null;
  runId: string;
}): Promise<string | null> => {
  const outputDir = payload.outputDir?.trim();
  if (outputDir) {
    const directoryResult = await settle(mkdir(outputDir, { recursive: true }));
    return directoryResult.status === "fulfilled" ? outputDir : null;
  }

  const fallbackDirectory = join(process.cwd(), "tmp", "automation", payload.runId);
  const fallbackResult = await settle(mkdir(fallbackDirectory, { recursive: true }));
  return fallbackResult.status === "fulfilled" ? fallbackDirectory : null;
};

const resolveResumeArtifactPath = async (
  outputDir: string,
  resume: Record<string, unknown>,
  resumeFilePath?: string,
): Promise<string | null> => {
  const providedPath = resumeFilePath?.trim();
  if (providedPath) {
    const providedFile = Bun.file(providedPath);
    if (await providedFile.exists()) {
      return providedPath;
    }
  }

  const artifactPath = join(outputDir, "resume.txt");
  const writeResult = await settle(Bun.write(artifactPath, serializeResumeArtifact(resume)));
  return writeResult.status === "fulfilled" ? artifactPath : null;
};

export const uploadResumeArtifact = async ({
  page,
  selectors,
  outputDir,
  resume,
  resumeFilePath,
}: UploadResumeArtifactOptions): Promise<boolean> => {
  const artifactPath = await resolveResumeArtifactPath(outputDir, resume, resumeFilePath);
  if (!artifactPath) {
    return false;
  }

  const uploadResult = await runOnFirstMatchingLocator(
    page,
    selectors,
    async (locator: Locator) => {
      const matchingResult = await settle(locator.setInputFiles(artifactPath));
      return matchingResult.status === "fulfilled" ? true : null;
    },
  );
  return uploadResult ?? false;
};

export const captureScreenshot = async ({
  page,
  outputDir,
  autoSaveScreenshots,
  screenshots,
  steps,
  label,
}: CaptureScreenshotOptions): Promise<void> => {
  if (!autoSaveScreenshots) {
    return;
  }

  const screenshotPath = join(
    outputDir,
    `${RUN_SCREENSHOT_PREFIX}-${String(screenshots.length + 1).padStart(2, "0")}.png`,
  );
  const screenshotResult = await settle(
    page.screenshot({
      path: screenshotPath,
      fullPage: false,
    }),
  );

  if (screenshotResult.status === "fulfilled") {
    screenshots.push(screenshotPath);
    addStep(steps, "screenshot", "ok", label);
    return;
  }

  addStep(steps, "screenshot", "error", label);
};
