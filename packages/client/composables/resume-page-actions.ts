import type { ResumeTemplate } from "@bao/shared/constants/resume";
import type { ResumeFormData } from "@bao/shared/utils/resume-transform";
import type { Ref } from "vue";
import type { ComposerTranslation } from "vue-i18n";
import type { NuxtApp } from "#app";
import { runExportWithToast } from "~/composables/export-with-toast";
import type { ResumePageActionsInput } from "~/composables/resume-page-actions-contracts";
import {
  useAiEnhancementProgress,
  useResumeEditorActions,
  useResumeFormValidation,
  useResumeRewardResolver,
} from "~/composables/resume-page-editor-actions";
import { useResumeMutationActions } from "~/composables/resume-page-mutation-actions";
import { useResumeViewActions } from "~/composables/resume-page-view-actions";

function createResumeActionModules(
  input: ResumePageActionsInput,
  nuxtApp: Pick<NuxtApp, "$toast">,
  t: ComposerTranslation,
) {
  const progress = useAiEnhancementProgress(input.aiEnhancementStepLabels);
  const validate = useResumeFormValidation(input.formData, nuxtApp, t);
  const resolveReward = useResumeRewardResolver(input.awardForAction, t);

  return {
    editor: useResumeEditorActions(
      {
        aiEnhance: input.aiEnhance,
        aiScore: input.aiScore,
        analyzeResume: input.analyzeResume,
        enhancing: input.enhancing,
        formData: input.formData,
        scoring: input.scoring,
        selectedResumeId: input.selectedResumeId,
        updateResume: input.updateResume,
      },
      { progress, resolveReward, validate },
      { nuxtApp, t },
    ),
    mutations: useResumeMutationActions(
      {
        closeDeleteResumeDialog: input.closeDeleteResumeDialog,
        createResume: input.createResume,
        creating: input.creating,
        deleteResume: input.deleteResume,
        newResumeName: input.newResumeName,
        newResumeTemplate: input.newResumeTemplate,
        pendingDeleteResumeId: input.pendingDeleteResumeId,
        selectedResumeId: input.selectedResumeId,
        showCreateModal: input.showCreateModal,
      },
      nuxtApp,
      t,
    ),
    progress,
    view: useResumeViewActions(input.formData),
  };
}

export function useResumePageActions(
  input: ResumePageActionsInput,
  nuxtApp: Pick<NuxtApp, "$toast">,
  t: ComposerTranslation,
) {
  const { $toast } = nuxtApp;
  const { editor, mutations, progress, view } = createResumeActionModules(input, nuxtApp, t);

  async function handleExport(
    exportResume: (
      id: string,
      template?: ResumeTemplate,
      format?: "pdf" | "docx",
    ) => Promise<unknown>,
    format: "pdf" | "docx",
  ): Promise<void> {
    const resumeId = input.selectedResumeId.value;
    if (!resumeId) {
      return;
    }
    await runExportWithToast({
      exportFn: () => exportResume(resumeId, undefined, format),
      failMessage: t("resumePage.toasts.resumeExportFailed"),
      successMessage: t("resumePage.toasts.resumeExported"),
      toast: $toast,
      t,
    });
  }

  return {
    aiEnhancementStepIndex: progress.aiEnhancementStepIndex,
    clearResumeFilters: (resumeSearchQuery: Ref<string>) =>
      view.clearResumeFilters(resumeSearchQuery),
    handleAIEnhance: () => editor.handleAIEnhance(),
    handleAIScore: () => editor.handleAIScore(),
    handleCompletionTabSelect: view.handleCompletionTabSelect,
    handleCreate: () => mutations.handleCreate(),
    handleDeleteResume: () => mutations.handleDeleteResume(),
    handleExport,
    handleSave: () => editor.handleSave(),
    selectResumeTab: view.selectResumeTab,
    updateEducation: (value: ResumeFormData["education"]) => view.updateEducation(value),
    updateExperience: (value: ResumeFormData["experience"]) => view.updateExperience(value),
    updateGaming: (value: ResumeFormData["gaming"]) => view.updateGaming(value),
    updatePersonalInfo: view.updatePersonalInfo,
    updateProjects: (value: ResumeFormData["projects"]) => view.updateProjects(value),
    updateSkills: (value: ResumeFormData["skills"]) => view.updateSkills(value),
  };
}
