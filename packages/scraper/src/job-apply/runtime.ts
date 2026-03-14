import {
  DEFAULT_AUTOMATION_SETTINGS,
  jobApplyScriptEnvelopeSchema,
  settle,
  type JobApplyScriptEnvelope,
  type RpaRunResult,
} from "@bao/shared";
import { mkdir } from "fs/promises";
import { basename, join } from "path";
import type { Locator, Page } from "playwright";
import {
  closeAutomationBrowser,
  launchAutomationBrowser,
  type AutomationBrowserSession,
} from "../runtime/browser";
import { automationRuntimeConfig } from "../runtime/config";
import { parseScriptInput } from "../runtime/io";
import { ProtocolEmitter } from "../runtime/protocol";
import {
  JOB_APPLY_CONFIRMATION_PHRASES,
  JOB_APPLY_TOTAL_STEPS,
  resolveJobApplyAdapter,
  type JobApplyAdapter,
  type JobApplySelectorBundle,
} from "./adapters";

type StepStatus = "ok" | "error";

type StepRecord = {
  action: string;
  status: StepStatus;
  message?: string;
};

type ResumeCandidateFields = {
  fullName: string;
  email: string;
  phone: string;
};

type JobApplyExecutionState = {
  emitter: ProtocolEmitter;
  payload: JobApplyScriptEnvelope;
  outputDir: string;
  session: AutomationBrowserSession;
  steps: StepRecord[];
  screenshots: string[];
};

type CaptureScreenshotOptions = {
  page: Page;
  outputDir: string;
  autoSaveScreenshots: boolean;
  screenshots: string[];
  steps: StepRecord[];
  label: string;
};

type FillTextFieldStepOptions = {
  state: JobApplyExecutionState;
  adapter: JobApplyAdapter;
  selectorKey: keyof JobApplySelectorBundle;
  action: string;
  step: number;
  value: string;
  emptyMessage: string;
  missingMessage: string;
};

type SelectorMapInput = JobApplyScriptEnvelope["selectorMap"];

const anchorSelectorByText = (text: string): string => `a:has-text('${text}')`;

const anchorSelectorByHrefFragment = (fragment: string): string => `a[href*='${fragment}']`;

const inputSelectorByName = (fieldName: string): string => `input[name='${fieldName}']`;

const inputSelectorById = (fieldId: string): string => `input[id='${fieldId}']`;

const textareaSelectorByName = (fieldName: string): string => `textarea[name='${fieldName}']`;

const textareaSelectorById = (fieldId: string): string => `textarea[id='${fieldId}']`;

const selectSelectorByName = (fieldName: string): string => `select[name='${fieldName}']`;

const selectSelectorById = (fieldId: string): string => `select[id='${fieldId}']`;

const APPLY_LINK_SELECTOR = [
  anchorSelectorByText("Apply"),
  anchorSelectorByHrefFragment(["boards", "greenhouse", "io"].join(".")),
  anchorSelectorByHrefFragment(["jobs", "lever", "co"].join(".")),
  anchorSelectorByHrefFragment("apply"),
].join(", ");

const JOB_APPLY_STEP_INDEX = {
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

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

const collectResumeCandidateFields = (resume: Record<string, unknown>): ResumeCandidateFields => {
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

const flattenJsonStrings = (value: unknown): string[] => {
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

const addStep = (
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

const createArtifacts = (screenshots: string[]) =>
  screenshots.map((screenshotPath, index) => ({
    id: `screenshot-${String(index + 1).padStart(2, "0")}`,
    kind: "screenshot" as const,
    path: screenshotPath,
    label: basename(screenshotPath),
    mimeType: "image/png",
  }));

const buildOutputDirectory = async (payload: JobApplyScriptEnvelope): Promise<string | null> => {
  const outputDir = payload.outputDir?.trim();
  if (outputDir) {
    const directoryResult = await settle(mkdir(outputDir, { recursive: true }));
    return directoryResult.status === "fulfilled" ? outputDir : null;
  }

  const fallbackDirectory = join(process.cwd(), "tmp", "automation", payload.runId);
  const fallbackResult = await settle(mkdir(fallbackDirectory, { recursive: true }));
  return fallbackResult.status === "fulfilled" ? fallbackDirectory : null;
};

const getCustomSelectorList = (selectorMap: SelectorMapInput, key: string): string[] => {
  const selectors = selectorMap[key];
  return Array.isArray(selectors) ? selectors.filter((selector) => selector.trim().length > 0) : [];
};

const getCustomFieldSelectorList = (fieldKey: string): string[] => [
  textareaSelectorByName(fieldKey),
  inputSelectorByName(fieldKey),
  selectSelectorByName(fieldKey),
  textareaSelectorById(fieldKey),
  inputSelectorById(fieldKey),
  selectSelectorById(fieldKey),
];

const runOnFirstMatchingLocator = async <T>(
  page: Page,
  selectors: readonly string[],
  action: (locator: Locator) => Promise<T | null>,
): Promise<T | null> => {
  const [selector, ...remainingSelectors] = selectors;
  if (!selector) {
    return null;
  }

  const locator = page.locator(selector).first();
  const countResult = await settle(locator.count());
  if (countResult.status === "fulfilled" && countResult.value > 0) {
    const actionResult = await action(locator);
    if (actionResult !== null) {
      return actionResult;
    }
  }

  return runOnFirstMatchingLocator(page, remainingSelectors, action);
};

const fillFirstMatchingField = async (
  page: Page,
  selectors: readonly string[],
  value: string,
): Promise<boolean> => {
  if (value.trim().length === 0) {
    return false;
  }

  const fillResult = await runOnFirstMatchingLocator(page, selectors, async (locator) => {
    const matchingResult = await settle(locator.fill(value, { timeout: 5_000 }));
    return matchingResult.status === "fulfilled" ? true : null;
  });
  return fillResult ?? false;
};

const clickFirstMatchingField = async (
  page: Page,
  selectors: readonly string[],
): Promise<boolean> => {
  const clickResult = await runOnFirstMatchingLocator(page, selectors, async (locator) => {
    const matchingResult = await settle(locator.click({ timeout: 5_000 }));
    return matchingResult.status === "fulfilled" ? true : null;
  });
  return clickResult ?? false;
};

const uploadResumeArtifact = async (
  page: Page,
  selectors: readonly string[],
  outputDir: string,
  resume: Record<string, unknown>,
): Promise<boolean> => {
  const artifactPath = join(outputDir, "resume.json");
  const writeResult = await settle(Bun.write(artifactPath, JSON.stringify(resume, null, 2)));
  if (writeResult.status === "rejected") {
    return false;
  }

  const uploadResult = await runOnFirstMatchingLocator(page, selectors, async (locator) => {
    const matchingResult = await settle(locator.setInputFiles(artifactPath));
    return matchingResult.status === "fulfilled" ? true : null;
  });
  return uploadResult ?? false;
};

const captureScreenshot = async ({
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
    `step-${String(screenshots.length + 1).padStart(2, "0")}.png`,
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

const getAdapterSelectorList = (
  adapter: JobApplyAdapter,
  selectorMap: SelectorMapInput,
  key: keyof JobApplySelectorBundle,
): string[] => [...getCustomSelectorList(selectorMap, key), ...adapter.selectors[key]];

const createExecutionState = async (
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

const closeWithRuntimeFailure = async (
  state: JobApplyExecutionState,
  message: string,
  step: number,
): Promise<number> => {
  await closeAutomationBrowser(state.session);
  return emitRuntimeFailure(state.emitter, state.steps, message, step);
};

const initializeApplicationPage = async (state: JobApplyExecutionState): Promise<number | null> => {
  emitProgress(
    state.emitter,
    "init_browser",
    JOB_APPLY_STEP_INDEX.initBrowser,
    "Launching Chromium session",
  );
  addStep(state.steps, "init", "ok", `headless=${String(state.payload.settings.headless)}`);

  const navigateResult = await settle(
    state.session.page.goto(state.payload.jobUrl, {
      waitUntil: "domcontentloaded",
      timeout: Math.max(
        state.payload.settings.defaultTimeout * 1_000,
        automationRuntimeConfig.navigationTimeoutMs,
      ),
    }),
  );
  if (navigateResult.status === "rejected") {
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

const detectAdapter = async (state: JobApplyExecutionState): Promise<JobApplyAdapter> => {
  emitProgress(state.emitter, "detect_fields", JOB_APPLY_STEP_INDEX.detectFields);
  const adapter = resolveJobApplyAdapter(state.session.page.url());
  const fieldCount = await countFormFields(state.session.page);
  addStep(
    state.steps,
    "detect_fields",
    "ok",
    `Detected ${String(fieldCount)} form fields via ${adapter.id}`,
  );
  return adapter;
};

const fillNamedFields = async (
  state: JobApplyExecutionState,
  adapter: JobApplyAdapter,
  resumeFields: ResumeCandidateFields,
): Promise<void> => {
  emitProgress(state.emitter, "fill_name", JOB_APPLY_STEP_INDEX.fillName);
  const fullNameParts = resumeFields.fullName.split(" ").filter((part) => part.trim().length > 0);
  const primaryName = fullNameParts[0] ?? resumeFields.fullName;
  const nameFilled =
    adapter.id === "greenhouse"
      ? await fillFirstMatchingField(
          state.session.page,
          getAdapterSelectorList(adapter, state.payload.selectorMap, "firstName"),
          primaryName,
        )
      : await fillFirstMatchingField(
          state.session.page,
          getAdapterSelectorList(adapter, state.payload.selectorMap, "fullName"),
          resumeFields.fullName,
        );

  const lastName = fullNameParts.slice(1).join(" ").trim();
  if (adapter.id === "greenhouse" && lastName.length > 0) {
    await fillFirstMatchingField(
      state.session.page,
      getAdapterSelectorList(adapter, state.payload.selectorMap, "lastName"),
      lastName,
    );
  }

  addStep(
    state.steps,
    "fill_name",
    nameFilled ? "ok" : "error",
    nameFilled ? resumeFields.fullName : "Name field not found",
  );
};

const fillTextFieldStep = async ({
  state,
  adapter,
  selectorKey,
  action,
  step,
  value,
  emptyMessage,
  missingMessage,
}: FillTextFieldStepOptions): Promise<void> => {
  emitProgress(state.emitter, action, step);
  const filled =
    value.trim().length > 0
      ? await fillFirstMatchingField(
          state.session.page,
          getAdapterSelectorList(adapter, state.payload.selectorMap, selectorKey),
          value,
        )
      : false;

  addStep(
    state.steps,
    action,
    value.trim().length === 0 || filled ? "ok" : "error",
    value.trim().length === 0 ? emptyMessage : filled ? undefined : missingMessage,
  );
};

const uploadResumeStep = async (
  state: JobApplyExecutionState,
  adapter: JobApplyAdapter,
): Promise<void> => {
  emitProgress(state.emitter, "upload_resume", JOB_APPLY_STEP_INDEX.uploadResume);
  const resumeUploaded = await uploadResumeArtifact(
    state.session.page,
    getAdapterSelectorList(adapter, state.payload.selectorMap, "resume"),
    state.outputDir,
    state.payload.resume,
  );
  addStep(
    state.steps,
    "upload_resume",
    resumeUploaded ? "ok" : "error",
    resumeUploaded ? undefined : "Resume upload field not found",
  );
};

const fillCustomFieldsRecursively = async (
  state: JobApplyExecutionState,
  entries: readonly [string, string][],
  index = 0,
): Promise<void> => {
  const entry = entries[index];
  if (!entry) {
    return;
  }

  const [key, value] = entry;
  const customFieldFilled = await fillFirstMatchingField(
    state.session.page,
    getCustomFieldSelectorList(key),
    value,
  );
  addStep(
    state.steps,
    `fill_${key}`,
    customFieldFilled ? "ok" : "error",
    customFieldFilled ? undefined : `Field ${key} not found`,
  );
  return fillCustomFieldsRecursively(state, entries, index + 1);
};

const fillPrimaryFields = async (
  state: JobApplyExecutionState,
  adapter: JobApplyAdapter,
  resumeFields: ResumeCandidateFields,
  coverLetterText: string,
): Promise<void> => {
  await fillNamedFields(state, adapter, resumeFields);
  await fillTextFieldStep({
    state,
    adapter,
    selectorKey: "email",
    action: "fill_email",
    step: JOB_APPLY_STEP_INDEX.fillEmail,
    value: resumeFields.email,
    emptyMessage: "No email supplied",
    missingMessage: "Email field not found",
  });
  await fillTextFieldStep({
    state,
    adapter,
    selectorKey: "phone",
    action: "fill_phone",
    step: JOB_APPLY_STEP_INDEX.fillPhone,
    value: resumeFields.phone,
    emptyMessage: "No phone supplied",
    missingMessage: "Phone field not found",
  });
  await uploadResumeStep(state, adapter);
  await fillTextFieldStep({
    state,
    adapter,
    selectorKey: "coverLetter",
    action: "fill_cover_letter",
    step: JOB_APPLY_STEP_INDEX.fillCoverLetter,
    value: coverLetterText,
    emptyMessage: "No cover letter content supplied",
    missingMessage: "Cover-letter field not found",
  });
};

const fillCustomFieldsStep = async (state: JobApplyExecutionState): Promise<void> => {
  emitProgress(state.emitter, "fill_custom_fields", JOB_APPLY_STEP_INDEX.fillCustomFields);
  await fillCustomFieldsRecursively(state, Object.entries(state.payload.customAnswers));
  await captureScreenshot({
    page: state.session.page,
    outputDir: state.outputDir,
    autoSaveScreenshots: state.payload.settings.autoSaveScreenshots,
    screenshots: state.screenshots,
    steps: state.steps,
    label: "Filled form fields",
  });
};

const submitApplicationStep = async (
  state: JobApplyExecutionState,
  adapter: JobApplyAdapter,
): Promise<void> => {
  emitProgress(state.emitter, "submit", JOB_APPLY_STEP_INDEX.submit);
  const submitted = await clickFirstMatchingField(
    state.session.page,
    getAdapterSelectorList(adapter, state.payload.selectorMap, "submit"),
  );
  if (!submitted) {
    await settle(state.session.page.keyboard.press("Enter"));
  }
  addStep(state.steps, "submit", "ok", submitted ? undefined : "Submitted via keyboard");
  await settle(state.session.page.waitForTimeout(automationRuntimeConfig.postSubmitDelayMs));
};

const verifySubmissionStep = async (state: JobApplyExecutionState): Promise<void> => {
  emitProgress(state.emitter, "verify_submission", JOB_APPLY_STEP_INDEX.verifySubmission);
  await captureScreenshot({
    page: state.session.page,
    outputDir: state.outputDir,
    autoSaveScreenshots: state.payload.settings.autoSaveScreenshots,
    screenshots: state.screenshots,
    steps: state.steps,
    label: "Final state",
  });

  const bodyTextResult = await settle(state.session.page.locator("body").innerText());
  const bodyText = bodyTextResult.status === "fulfilled" ? bodyTextResult.value.toLowerCase() : "";
  const confirmed = JOB_APPLY_CONFIRMATION_PHRASES.some((phrase) => bodyText.includes(phrase));
  addStep(
    state.steps,
    "verify",
    "ok",
    confirmed ? "Submission confirmation detected" : "No confirmation text detected",
  );
};

const finalizeSuccessfulRun = async (state: JobApplyExecutionState): Promise<number> => {
  await closeAutomationBrowser(state.session);
  state.emitter.emitResult(buildResult(true, null, state.screenshots, state.steps));
  return 0;
};

/**
 * Executes the Bun-based job-apply runtime using shared contracts.
 *
 * @returns Process exit code.
 */
export const runJobApplyAutomation = async (): Promise<number> => {
  const inputResult = await parseScriptInput(jobApplyScriptEnvelopeSchema);
  const runId = inputResult.ok ? inputResult.value.runId : "run-missing-id";
  const emitter = new ProtocolEmitter(runId);

  if (!inputResult.ok) {
    emitter.emitError("OUTPUT_VALIDATION_ERROR", inputResult.message);
    return 1;
  }

  const state = await createExecutionState(inputResult.value, emitter);
  if (!state) {
    return 1;
  }

  const initializeResult = await initializeApplicationPage(state);
  if (initializeResult !== null) {
    return initializeResult;
  }

  const adapter = await detectAdapter(state);
  const resumeFields = collectResumeCandidateFields(state.payload.resume);
  const coverLetterText = flattenJsonStrings(state.payload.coverLetter?.content)
    .join("\n\n")
    .trim();

  await fillPrimaryFields(state, adapter, resumeFields, coverLetterText);
  await fillCustomFieldsStep(state);
  await submitApplicationStep(state, adapter);
  await verifySubmissionStep(state);
  return finalizeSuccessfulRun(state);
};
