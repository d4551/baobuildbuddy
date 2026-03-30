import type { NuxtApp } from "#app";
import type { ComposerTranslation } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import type { ResumePageActionsInput } from "~/composables/resume-page-actions-contracts";
import { getErrorMessage } from "~/utils/errors";

function createResumeCreationPayload(
  name: string,
  template: ResumePageActionsInput["newResumeTemplate"]["value"],
): Parameters<ResumePageActionsInput["createResume"]>[0] {
  return {
    name,
    template,
    personalInfo: {},
    experience: [],
    education: [],
    skills: {},
    projects: [],
    gamingExperience: {},
  };
}

export function useResumeMutationActions(
  {
    closeDeleteResumeDialog,
    createResume,
    creating,
    deleteResume,
    newResumeName,
    newResumeTemplate,
    pendingDeleteResumeId,
    selectedResumeId,
    showCreateModal,
  }: Pick<
    ResumePageActionsInput,
    | "closeDeleteResumeDialog"
    | "createResume"
    | "creating"
    | "deleteResume"
    | "newResumeName"
    | "newResumeTemplate"
    | "pendingDeleteResumeId"
    | "selectedResumeId"
    | "showCreateModal"
  >,
  nuxtApp: Pick<NuxtApp, "$toast">,
  t: ComposerTranslation,
) {
  const { $toast } = nuxtApp;

  async function handleCreate(): Promise<void> {
    if (!newResumeName.value.trim()) {
      return;
    }
    if (newResumeName.value.trim().length < 2) {
      $toast.error(t("resumePage.toasts.resumeNameMinLength"));
      return;
    }

    creating.value = true;
    const createResult = await settlePromise(
      createResume(createResumeCreationPayload(newResumeName.value, newResumeTemplate.value)),
      t("resumePage.toasts.resumeCreateFailed"),
    );
    creating.value = false;

    if (!createResult.ok) {
      $toast.error(getErrorMessage(createResult.error, t("resumePage.toasts.resumeCreateFailed")));
      return;
    }

    showCreateModal.value = false;
    newResumeName.value = "";
    selectedResumeId.value =
      typeof createResult.value === "object" &&
      createResult.value !== null &&
      "id" in createResult.value &&
      typeof createResult.value.id === "string"
        ? createResult.value.id
        : null;
    $toast.success(t("resumePage.toasts.resumeCreated"));
  }

  async function handleDeleteResume(): Promise<void> {
    const id = pendingDeleteResumeId.value;
    if (!id) {
      return;
    }

    const deleteResult = await settlePromise(
      deleteResume(id),
      t("resumePage.toasts.resumeDeleteFailed"),
    );
    closeDeleteResumeDialog();

    if (!deleteResult.ok) {
      $toast.error(getErrorMessage(deleteResult.error, t("resumePage.toasts.resumeDeleteFailed")));
      return;
    }

    if (selectedResumeId.value === id) {
      selectedResumeId.value = null;
    }
    $toast.success(t("resumePage.toasts.resumeDeleted"));
  }

  return {
    handleCreate,
    handleDeleteResume,
  };
}
