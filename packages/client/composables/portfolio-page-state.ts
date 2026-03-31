import type { PortfolioMetadata, PortfolioProject } from "@bao/shared";

type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer U)[]
    ? readonly DeepReadonly<U>[]
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

export type PortfolioProjectView = DeepReadonly<PortfolioProject>;
export type ProjectDirection = "up" | "down";
export type PortfolioProjectForm = {
  title: string;
  description: string;
  technologies: string[];
  image: string;
  liveUrl: string;
  featured: boolean;
};

export const PORTFOLIO_PROJECT_DIALOG_TITLE_ID = "portfolio-page-project-dialog-title";

function createEmptyPortfolioMetadata(): PortfolioMetadata {
  return {
    title: "",
    bio: "",
    email: "",
    website: "",
  };
}

function createEmptyProjectForm(): PortfolioProjectForm {
  return {
    title: "",
    description: "",
    technologies: [],
    image: "",
    liveUrl: "",
    featured: false,
  };
}

function createProjectModalState() {
  const showAddModal = ref(false);
  const editingProject = ref<PortfolioProject | null>(null);
  const newTech = ref("");

  return {
    editingProject,
    newTech,
    showAddModal,
  };
}

function createPortfolioForms() {
  return {
    portfolioForm: reactive<PortfolioMetadata>(createEmptyPortfolioMetadata()),
    projectForm: reactive<PortfolioProjectForm>(createEmptyProjectForm()),
  };
}

function createDeleteProjectState() {
  const {
    showDeleteDialog: showDeleteProjectDialog,
    pendingDeleteId: pendingDeleteProjectId,
    requestDelete: requestDeleteProjectConfirmation,
    clearDeleteState: clearDeleteProjectState,
    closeDeleteDialog: closeDeleteProjectDialog,
  } = useDeleteConfirmation();

  return {
    clearDeleteProjectState,
    closeDeleteProjectDialog,
    pendingDeleteProjectId,
    requestDeleteProjectConfirmation,
    showDeleteProjectDialog,
  };
}

function createPortfolioMetadataSync(portfolioForm: PortfolioMetadata) {
  return {
    syncPortfolioMetadata(metadata: PortfolioMetadata | null | undefined): void {
      portfolioForm.title = metadata?.title || "";
      portfolioForm.bio = metadata?.bio || "";
      portfolioForm.email = metadata?.email || "";
      portfolioForm.website = metadata?.website || "";
    },
  };
}

function createProjectModalActions(
  modalState: ReturnType<typeof createProjectModalState>,
  projectForm: PortfolioProjectForm,
) {
  return {
    openAddModal(clearProjectForm: () => void): void {
      modalState.editingProject.value = null;
      clearProjectForm();
      modalState.showAddModal.value = true;
    },
    openEditModal(project: PortfolioProject): void {
      modalState.editingProject.value = project;
      projectForm.title = project.title;
      projectForm.description = project.description || "";
      projectForm.technologies = [...(project.technologies || [])];
      projectForm.image = project.image || "";
      projectForm.liveUrl = project.liveUrl || "";
      projectForm.featured = project.featured ?? false;
      modalState.newTech.value = "";
      modalState.showAddModal.value = true;
    },
  };
}

export function normalizePortfolioProject(
  project: PortfolioProject | PortfolioProjectView,
): PortfolioProject {
  return {
    ...project,
    technologies: [...(project.technologies || [])],
    links: project.links ? [...project.links] : undefined,
    media: project.media ? [...project.media] : undefined,
    tags: project.tags ? [...project.tags] : undefined,
    responsibilities: project.responsibilities ? [...project.responsibilities] : undefined,
    outcomes: project.outcomes ? [...project.outcomes] : undefined,
    platforms: project.platforms ? [...project.platforms] : undefined,
    engines: project.engines ? [...project.engines] : undefined,
    genres: project.genres ? [...project.genres] : undefined,
  };
}

export function usePortfolioPageState() {
  const modalState = createProjectModalState();
  const deleteState = createDeleteProjectState();
  const { portfolioForm, projectForm } = createPortfolioForms();
  const metadata = createPortfolioMetadataSync(portfolioForm);
  const searchQuery = ref("");
  const reorderingProjectId = ref<string | null>(null);

  function clearProjectForm(): void {
    projectForm.title = "";
    projectForm.description = "";
    projectForm.technologies = [];
    projectForm.image = "";
    projectForm.liveUrl = "";
    projectForm.featured = false;
    modalState.newTech.value = "";
  }
  const modalActions = createProjectModalActions(modalState, projectForm);

  return {
    clearDeleteProjectState: () => deleteState.clearDeleteProjectState(),
    clearProjectForm,
    closeDeleteProjectDialog: () => deleteState.closeDeleteProjectDialog(),
    editingProject: modalState.editingProject,
    newTech: modalState.newTech,
    openAddModal: () => modalActions.openAddModal(clearProjectForm),
    openEditModal: (project: PortfolioProject) => modalActions.openEditModal(project),
    pendingDeleteProjectId: deleteState.pendingDeleteProjectId,
    portfolioForm,
    projectForm,
    reorderingProjectId,
    requestDeleteProjectConfirmation: (id: string) =>
      deleteState.requestDeleteProjectConfirmation(id),
    searchQuery,
    showAddModal: modalState.showAddModal,
    showDeleteProjectDialog: deleteState.showDeleteProjectDialog,
    syncPortfolioMetadata: (value: PortfolioMetadata | null | undefined) =>
      metadata.syncPortfolioMetadata(value),
  };
}
