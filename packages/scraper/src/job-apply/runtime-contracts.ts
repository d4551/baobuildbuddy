import type { JobApplyScriptEnvelope } from "@bao/shared/schemas/automation-scripts.schema";
import type { Page } from "playwright";
import type { AutomationBrowserSession } from "../runtime/browser";
import type { ProtocolEmitter } from "../runtime/protocol";
import type { JobApplyStrategy, JobApplySelectorBundle } from "./adapters";

export type StepStatus = "ok" | "error";

export type StepRecord = {
  action: string;
  status: StepStatus;
  message?: string;
};

export type ResumeCandidateFields = {
  fullName: string;
  email: string;
  phone: string;
};

export type JobApplyExecutionState = {
  emitter: ProtocolEmitter;
  payload: JobApplyScriptEnvelope;
  outputDir: string;
  session: AutomationBrowserSession;
  steps: StepRecord[];
  screenshots: string[];
};

export type CaptureScreenshotOptions = {
  page: Page;
  outputDir: string;
  autoSaveScreenshots: boolean;
  screenshots: string[];
  steps: StepRecord[];
  label: string;
};

export type FillTextFieldStepOptions = {
  state: JobApplyExecutionState;
  strategy: JobApplyStrategy;
  selectorKey: keyof JobApplySelectorBundle;
  action: string;
  step: number;
  value: string;
  emptyMessage: string;
  missingMessage: string;
};

export type SelectorMapInput = JobApplyScriptEnvelope["selectorMap"];

export type LocatorControlDescriptor = {
  tagName: string;
  inputType: string;
  value: string;
  label: string;
  text: string;
  ariaLabel: string;
  placeholder: string;
};

export type UploadResumeArtifactOptions = {
  page: Page;
  selectors: readonly string[];
  outputDir: string;
  resume: Record<string, unknown>;
  resumeFilePath?: string;
};

export const BOOLEAN_TRUE_ANSWERS = new Set(["1", "checked", "on", "true", "yes"]);
export const BOOLEAN_FALSE_ANSWERS = new Set(["0", "false", "no", "off", "unchecked"]);

export const PLAYWRIGHT_ACTION_TIMEOUT_MS = 5_000;
export const PLAYWRIGHT_RETRY_MAX_ATTEMPTS = 3;
export const PLAYWRIGHT_RETRY_INITIAL_DELAY_MS = 500;

export const RUN_SCREENSHOT_PREFIX = "step";

export const JOB_APPLY_STEP_INDEX = {
  initBrowser: 1,
  followApplyLink: 2,
  detectFields: 3,
  fillName: 4,
  fillEmail: 5,
  fillPhone: 6,
  uploadResume: 7,
  fillCoverLetter: 8,
  fillCustomFields: 9,
  submit: 10,
  verifySubmission: 11,
} as const;
