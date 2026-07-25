import {
  addStep,
  captureScreenshot,
  collectResumeCandidateFields,
  flattenJsonStrings,
  uploadResumeArtifact,
} from "./runtime-artifacts";
import type {
  FillTextFieldStepOptions,
  JobApplyExecutionState,
  ResumeCandidateFields,
} from "./runtime-contracts";
import { JOB_APPLY_STEP_INDEX } from "./runtime-contracts";
import {
  fillFirstMatchingAnswer,
  fillFirstMatchingField,
  getCustomFieldSelectorList,
} from "./runtime-locators";
import { getStrategySelectorList } from "./runtime-selector-map";
import type { JobApplyStrategy } from "./strategy-registry";
import { JOB_APPLY_TOTAL_STEPS } from "./strategy-registry";

const emitProgress = (state: JobApplyExecutionState, action: string, step: number): void => {
  state.emitter.emitProgress({
    action,
    status: "running",
    step,
    totalSteps: JOB_APPLY_TOTAL_STEPS,
  });
};

const fillNamedFields = async (
  state: JobApplyExecutionState,
  strategy: JobApplyStrategy,
  resumeFields: ResumeCandidateFields,
): Promise<void> => {
  emitProgress(state, "fill_name", JOB_APPLY_STEP_INDEX.fillName);
  const fullNameParts = resumeFields.fullName.split(" ").filter((part) => part.trim().length > 0);
  const primaryName = fullNameParts[0] ?? resumeFields.fullName;
  const nameFilled =
    strategy.id === "greenhouse"
      ? await fillFirstMatchingField(
          state.session.page,
          getStrategySelectorList(strategy, state.payload.selectorMap, "firstName"),
          primaryName,
        )
      : await fillFirstMatchingField(
          state.session.page,
          getStrategySelectorList(strategy, state.payload.selectorMap, "fullName"),
          resumeFields.fullName,
        );

  const lastName = fullNameParts.slice(1).join(" ").trim();
  if (strategy.id === "greenhouse" && lastName.length > 0) {
    await fillFirstMatchingField(
      state.session.page,
      getStrategySelectorList(strategy, state.payload.selectorMap, "lastName"),
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
  strategy,
  selectorKey,
  action,
  step,
  value,
  emptyMessage,
  missingMessage,
}: FillTextFieldStepOptions): Promise<void> => {
  emitProgress(state, action, step);
  const filled =
    value.trim().length > 0
      ? await fillFirstMatchingField(
          state.session.page,
          getStrategySelectorList(strategy, state.payload.selectorMap, selectorKey),
          value,
        )
      : false;

  const isEmpty = value.trim().length === 0;
  let detail: string | undefined;
  if (isEmpty) {
    detail = emptyMessage;
  } else if (!filled) {
    detail = missingMessage;
  }

  addStep(state.steps, action, isEmpty || filled ? "ok" : "error", detail);
};

const uploadResumeStep = async (
  state: JobApplyExecutionState,
  strategy: JobApplyStrategy,
): Promise<void> => {
  emitProgress(state, "upload_resume", JOB_APPLY_STEP_INDEX.uploadResume);
  const resumeUploaded = await uploadResumeArtifact({
    page: state.session.page,
    selectors: getStrategySelectorList(strategy, state.payload.selectorMap, "resume"),
    outputDir: state.outputDir,
    resume: state.payload.resume,
    resumeFilePath: state.payload.resumeFilePath,
  });
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
  const customFieldFilled = await fillFirstMatchingAnswer(
    state.session.page,
    [...(state.payload.selectorMap[key] ?? []), ...getCustomFieldSelectorList(key)],
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

export const fillPrimaryFields = async (
  state: JobApplyExecutionState,
  strategy: JobApplyStrategy,
): Promise<void> => {
  const resumeFields = collectResumeCandidateFields(state.payload.resume);
  const coverLetterText = flattenJsonStrings(state.payload.coverLetter?.content)
    .join("\n\n")
    .trim();

  await fillNamedFields(state, strategy, resumeFields);
  await fillTextFieldStep({
    state,
    strategy,
    selectorKey: "email",
    action: "fill_email",
    step: JOB_APPLY_STEP_INDEX.fillEmail,
    value: resumeFields.email,
    emptyMessage: "No email supplied",
    missingMessage: "Email field not found",
  });
  await fillTextFieldStep({
    state,
    strategy,
    selectorKey: "phone",
    action: "fill_phone",
    step: JOB_APPLY_STEP_INDEX.fillPhone,
    value: resumeFields.phone,
    emptyMessage: "No phone supplied",
    missingMessage: "Phone field not found",
  });
  await uploadResumeStep(state, strategy);
  await fillTextFieldStep({
    state,
    strategy,
    selectorKey: "coverLetter",
    action: "fill_cover_letter",
    step: JOB_APPLY_STEP_INDEX.fillCoverLetter,
    value: coverLetterText,
    emptyMessage: "No cover letter content supplied",
    missingMessage: "Cover-letter field not found",
  });
};

export const fillCustomFieldsStep = async (state: JobApplyExecutionState): Promise<void> => {
  emitProgress(state, "fill_custom_fields", JOB_APPLY_STEP_INDEX.fillCustomFields);
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
