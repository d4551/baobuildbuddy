import type { JobApplyScriptEnvelope } from "@bao/shared/schemas/automation-scripts.schema";
import type { RpaRunResult } from "@bao/shared/schemas/rpa-events.schema";
import { DEFAULT_AUTOMATION_SETTINGS } from "@bao/shared/types/settings-defaults";
import { settle } from "@bao/shared/utils/promise";
import type { Page } from "playwright";
import { closeAutomationBrowser, launchAutomationBrowser } from "../runtime/browser";
import { automationRuntimeConfig } from "../runtime/config";
import type { ProtocolEmitter } from "../runtime/protocol";
import type { JobApplyStrategy } from "./adapters";
import { APPLY_LINK_SELECTOR, withRetry } from "./runtime-locators";
import {
  addStep,
  buildOutputDirectory,
  captureScreenshot,
  createArtifacts,
} from "./runtime-artifacts";
import {
  type JobApplyExecutionState,
  JOB_APPLY_STEP_INDEX,
  type StepRecord,
} from "./runtime-contracts";
import { resolveJobApplyStrategy, JOB_APPLY_TOTAL_STEPS } from "./adapters";

const buildResult = (
  success: boolean,
  error: string | null,
  screenshots: string[],
  steps: StepRecord[],
): RpaRunResult => ({
  success,
  error,
  screenshots,
  artifacts: createArtifacts(screenshots),
  steps,
});

const emitProgress = (
  emitter: ProtocolEmitter,
  action: string,
  step: number,
  message?: string,
): void => {
  emitter.emitProgress({
    action,
    status: "running",
    step,
    totalSteps: JOB_APPLY_TOTAL_STEPS,
    ...(message ? { message } : {}),
  });
};

const emitRuntimeFailure = (
  emitter: ProtocolEmitter,
  steps: StepRecord[],
  message: string,
  step: number,
): number => {
  addStep(steps, "automation", "error", message);
  emitter.emitError("AUTOMATION_RUNTIME_ERROR", message, {
    step,
    stepCount: steps.length,
  });
  return 1;
};

const detectAndFollowHostedApplyPage = async (page: Page): Promise<void> => {
  const currentUrl = page.url();
  if (currentUrl.includes("greenhouse.io") || currentUrl.includes("lever.co")) {
    return;
  }

  const locator = page.locator(APPLY_LINK_SELECTOR).first();
  const countResult = await settle(locator.count());
  if (countResult.status === "rejected" || countResult.value === 0) {
    return;
  }

  const hrefResult = await settle(locator.getAttribute("href"));
  if (hrefResult.status === "rejected" || !hrefResult.value) {
    return;
  }

  const href = hrefResult.value;
  const isKnownHostedApplyPage =
    href.includes("greenhouse") || href.includes("lever") || href.includes("apply");
  if (!isKnownHostedApplyPage) {
    return;
  }

  await settle(
    page.goto(href, {
      waitUntil: "domcontentloaded",
      timeout: automationRuntimeConfig.navigationTimeoutMs,
    }),
  );
  await settle(page.waitForTimeout(automationRuntimeConfig.secondaryNavigationDelayMs));
};

const countFormFields = async (page: Page): Promise<number> => {
  const fieldCountResult = await settle(
    page.evaluate(() => document.querySelectorAll("input, textarea, select").length),
  );

  return fieldCountResult.status === "fulfilled" ? fieldCountResult.value : 0;
};

const closeWithRuntimeFailure = async (
  state: JobApplyExecutionState,
  message: string,
  step: number,
): Promise<number> => {
  await closeAutomationBrowser(state.session);
  return emitRuntimeFailure(state.emitter, state.steps, message, step);
};

export const createExecutionState = async (
  payload: JobApplyScriptEnvelope,
  emitter: ProtocolEmitter,
): Promise<JobApplyExecutionState | null> => {
  const outputDir = await buildOutputDirectory(payload);
  if (!outputDir) {
    emitter.emitError(
      "OUTPUT_PERSISTENCE_ERROR",
      "Unable to initialize automation output directory.",
    );
    return null;
  }

  const session = await launchAutomationBrowser(payload.settings ?? DEFAULT_AUTOMATION_SETTINGS);
  if (!session) {
    emitter.emitError("AUTOMATION_RUNTIME_ERROR", "Unable to launch automation browser.");
    return null;
  }

  return {
    emitter,
    payload,
    outputDir,
    session,
    steps: [],
    screenshots: [],
  };
};

export const initializeApplicationPage = async (
  state: JobApplyExecutionState,
): Promise<number | null> => {
  emitProgress(
    state.emitter,
    "init_browser",
    JOB_APPLY_STEP_INDEX.initBrowser,
    "Launching Chromium session",
  );
  addStep(state.steps, "init", "ok", `headless=${String(state.payload.settings.headless)}`);

  const timeoutMs = Math.max(
    state.payload.settings.defaultTimeout * 1_000,
    automationRuntimeConfig.navigationTimeoutMs,
  );
  const navigateResult = await withRetry(() =>
    state.session.page.goto(state.payload.jobUrl, {
      waitUntil: "domcontentloaded",
      timeout: timeoutMs,
    }),
  );
  if (navigateResult === null) {
    return closeWithRuntimeFailure(
      state,
      "Unable to load job URL.",
      JOB_APPLY_STEP_INDEX.initBrowser,
    );
  }

  await settle(state.session.page.waitForTimeout(automationRuntimeConfig.pageSettleDelayMs));
  addStep(state.steps, "navigate", "ok", `Loaded ${state.payload.jobUrl}`);
  await captureScreenshot({
    page: state.session.page,
    outputDir: state.outputDir,
    autoSaveScreenshots: state.payload.settings.autoSaveScreenshots,
    screenshots: state.screenshots,
    steps: state.steps,
    label: "Loaded job page",
  });

  emitProgress(state.emitter, "follow_apply_link", JOB_APPLY_STEP_INDEX.followApplyLink);
  await detectAndFollowHostedApplyPage(state.session.page);
  addStep(state.steps, "follow_apply_link", "ok", state.session.page.url());
  return null;
};

export const detectStrategy = async (state: JobApplyExecutionState): Promise<JobApplyStrategy> => {
  emitProgress(state.emitter, "detect_fields", JOB_APPLY_STEP_INDEX.detectFields);
  const strategy = resolveJobApplyStrategy(state.session.page.url());
  const fieldCount = await countFormFields(state.session.page);
  addStep(
    state.steps,
    "detect_fields",
    "ok",
    `Detected ${String(fieldCount)} form fields via ${strategy.id}`,
  );
  return strategy;
};

export const finalizeSuccessfulRun = async (state: JobApplyExecutionState): Promise<number> => {
  await closeAutomationBrowser(state.session);
  state.emitter.emitResult(buildResult(true, null, state.screenshots, state.steps));
  return 0;
};
