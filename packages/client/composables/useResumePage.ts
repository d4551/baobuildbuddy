import { useI18n } from "vue-i18n";
import {
  RESUME_TABS,
  type ResumeTabId,
} from "~/components/resume/resume-page-contracts";
import { useResumePageActions } from "~/composables/resume-page-actions";
import {
  RESUME_CREATE_DIALOG_TITLE_ID,
  useResumePageBootstrap,
} from "~/composables/resume-page-bootstrap";
import { useResumePageDerived } from "~/composables/resume-page-derived";

function useResumePageDependencies() {
  return {
    i18n: useI18n(),
    nuxtApp: useNuxtApp(),
    resumeApi: useResume(),
    route: useRoute(),
    gamification: usePipelineGamification(),
    statistics: useStatistics(),
  };
}

function createResumePageActionsInput(
  bootstrap: Awaited<ReturnType<typeof useResumePageBootstrap>>,
  derived: ReturnType<typeof useResumePageDerived>,
  dependencies: ReturnType<typeof useResumePageDependencies>,
) {
  return {
    aiEnhance: dependencies.resumeApi.aiEnhance,
    aiEnhancementStepLabels: derived.aiEnhancementStepLabels,
    aiScore: dependencies.resumeApi.aiScore,
    awardForAction: dependencies.gamification.awardForAction,
    closeDeleteResumeDialog: bootstrap.closeDeleteResumeDialog,
    createResume: dependencies.resumeApi.createResume,
    creating: bootstrap.creating,
    deleteResume: dependencies.resumeApi.deleteResume,
    enhancing: bootstrap.enhancing,
    formData: bootstrap.formData,
    newResumeName: bootstrap.newResumeName,
    newResumeTemplate: bootstrap.newResumeTemplate,
    pendingDeleteResumeId: bootstrap.pendingDeleteResumeId,
    scoring: bootstrap.scoring,
    selectedResumeId: bootstrap.selectedResumeId,
    showCreateModal: bootstrap.showCreateModal,
    updateResume: dependencies.resumeApi.updateResume,
  };
}

export async function useResumePage() {
  const dependencies = useResumePageDependencies();
  const { i18n } = dependencies;

  const bootstrap = await useResumePageBootstrap({
    fetchDashboard: dependencies.statistics.fetchDashboard,
    fetchResumes: dependencies.resumeApi.fetchResumes,
    getResume: dependencies.resumeApi.getResume,
    route: dependencies.route,
  });

  const derived = useResumePageDerived(
    {
      dashboardStats: dependencies.statistics.dashboard,
      formData: bootstrap.formData,
      resumeSearchQuery: bootstrap.resumeSearchQuery,
      resumes: dependencies.resumeApi.resumes,
      selectedResumeId: bootstrap.selectedResumeId,
    },
    i18n,
    i18n.t,
  );

  const actions = useResumePageActions(
    createResumePageActionsInput(bootstrap, derived, dependencies),
    { $toast: dependencies.nuxtApp.$toast },
    i18n.t,
  );

  return {
    RESUME_CREATE_DIALOG_TITLE_ID,
    RESUME_TABS,
    ...bootstrap,
    ...derived,
    ...actions,
    aiEnhancementStepIndex: actions.aiEnhancementStepIndex,
    aiEnhancementStepLabels: derived.aiEnhancementStepLabels,
    clearResumeFilters: () => {
      actions.clearResumeFilters(bootstrap.resumeSearchQuery);
    },
    handleCompletionTabSelect: (tabId: string) => {
      actions.handleCompletionTabSelect(bootstrap.activeTab, tabId);
    },
    handleExport: async () => {
      await actions.handleExport(dependencies.resumeApi.exportResume);
    },
    selectResumeTab: (tab: ResumeTabId) => {
      actions.selectResumeTab(bootstrap.activeTab, tab);
    },
    loading: dependencies.resumeApi.loading,
    resumes: dependencies.resumeApi.resumes,
  };
}
