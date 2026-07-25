import { settle } from "@bao/shared/utils/promise";
import { automationRuntimeConfig } from "../runtime/config";
import { addStep, captureScreenshot } from "./runtime-artifacts";
import { JOB_APPLY_STEP_INDEX, type JobApplyExecutionState } from "./runtime-contracts";
import { clickFirstMatchingField } from "./runtime-locators";
import { getStrategySelectorList } from "./runtime-selector-map";
import type { JobApplyStrategy } from "./strategy-registry";
import { JOB_APPLY_CONFIRMATION_PHRASES, JOB_APPLY_TOTAL_STEPS } from "./strategy-registry";

const emitProgress = (state: JobApplyExecutionState, action: string, step: number): void => {
  state.emitter.emitProgress({
    action,
    status: "running",
    step,
    totalSteps: JOB_APPLY_TOTAL_STEPS,
  });
};

export const submitApplicationStep = async (
  state: JobApplyExecutionState,
  strategy: JobApplyStrategy,
): Promise<void> => {
  emitProgress(state, "submit", JOB_APPLY_STEP_INDEX.submit);
  const submitted = await clickFirstMatchingField(
    state.session.page,
    getStrategySelectorList(strategy, state.payload.selectorMap, "submit"),
  );
  if (!submitted) {
    await settle(state.session.page.keyboard.press("Enter"));
  }
  addStep(state.steps, "submit", "ok", submitted ? undefined : "Submitted via keyboard");
  // Intentional post-submit budget so confirmation copy can render before verify.
  await Bun.sleep(automationRuntimeConfig.postSubmitDelayMs);
};

export const verifySubmissionStep = async (state: JobApplyExecutionState): Promise<void> => {
  emitProgress(state, "verify_submission", JOB_APPLY_STEP_INDEX.verifySubmission);
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
