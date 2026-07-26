import { MS_PER_SECOND } from "@bao/shared/constants/time";
import type { JobApplyScriptEnvelope } from "@bao/shared/schemas/automation-scripts.schema";
import type { RpaRunResult } from "@bao/shared/schemas/rpa-events.schema";
import { DEFAULT_AUTOMATION_SETTINGS } from "@bao/shared/types/settings-defaults";
import {
  automationBrowserLaunchFailureToDetails,
  formatAutomationBrowserLaunchFailureMessage,
} from "@bao/shared/utils/automation-browser-launch-failure";
import { settle } from "@bao/shared/utils/promise";
import type { Page } from "playwright";
import { closeAutomationBrowser, launchAutomationBrowser } from "../runtime/browser";
import { automationRuntimeConfig } from "../runtime/config";
import type { ProtocolEmitter } from "../runtime/protocol";
import {
  addStep,
  buildOutputDirectory,
  captureScreenshot,
  createArtifacts,
} from "./runtime-artifacts";
import {
  JOB_APPLY_STEP_INDEX,
  type JobApplyExecutionState,
  type StepRecord,
} from "./runtime-contracts";
import { APPLY_LINK_SELECTOR, withRetry } from "./runtime-locators";
import type { JobApplyStrategy } from "./strategy-registry";
import { JOB_APPLY_TOTAL_STEPS, resolveJobApplyStrategy } from "./strategy-registry";

/** Fallback marker probe for unparseable URLs (canonical path check needs a URL). */
const HOSTED_APPLY_ERROR_QUERY_PATTERN = /[?&]error=true\b/i;

/** Hosted ATS pages that signal a dead/invalid posting or apply failure. */
export const isHostedApplyErrorUrl = (url: string): boolean => {
  if (!URL.canParse(url)) {
    return HOSTED_APPLY_ERROR_QUERY_PATTERN.test(url);
  }
  const parsed = new URL(url);
  if (parsed.searchParams.get("error") === "true") return true;
  const path = parsed.pathname.toLowerCase();
  return path.includes("/error") || path.endsWith("/404");
};

const CRITICAL_SUCCESS_ACTIONS = new Set([
  "fill_name",
  "fill_email",
  "upload_resume",
  "submit",
  "verify",
]);

/** Fail-closed outcome from step ledger — never invent success. */
export const resolveJobApplyRunOutcome = (
  steps: readonly StepRecord[],
): { success: boolean; error: string | null } => {
  const criticalErrors = steps.filter(
    (step) => step.status === "error" && CRITICAL_SUCCESS_ACTIONS.has(step.action),
  );
  if (criticalErrors.length > 0) {
    const first = criticalErrors[0];
    return {
      success: false,
      error: first?.message?.trim() || `Job apply failed at ${first?.action ?? "unknown"}`,
    };
  }
  const anyError = steps.find((step) => step.status === "error");
  if (anyError) {
    return {
      success: false,
      error: anyError.message?.trim() || `Job apply failed at ${anyError.action}`,
    };
  }
  return { success: true, error: null };
};

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

type FollowApplyLinkOutcome =
  | { readonly kind: "already_hosted"; readonly url: string }
  | { readonly kind: "followed"; readonly url: string }
  | { readonly kind: "no_link"; readonly url: string }
  | { readonly kind: "nav_failed"; readonly url: string; readonly href: string };

/** Exported for unit tests — listing→hosted apply hop honesty. */
export const detectAndFollowHostedApplyPage = async (
  page: Page,
): Promise<FollowApplyLinkOutcome> => {
  const currentUrl = page.url();
  if (currentUrl.includes("greenhouse.io") || currentUrl.includes("lever.co")) {
    return { kind: "already_hosted", url: currentUrl };
  }

  const locator = page.locator(APPLY_LINK_SELECTOR).first();
  const countResult = await settle(locator.count());
  if (countResult.status === "rejected" || countResult.value === 0) {
    return { kind: "no_link", url: currentUrl };
  }

  const hrefResult = await settle(locator.getAttribute("href"));
  if (hrefResult.status === "rejected" || !hrefResult.value) {
    return { kind: "no_link", url: currentUrl };
  }

  const href = hrefResult.value;
  const isKnownHostedApplyPage =
    href.includes("greenhouse") || href.includes("lever") || href.includes("apply");
  if (!isKnownHostedApplyPage) {
    return { kind: "no_link", url: currentUrl };
  }

  const navigateResult = await settle(
    page.goto(href, {
      waitUntil: "domcontentloaded",
      timeout: automationRuntimeConfig.navigationTimeoutMs,
    }),
  );
  if (navigateResult.status === "rejected") {
    return { kind: "nav_failed", url: page.url(), href };
  }
  await settle(
    page.waitForLoadState("domcontentloaded", {
      timeout: automationRuntimeConfig.secondaryNavigationDelayMs,
    }),
  );
  return { kind: "followed", url: page.url() };
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

  const launchResult = await launchAutomationBrowser(
    payload.settings ?? DEFAULT_AUTOMATION_SETTINGS,
  );
  if (!launchResult.ok) {
    emitter.emitError(
      "AUTOMATION_RUNTIME_ERROR",
      formatAutomationBrowserLaunchFailureMessage(launchResult.failure),
      automationBrowserLaunchFailureToDetails(launchResult.failure),
    );
    return null;
  }

  return {
    emitter,
    payload,
    outputDir,
    session: launchResult.session,
    steps: [],
    screenshots: [],
  };
};

const navigateToJobPosting = async (state: JobApplyExecutionState): Promise<number | null> => {
  const timeoutMs = Math.max(
    state.payload.settings.defaultTimeout * MS_PER_SECOND,
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

  await settle(
    state.session.page.waitForLoadState("domcontentloaded", {
      timeout: automationRuntimeConfig.pageSettleDelayMs,
    }),
  );
  const loadedUrl = state.session.page.url();
  if (isHostedApplyErrorUrl(loadedUrl)) {
    return closeWithRuntimeFailure(
      state,
      `Job URL resolved to an error landing page: ${loadedUrl}`,
      JOB_APPLY_STEP_INDEX.initBrowser,
    );
  }
  addStep(state.steps, "navigate", "ok", `Loaded ${state.payload.jobUrl}`);
  await captureScreenshot({
    page: state.session.page,
    outputDir: state.outputDir,
    autoSaveScreenshots: state.payload.settings.autoSaveScreenshots,
    screenshots: state.screenshots,
    steps: state.steps,
    label: "Loaded job page",
  });
  return null;
};

const followHostedApplyLink = async (state: JobApplyExecutionState): Promise<number | null> => {
  emitProgress(state.emitter, "follow_apply_link", JOB_APPLY_STEP_INDEX.followApplyLink);
  const followOutcome = await detectAndFollowHostedApplyPage(state.session.page);
  if (followOutcome.kind === "nav_failed") {
    return closeWithRuntimeFailure(
      state,
      `Unable to follow hosted apply link: ${followOutcome.href}`,
      JOB_APPLY_STEP_INDEX.followApplyLink,
    );
  }
  if (isHostedApplyErrorUrl(followOutcome.url)) {
    return closeWithRuntimeFailure(
      state,
      `Hosted apply page is an error landing: ${followOutcome.url}`,
      JOB_APPLY_STEP_INDEX.followApplyLink,
    );
  }
  if (followOutcome.kind === "already_hosted") {
    addStep(
      state.steps,
      "follow_apply_link",
      "ok",
      `Already on hosted apply page: ${followOutcome.url}`,
    );
  } else if (followOutcome.kind === "followed") {
    addStep(state.steps, "follow_apply_link", "ok", `Followed apply link to ${followOutcome.url}`);
  } else {
    addStep(
      state.steps,
      "follow_apply_link",
      "skipped",
      `No hosted apply link found; continuing on listing page: ${followOutcome.url}`,
    );
  }
  return null;
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

  const navigateFailure = await navigateToJobPosting(state);
  if (navigateFailure !== null) {
    return navigateFailure;
  }

  const followFailure = await followHostedApplyLink(state);
  if (followFailure !== null) {
    return followFailure;
  }

  const formReady = await ensureApplicationFormVisible(state.session.page);
  if (!formReady) {
    addStep(
      state.steps,
      "open_application_form",
      "error",
      "Application form fields not available after Apply affordance",
    );
    return closeWithRuntimeFailure(
      state,
      "Unable to open application form on hosted job page.",
      JOB_APPLY_STEP_INDEX.followApplyLink,
    );
  }
  addStep(state.steps, "open_application_form", "ok", "Application form fields visible");
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

/**
 * Persist terminal RPA result from the step ledger. Success only when no step errors.
 * Always exit 0 after a valid protocol result — `result.success` is the honesty gate
 * (non-zero exit is treated as a transport failure by the server runner).
 */
export const finalizeSuccessfulRun = async (state: JobApplyExecutionState): Promise<number> => {
  await closeAutomationBrowser(state.session);
  const outcome = resolveJobApplyRunOutcome(state.steps);
  state.emitter.emitResult(
    buildResult(outcome.success, outcome.error, state.screenshots, state.steps),
  );
  return 0;
};

/** Click on-page Apply when form fields are collapsed (new Greenhouse boards). */
export const ensureApplicationFormVisible = async (page: Page): Promise<boolean> => {
  const firstName = page.locator("#first_name, input[name='job_application[first_name]']").first();
  const alreadyVisible = await settle(firstName.count());
  if (alreadyVisible.status === "fulfilled" && alreadyVisible.value > 0) {
    const visible = await settle(firstName.isVisible());
    if (visible.status === "fulfilled" && visible.value) {
      return true;
    }
  }

  const applyButton = page.locator("button:has-text('Apply'), a:has-text('Apply')").first();
  const applyCount = await settle(applyButton.count());
  if (applyCount.status === "fulfilled" && applyCount.value > 0) {
    await settle(applyButton.click({ timeout: 5_000 }));
    await Bun.sleep(automationRuntimeConfig.pageSettleDelayMs);
  }

  const afterClick = await settle(firstName.count());
  if (afterClick.status !== "fulfilled" || afterClick.value === 0) {
    // Generic boards may not use Greenhouse ids — allow continue when any text input exists.
    const anyField = await settle(
      page.evaluate(() => document.querySelectorAll("input[type='text'], input[type='email']").length),
    );
    return anyField.status === "fulfilled" && anyField.value > 0;
  }
  const visibleAfter = await settle(firstName.isVisible());
  return visibleAfter.status === "fulfilled" && visibleAfter.value;
};
