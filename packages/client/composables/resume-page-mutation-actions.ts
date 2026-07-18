import type { ComposerTranslation } from "vue-i18n";
import type { NuxtApp } from "#app";
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

function resolveCreatedResumeId(
  result: Awaited<ReturnType<ResumePageActionsInput["createResume"]>>,
): string | null {
  if (
    typeof result === "object" &&
    result !== null &&
    "id" in result &&
    typeof result.id === "string"
  ) {
    return result.id;
  }
  return null;
}

function createResumeCreateAction(
  input: Pick<
    ResumePageActionsInput,
    | "createResume"
    | "creating"
    | "newResumeName"
    | "newResumeTemplate"
    | "selectedResumeId"
    | "showCreateModal"
  >,
  feedback: {
    $toast: Pick<NuxtApp["$toast"], "error" | "success">;
    t: ComposerTranslation;
  },
) {
  return async function handleCreate(): Promise<void> {
    if (!input.newResumeName.value.trim()) {
      return;
    }
    if (input.newResumeName.value.trim().length < 2) {
      feedback.$toast.error(feedback.t("resumePage.toasts.resumeNameMinLength"));
      return;
    }

    input.creating.value = true;
    const createResult = await settlePromise(
      input.createResume(
        createResumeCreationPayload(input.newResumeName.value, input.newResumeTemplate.value),
      ),
      feedback.t("resumePage.toasts.resumeCreateFailed"),
    );
    input.creating.value = false;

    if (!createResult.ok) {
      feedback.$toast.error(
        getErrorMessage(createResult.error, feedback.t("resumePage.toasts.resumeCreateFailed")),
      );
      return;
    }

    input.showCreateModal.value = false;
    input.newResumeName.value = "";
    input.selectedResumeId.value = resolveCreatedResumeId(createResult.value);
    feedback.$toast.success(feedback.t("resumePage.toasts.resumeCreated"));
  };
}

function createResumeDeleteAction(
  input: Pick<
    ResumePageActionsInput,
    "closeDeleteResumeDialog" | "deleteResume" | "pendingDeleteResumeId" | "selectedResumeId"
  >,
  feedback: {
    $toast: Pick<NuxtApp["$toast"], "error" | "success">;
    t: ComposerTranslation;
  },
) {
  return async function handleDeleteResume(): Promise<void> {
    const id = input.pendingDeleteResumeId.value;
    if (!id) {
      return;
    }

    const deleteResult = await settlePromise(
      input.deleteResume(id),
      feedback.t("resumePage.toasts.resumeDeleteFailed"),
    );
    input.closeDeleteResumeDialog();

    if (!deleteResult.ok) {
      feedback.$toast.error(
        getErrorMessage(deleteResult.error, feedback.t("resumePage.toasts.resumeDeleteFailed")),
      );
      return;
    }

    if (input.selectedResumeId.value === id) {
      input.selectedResumeId.value = null;
    }
    feedback.$toast.success(feedback.t("resumePage.toasts.resumeDeleted"));
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
  const feedback = { $toast, t };
  const handleCreate = createResumeCreateAction(
    {
      createResume,
      creating,
      newResumeName,
      newResumeTemplate,
      selectedResumeId,
      showCreateModal,
    },
    feedback,
  );
  const handleDeleteResume = createResumeDeleteAction(
    {
      closeDeleteResumeDialog,
      deleteResume,
      pendingDeleteResumeId,
      selectedResumeId,
    },
    feedback,
  );

  return {
    handleCreate,
    handleDeleteResume,
  };
}
