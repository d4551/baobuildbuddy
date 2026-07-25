import { formDataToResumeData, resumeDataToFormData } from "@bao/shared/utils/resume-transform";
import type { Ref } from "vue";
import type { ComposerTranslation } from "vue-i18n";
import type { NuxtApp } from "#app";
import { settlePromise } from "~/composables/async-flow";
import type { ResumePageActionsInput } from "~/composables/resume-page-actions-contracts";
import { RESUME_EMAIL_PATTERN } from "~/composables/resume-page-bootstrap";
import {
  RESUME_AUTOSAVE_DEBOUNCE_MS,
  RESUME_DESCRIPTION_MIN_CHARS,
  RESUME_SUMMARY_MIN_CHARS,
} from "~/constants/numeric-ui";
import { getErrorMessage } from "~/utils/errors";

type ResumeEditorSupport = {
  progress: ReturnType<typeof useAiEnhancementProgress>;
  resolveReward: ReturnType<typeof useResumeRewardResolver>;
  validate: ReturnType<typeof useResumeFormValidation>;
};

type ResumeActionFeedback = {
  $toast: Pick<NuxtApp["$toast"], "error" | "success">;
  t: ComposerTranslation;
};

type ResumeEnhanceActionInput = Pick<
  ResumePageActionsInput,
  "aiEnhance" | "enhancing" | "formData" | "selectedResumeId"
>;

type ResumeScoreActionInput = Pick<
  ResumePageActionsInput,
  "aiScore" | "analyzeResume" | "scoring" | "selectedResumeId"
>;

type ResumeSaveActionInput = Pick<
  ResumePageActionsInput,
  "formData" | "selectedResumeId" | "updateResume"
>;

export function useAiEnhancementProgress(aiEnhancementStepLabels: Ref<readonly string[]>) {
  const aiEnhancementStepIndex = ref(0);
  let aiEnhancementTimer: number | null = null;

  onUnmounted(() => {
    if (!aiEnhancementTimer) {
      return;
    }
    window.clearInterval(aiEnhancementTimer);
    aiEnhancementTimer = null;
  });

  function startAiEnhancementProgress(): void {
    aiEnhancementStepIndex.value = 0;
    if (aiEnhancementTimer) {
      window.clearInterval(aiEnhancementTimer);
    }
    aiEnhancementTimer = window.setInterval(() => {
      if (aiEnhancementStepIndex.value < aiEnhancementStepLabels.value.length - 1) {
        aiEnhancementStepIndex.value += 1;
      }
    }, RESUME_AUTOSAVE_DEBOUNCE_MS);
  }

  function stopAiEnhancementProgress(): void {
    if (aiEnhancementTimer) {
      window.clearInterval(aiEnhancementTimer);
      aiEnhancementTimer = null;
    }
    aiEnhancementStepIndex.value = 0;
  }

  return {
    aiEnhancementStepIndex,
    startAiEnhancementProgress,
    stopAiEnhancementProgress,
  };
}

export function useResumeRewardResolver(
  awardForAction: ResumePageActionsInput["awardForAction"],
  t: ComposerTranslation,
) {
  return async (action: "resumeSave" | "resumeEnhance"): Promise<number | null> => {
    const rewardResult = await settlePromise(
      awardForAction(action),
      t("apiErrors.gamification.awardXPFailed"),
    );
    if (!rewardResult.ok) {
      return null;
    }
    return rewardResult.value.awarded ? rewardResult.value.amount : null;
  };
}

export function useResumeFormValidation(
  formData: ResumePageActionsInput["formData"],
  nuxtApp: Pick<NuxtApp, "$toast">,
  t: ComposerTranslation,
) {
  const { $toast } = nuxtApp;

  function validateResumeForm(): boolean {
    if (formData.name.trim().length < 2) {
      $toast.error(t("resumePage.toasts.nameMinLength"));
      return false;
    }
    if (!RESUME_EMAIL_PATTERN.test(formData.email.trim())) {
      $toast.error(t("resumePage.toasts.invalidEmail"));
      return false;
    }
    if (formData.summary.trim().length < RESUME_SUMMARY_MIN_CHARS) {
      $toast.error(t("resumePage.toasts.summaryMinLength"));
      return false;
    }

    const hasInvalidExperience = formData.experience.some(
      (item) =>
        item.title.trim().length < 2 ||
        item.company.trim().length < 2 ||
        item.description.trim().length < RESUME_DESCRIPTION_MIN_CHARS,
    );
    if (hasInvalidExperience) {
      $toast.error(t("resumePage.toasts.invalidExperience"));
      return false;
    }

    const hasInvalidEducation = formData.education.some(
      (item) => item.degree.trim().length < 2 || item.school.trim().length < 2,
    );
    if (hasInvalidEducation) {
      $toast.error(t("resumePage.toasts.invalidEducation"));
      return false;
    }

    const hasInvalidProjects = formData.projects.some(
      (item) =>
        item.name.trim().length < 2 ||
        item.description.trim().length < RESUME_DESCRIPTION_MIN_CHARS,
    );
    if (hasInvalidProjects) {
      $toast.error(t("resumePage.toasts.invalidProjects"));
      return false;
    }

    return true;
  }

  return { validateResumeForm };
}

export function useResumeEditorActions(
  input: Pick<
    ResumePageActionsInput,
    | "aiEnhance"
    | "aiScore"
    | "analyzeResume"
    | "enhancing"
    | "formData"
    | "scoring"
    | "selectedResumeId"
    | "updateResume"
  >,
  support: ResumeEditorSupport,
  feedback: { nuxtApp: Pick<NuxtApp, "$toast">; t: ComposerTranslation },
) {
  const { $toast } = feedback.nuxtApp;
  const { t } = feedback;

  const handleAIEnhance = createResumeEnhanceAction(input, support, { $toast, t });
  const handleAIScore = createResumeScoreAction(input, { $toast, t });
  const handleSave = createResumeSaveAction(input, support, { $toast, t });

  return {
    handleAIEnhance,
    handleAIScore,
    handleSave,
  };
}

function createResumeEnhanceAction(
  input: ResumeEnhanceActionInput,
  support: ResumeEditorSupport,
  feedback: ResumeActionFeedback,
) {
  return async function handleAIEnhance(): Promise<void> {
    if (!input.selectedResumeId.value) {
      return;
    }

    input.enhancing.value = true;
    support.progress.startAiEnhancementProgress();
    const enhanceResult = await settlePromise(
      input.aiEnhance(input.selectedResumeId.value),
      feedback.t("resumePage.toasts.resumeEnhanceFailed"),
    );
    support.progress.stopAiEnhancementProgress();
    input.enhancing.value = false;

    if (!enhanceResult.ok) {
      feedback.$toast.error(
        getErrorMessage(enhanceResult.error, feedback.t("resumePage.toasts.resumeEnhanceFailed")),
      );
      return;
    }

    Object.assign(input.formData, resumeDataToFormData(enhanceResult.value));
    const reward = await support.resolveReward("resumeEnhance");
    feedback.$toast.success(
      reward
        ? feedback.t("resumePage.toasts.resumeEnhancedWithXp", { xp: reward })
        : feedback.t("resumePage.toasts.resumeEnhanced"),
    );
  };
}

function createResumeScoreAction(input: ResumeScoreActionInput, feedback: ResumeActionFeedback) {
  return async function handleAIScore(): Promise<void> {
    if (!input.selectedResumeId.value) {
      return;
    }

    input.scoring.value = true;
    const scoreSubmission = await settlePromise(
      input.aiScore(input.selectedResumeId.value, ""),
      feedback.t("resumePage.toasts.resumeScoreFailed"),
    );
    input.scoring.value = false;

    if (!scoreSubmission.ok) {
      feedback.$toast.error(
        getErrorMessage(scoreSubmission.error, feedback.t("resumePage.toasts.resumeScoreFailed")),
      );
      return;
    }

    await settlePromise(
      input.analyzeResume(input.selectedResumeId.value),
      feedback.t("apiErrors.ai.analyzeResumeFailed"),
    );
    feedback.$toast.success(feedback.t("resumePage.toasts.resumeScored"));
  };
}

function createResumeSaveAction(
  input: ResumeSaveActionInput,
  support: Pick<ResumeEditorSupport, "resolveReward" | "validate">,
  feedback: ResumeActionFeedback,
) {
  return async function handleSave(): Promise<void> {
    const resumeId = input.selectedResumeId.value;
    if (!(resumeId && support.validate.validateResumeForm())) {
      return;
    }

    const saveResult = await settlePromise(
      (async () => {
        await input.updateResume(resumeId, formDataToResumeData(input.formData));
        return support.resolveReward("resumeSave");
      })(),
      feedback.t("resumePage.toasts.resumeSaveFailed"),
    );
    if (!saveResult.ok) {
      feedback.$toast.error(
        getErrorMessage(saveResult.error, feedback.t("resumePage.toasts.resumeSaveFailed")),
      );
      return;
    }

    const reward = saveResult.value;
    feedback.$toast.success(
      reward
        ? feedback.t("resumePage.toasts.resumeSavedWithXp", { xp: reward })
        : feedback.t("resumePage.toasts.resumeSaved"),
    );
  };
}
