import type { NuxtApp } from "#app";
import type { ComposerTranslation } from "vue-i18n";
import type { Ref } from "vue";
import type { ResumeFormData } from "@bao/shared";
import type { ResumePageActionsInput } from "~/composables/resume-page-actions-contracts";
import {
  useAiEnhancementProgress,
  useResumeEditorActions,
  useResumeFormValidation,
  useResumeRewardResolver,
} from "~/composables/resume-page-editor-actions";
import { useResumeMutationActions } from "~/composables/resume-page-mutation-actions";
import { useResumeViewActions } from "~/composables/resume-page-view-actions";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";

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

  async function handleExport(exportResume: (id: string) => Promise<unknown>): Promise<void> {
    if (!input.selectedResumeId.value) {
      return;
    }
    const exportResult = await settlePromise(
      exportResume(input.selectedResumeId.value),
      t("resumePage.toasts.resumeExportFailed"),
    );
    if (!exportResult.ok) {
      $toast.error(getErrorMessage(exportResult.error, t("resumePage.toasts.resumeExportFailed")));
      return;
    }
    $toast.success(t("resumePage.toasts.resumeExported"));
  }

  return {
    aiEnhancementStepIndex: progress.aiEnhancementStepIndex,
    clearResumeFilters: (resumeSearchQuery: Ref<string>) => view.clearResumeFilters(resumeSearchQuery),
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
