import {
  PORTFOLIO_PROJECT_DESCRIPTION_MIN_LENGTH,
  PORTFOLIO_PROJECT_TITLE_MIN_LENGTH,
} from "@bao/shared/constants/portfolio";
import { useI18n } from "vue-i18n";
import { usePortfolioPageActions } from "~/composables/portfolio-page-actions";
import {
  PORTFOLIO_PROJECT_DIALOG_TITLE_ID,
  usePortfolioPageState,
} from "~/composables/portfolio-page-state";
import { usePortfolioPageDerived } from "~/composables/portfolio-page-derived";

function usePortfolioPageDependencies() {
  return {
    i18n: useI18n(),
    nuxtApp: useNuxtApp(),
    portfolioApi: usePortfolio(),
  };
}

export function usePortfolioPage() {
  const { i18n, nuxtApp, portfolioApi } = usePortfolioPageDependencies();
  const state = usePortfolioPageState();
  const derived = usePortfolioPageDerived(
    {
      portfolioForm: state.portfolioForm,
      projects: portfolioApi.projects,
      searchQuery: state.searchQuery,
    },
    i18n.t,
  );

  async function loadPortfolio(): Promise<void> {
    await portfolioApi.fetchPortfolio();
    state.syncPortfolioMetadata(portfolioApi.portfolio.value?.metadata);
  }

  const actions = usePortfolioPageActions(
    {
      addProject: portfolioApi.addProject,
      deleteProject: portfolioApi.deleteProject,
      deleteProjectState: {
        pendingDeleteProjectId: state.pendingDeleteProjectId,
        closeDeleteProjectDialog: state.closeDeleteProjectDialog,
        requestDeleteProjectConfirmation: state.requestDeleteProjectConfirmation,
      },
      displayProjects: derived.displayProjects,
      editingProject: state.editingProject,
      exportPortfolio: portfolioApi.exportPortfolio,
      newTech: state.newTech,
      portfolioForm: state.portfolioForm,
      projectForm: state.projectForm,
      projects: portfolioApi.projects,
      reorderProjects: portfolioApi.reorderProjects,
      reorderingProjectId: state.reorderingProjectId,
      updatePortfolio: portfolioApi.updatePortfolio,
      updateProject: portfolioApi.updateProject,
    },
    { $toast: nuxtApp.$toast },
    i18n.t,
  );

  return {
    PORTFOLIO_PROJECT_DESCRIPTION_MIN_LENGTH,
    PORTFOLIO_PROJECT_DIALOG_TITLE_ID,
    PORTFOLIO_PROJECT_TITLE_MIN_LENGTH,
    loadPortfolio,
    ...state,
    ...derived,
    ...actions,
    clearDeleteProjectState: state.clearDeleteProjectState,
    handleSaveProject: async () => {
      const saveSucceeded = await actions.handleSaveProject(state.clearProjectForm);
      if (saveSucceeded) {
        state.showAddModal.value = false;
      }
    },
    loading: portfolioApi.loading,
    portfolio: portfolioApi.portfolio,
    projects: portfolioApi.projects,
  };
}
