import {
  PORTFOLIO_PROJECT_DESCRIPTION_MIN_LENGTH,
  PORTFOLIO_PROJECT_TITLE_MIN_LENGTH,
  type PortfolioMetadata,
  type PortfolioProject,
} from "@bao/shared";
import type { ComposerTranslation } from "vue-i18n";
import type { ComputedRef, Ref } from "vue";
import type { NuxtApp } from "#app";
import { settlePromise } from "~/composables/async-flow";
import type {
  PortfolioProjectForm,
  ProjectDirection,
  PortfolioProjectView,
} from "~/composables/portfolio-page-state";
import { getErrorMessage } from "~/utils/errors";

type PortfolioProjectPayload = {
  title: string;
  description: string;
  technologies: string[];
  featured: boolean;
  image?: string;
  liveUrl?: string;
};

type PortfolioPageActionsInput = {
  addProject: (payload: PortfolioProjectPayload) => Promise<unknown>;
  deleteProject: (id: string) => Promise<void>;
  deleteProjectState: {
    pendingDeleteProjectId: Ref<string | null>;
    closeDeleteProjectDialog: () => void;
    requestDeleteProjectConfirmation: (id: string) => void;
  };
  displayProjects: ComputedRef<readonly PortfolioProject[]>;
  editingProject: Ref<PortfolioProject | null>;
  exportPortfolio: () => Promise<unknown>;
  fetchPortfolio: () => Promise<void>;
  newTech: Ref<string>;
  portfolio: Ref<{ metadata?: PortfolioMetadata | null } | null>;
  portfolioForm: PortfolioMetadata;
  projectForm: PortfolioProjectForm;
  projects: Ref<readonly PortfolioProjectView[]>;
  reorderProjects: (orderedIds: string[]) => Promise<unknown>;
  reorderingProjectId: Ref<string | null>;
  syncPortfolioMetadata: (metadata: PortfolioMetadata | null | undefined) => void;
  updatePortfolio: (metadata: Partial<PortfolioMetadata>) => Promise<unknown>;
  updateProject: (id: string, payload: PortfolioProjectPayload) => Promise<unknown>;
};

function createPortfolioProjectPayload(projectForm: PortfolioProjectForm): PortfolioProjectPayload {
  return {
    title: projectForm.title.trim(),
    description: projectForm.description.trim(),
    technologies: [...projectForm.technologies],
    featured: projectForm.featured,
    ...(projectForm.image.trim() ? { image: projectForm.image.trim() } : {}),
    ...(projectForm.liveUrl.trim() ? { liveUrl: projectForm.liveUrl.trim() } : {}),
  };
}

function usePortfolioProjectValidation(
  {
    editingProject,
    projectForm,
  }: Pick<PortfolioPageActionsInput, "editingProject" | "projectForm">,
  nuxtApp: Pick<NuxtApp, "$toast">,
  t: ComposerTranslation,
) {
  const { $toast } = nuxtApp;

  return {
    validateProjectForm(): boolean {
      if (projectForm.title.trim().length < PORTFOLIO_PROJECT_TITLE_MIN_LENGTH) {
        $toast.error(
          t("portfolioPage.toasts.projectTitleMinLength", {
            count: PORTFOLIO_PROJECT_TITLE_MIN_LENGTH,
          }),
        );
        return false;
      }

      if (projectForm.description.trim().length < PORTFOLIO_PROJECT_DESCRIPTION_MIN_LENGTH) {
        $toast.error(
          t("portfolioPage.toasts.projectDescriptionMinLength", {
            count: PORTFOLIO_PROJECT_DESCRIPTION_MIN_LENGTH,
          }),
        );
        return false;
      }

      if (editingProject.value && !editingProject.value.id) {
        $toast.error(t("portfolioPage.toasts.projectIdMissing"));
        return false;
      }

      return true;
    },
  };
}

function usePortfolioTechnologyActions(
  {
    newTech,
    projectForm,
  }: Pick<PortfolioPageActionsInput, "newTech" | "projectForm">,
  nuxtApp: Pick<NuxtApp, "$toast">,
  t: ComposerTranslation,
) {
  const { $toast } = nuxtApp;

  return {
    addTechnology(): void {
      const nextTechnology = newTech.value.trim();
      if (!nextTechnology) {
        return;
      }

      const alreadyExists = projectForm.technologies.some(
        (technology) => technology.toLowerCase() === nextTechnology.toLowerCase(),
      );
      if (alreadyExists) {
        $toast.error(t("portfolioPage.toasts.technologyDuplicate"));
        return;
      }

      projectForm.technologies.push(nextTechnology);
      newTech.value = "";
    },
    removeTechnology(index: number): void {
      projectForm.technologies.splice(index, 1);
    },
  };
}

function usePortfolioProjectOrdering(
  {
    displayProjects,
    projects,
    reorderProjects,
    reorderingProjectId,
  }: Pick<
    PortfolioPageActionsInput,
    "displayProjects" | "projects" | "reorderProjects" | "reorderingProjectId"
  >,
  nuxtApp: Pick<NuxtApp, "$toast">,
  t: ComposerTranslation,
) {
  const { $toast } = nuxtApp;

  function projectIndexById(projectId: string | undefined): number {
    if (!projectId) {
      return -1;
    }
    return projects.value.findIndex((project) => project.id === projectId);
  }

  return {
    canMove(projectId: string | undefined, direction: ProjectDirection): boolean {
      const index = projectIndexById(projectId);
      if (index < 0) {
        return false;
      }
      if (direction === "up") {
        return index > 0;
      }
      return index < projects.value.length - 1;
    },
    async moveProject(projectId: string | undefined, direction: ProjectDirection): Promise<void> {
      if (!projectId) {
        return;
      }

      const index = projectIndexById(projectId);
      if (index < 0) {
        return;
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= projects.value.length) {
        return;
      }

      const reordered = [...displayProjects.value];
      const movedProject = reordered.splice(index, 1)[0];
      if (!movedProject) {
        return;
      }
      reordered.splice(targetIndex, 0, movedProject);

      const orderedIds = reordered
        .map((project) => project.id)
        .filter((id): id is string => typeof id === "string" && id.trim().length > 0);

      reorderingProjectId.value = projectId;
      const reorderResult = await settlePromise(
        reorderProjects(orderedIds),
        t("portfolioPage.toasts.reorderFailed"),
      );
      reorderingProjectId.value = null;

      if (!reorderResult.ok) {
        $toast.error(getErrorMessage(reorderResult.error, t("portfolioPage.toasts.reorderFailed")));
        return;
      }

      $toast.success(t("portfolioPage.toasts.reordered"));
    },
  };
}

function usePortfolioMetadataSync(
  {
    fetchPortfolio,
    portfolio,
    syncPortfolioMetadata,
  }: Pick<PortfolioPageActionsInput, "fetchPortfolio" | "portfolio" | "syncPortfolioMetadata">,
) {
  onMounted(async () => {
    await fetchPortfolio();
    syncPortfolioMetadata(portfolio.value?.metadata);
  });
}

function usePortfolioMutationActions(
  input: PortfolioPageActionsInput,
  validation: ReturnType<typeof usePortfolioProjectValidation>,
  nuxtApp: Pick<NuxtApp, "$toast">,
  t: ComposerTranslation,
) {
  return {
    ...createPortfolioCrudActions(input, validation, nuxtApp, t),
    ...createPortfolioDeleteActions(input, nuxtApp, t),
  };
}

async function savePortfolioProject(
  input: PortfolioPageActionsInput,
  payload: PortfolioProjectPayload,
): Promise<"updated" | "added"> {
  if (input.editingProject.value?.id) {
    await input.updateProject(input.editingProject.value.id, payload);
    return "updated";
  }

  await input.addProject(payload);
  return "added";
}

function createPortfolioCrudActions(
  input: PortfolioPageActionsInput,
  validation: ReturnType<typeof usePortfolioProjectValidation>,
  nuxtApp: Pick<NuxtApp, "$toast">,
  t: ComposerTranslation,
) {
  const { $toast } = nuxtApp;

  return {
    async handleExport(): Promise<void> {
      const exportResult = await settlePromise(
        input.exportPortfolio(),
        t("portfolioPage.toasts.exportFailed"),
      );
      if (!exportResult.ok) {
        $toast.error(getErrorMessage(exportResult.error, t("portfolioPage.toasts.exportFailed")));
        return;
      }

      $toast.success(t("portfolioPage.toasts.exported"));
    },

    async handleSavePortfolio(): Promise<void> {
      const savePortfolioResult = await settlePromise(
        input.updatePortfolio(input.portfolioForm),
        t("portfolioPage.toasts.saveFailed"),
      );
      if (!savePortfolioResult.ok) {
        $toast.error(getErrorMessage(savePortfolioResult.error, t("portfolioPage.toasts.saveFailed")));
        return;
      }

      $toast.success(t("portfolioPage.toasts.saved"));
    },

    async handleSaveProject(clearProjectForm: () => void): Promise<boolean> {
      if (!validation.validateProjectForm()) {
        return false;
      }

      const saveProjectResult = await settlePromise(
        savePortfolioProject(input, createPortfolioProjectPayload(input.projectForm)),
        t("portfolioPage.toasts.projectSaveFailed"),
      );

      if (!saveProjectResult.ok) {
        $toast.error(
          getErrorMessage(saveProjectResult.error, t("portfolioPage.toasts.projectSaveFailed")),
        );
        return false;
      }

      clearProjectForm();
      $toast.success(
        saveProjectResult.value === "updated"
          ? t("portfolioPage.toasts.projectUpdated")
          : t("portfolioPage.toasts.projectAdded"),
      );
      return true;
    },
  };
}

function createPortfolioDeleteActions(
  input: PortfolioPageActionsInput,
  nuxtApp: Pick<NuxtApp, "$toast">,
  t: ComposerTranslation,
) {
  const { $toast } = nuxtApp;

  return {
    async handleDeleteProject(): Promise<void> {
      const id = input.deleteProjectState.pendingDeleteProjectId.value;
      if (!id) {
        return;
      }

      const deleteProjectResult = await settlePromise(
        input.deleteProject(id),
        t("portfolioPage.toasts.projectDeleteFailed"),
      );
      input.deleteProjectState.closeDeleteProjectDialog();

      if (!deleteProjectResult.ok) {
        $toast.error(
          getErrorMessage(deleteProjectResult.error, t("portfolioPage.toasts.projectDeleteFailed")),
        );
        return;
      }

      $toast.success(t("portfolioPage.toasts.projectDeleted"));
    },

    requestDeleteProject(id?: string): void {
      if (!id) {
        $toast.error(t("portfolioPage.toasts.projectIdMissing"));
        return;
      }

      input.deleteProjectState.requestDeleteProjectConfirmation(id);
    },
  };
}

export function usePortfolioPageActions(
  input: PortfolioPageActionsInput,
  nuxtApp: Pick<NuxtApp, "$toast">,
  t: ComposerTranslation,
) {
  const validation = usePortfolioProjectValidation(
    { editingProject: input.editingProject, projectForm: input.projectForm },
    nuxtApp,
    t,
  );
  const technology = usePortfolioTechnologyActions(
    { newTech: input.newTech, projectForm: input.projectForm },
    nuxtApp,
    t,
  );
  const ordering = usePortfolioProjectOrdering(
    {
      displayProjects: input.displayProjects,
      projects: input.projects,
      reorderProjects: input.reorderProjects,
      reorderingProjectId: input.reorderingProjectId,
    },
    nuxtApp,
    t,
  );
  const mutations = usePortfolioMutationActions(input, validation, nuxtApp, t);
  usePortfolioMetadataSync(input);

  function clearFilters(searchQuery: Ref<string>): void {
    searchQuery.value = "";
  }

  return {
    addTechnology: () => technology.addTechnology(),
    canMove: (projectId: string | undefined, direction: ProjectDirection) =>
      ordering.canMove(projectId, direction),
    clearFilters,
    handleDeleteProject: () => mutations.handleDeleteProject(),
    handleExport: () => mutations.handleExport(),
    handleSavePortfolio: () => mutations.handleSavePortfolio(),
    handleSaveProject: (clearProjectForm: () => void) => mutations.handleSaveProject(clearProjectForm),
    moveProject: (projectId: string | undefined, direction: ProjectDirection) =>
      ordering.moveProject(projectId, direction),
    removeTechnology: (index: number) => technology.removeTechnology(index),
    requestDeleteProject: (id?: string) => mutations.requestDeleteProject(id),
  };
}
