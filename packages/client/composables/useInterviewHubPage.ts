import { INTERVIEW_DEFAULT_ROLE_TYPE } from "@bao/shared/constants/interview";
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { useInterviewHubActions } from "~/composables/interview-hub-actions";
import {
  INTERVIEW_CONFIG_DIALOG_DESCRIPTION_ID,
  INTERVIEW_CONFIG_DIALOG_TITLE_ID,
  INTERVIEW_ROLE_SUGGESTIONS_LIST_ID,
  normalizeRoleCandidate,
  resolvePreferredOption,
  useInterviewHubBootstrap,
} from "~/composables/interview-hub-bootstrap";
import { useInterviewHubDerived } from "~/composables/interview-hub-derived";

function useInterviewHubDependencies() {
  return {
    coverLetterApi: useCoverLetter(),
    i18n: useI18n(),
    interview: useInterview(),
    jobsApi: useJobs(),
    nuxtApp: useNuxtApp(),
    portfolioApi: usePortfolio(),
    resumeApi: useResume(),
    route: useRoute(),
    router: useRouter(),
    skillMapping: useSkillMapping(),
    studiosApi: useStudio(),
    tts: useTTS(),
    user: useUser(),
  };
}

function useInterviewHubPageWatchers(
  bootstrap: Awaited<ReturnType<typeof useInterviewHubBootstrap>>,
  derived: ReturnType<typeof useInterviewHubDerived>,
  actions: ReturnType<typeof useInterviewHubActions>,
) {
  onMounted(() => {
    if (bootstrap.routeJobId.value || bootstrap.routeStudioId.value) {
      bootstrap.showConfigModal.value = true;
    }
  });

  watch(bootstrap.selectedMode, async (mode) => {
    if (mode === "job" && bootstrap.routeJobId.value && !derived.selectedJob.value) {
      await actions.selectJobById(bootstrap.routeJobId.value, derived.availableJobs.value);
    }
  });

  watch(
    derived.interviewRoleOptions,
    (options) => {
      if (options.length === 0) {
        bootstrap.sessionConfig.role = INTERVIEW_DEFAULT_ROLE_TYPE;
        return;
      }

      const normalizedCurrentRole = normalizeRoleCandidate(
        bootstrap.sessionConfig.role,
      ).toLowerCase();
      const hasCurrentRole = options.some((role) => role.toLowerCase() === normalizedCurrentRole);
      if (!hasCurrentRole) {
        bootstrap.sessionConfig.role = resolvePreferredOption(
          options,
          0,
          INTERVIEW_DEFAULT_ROLE_TYPE,
        );
        return;
      }

      const normalizedRole = normalizeRoleCandidate(bootstrap.sessionConfig.role);
      if (normalizedRole !== bootstrap.sessionConfig.role) {
        bootstrap.sessionConfig.role = normalizedRole;
      }
    },
    { immediate: true },
  );

  watch(bootstrap.routeStudioId, (studioId) => {
    if (studioId && bootstrap.selectedMode.value === "studio") {
      bootstrap.sessionConfig.studioId = studioId;
    }
  });

  watch(bootstrap.routeJobId, async (jobId) => {
    if (!jobId) {
      return;
    }
    bootstrap.selectedMode.value = bootstrap.requestedMode.value;
    await actions.selectJobById(jobId, derived.availableJobs.value);
  });
}

function createInterviewHubBootstrapInput(
  dependencies: ReturnType<typeof useInterviewHubDependencies>,
) {
  return {
    fetchCoverLetters: dependencies.coverLetterApi.fetchCoverLetters,
    fetchPathways: dependencies.skillMapping.fetchPathways,
    fetchPortfolio: dependencies.portfolioApi.fetchPortfolio,
    fetchProfile: dependencies.user.fetchProfile,
    fetchReadiness: dependencies.skillMapping.fetchReadiness,
    fetchResumes: dependencies.resumeApi.fetchResumes,
    fetchSessions: dependencies.interview.fetchSessions,
    fetchStats: dependencies.interview.fetchStats,
    route: dependencies.route,
    searchJobs: dependencies.jobsApi.searchJobs,
    searchStudios: dependencies.studiosApi.searchStudios,
  };
}

function createInterviewHubDerivedInput(
  dependencies: ReturnType<typeof useInterviewHubDependencies>,
  bootstrap: ReturnType<typeof useInterviewHubBootstrap>,
) {
  return {
    coverLetters: dependencies.coverLetterApi.coverLetters,
    jobSearchTerm: bootstrap.jobSearchTerm,
    jobs: dependencies.jobsApi.jobs,
    pathways: dependencies.skillMapping.pathways,
    portfolio: dependencies.portfolioApi.portfolio,
    profile: dependencies.user.profile,
    readiness: dependencies.skillMapping.readiness,
    selectedJobFallback: bootstrap.selectedJobFallback,
    selectedJobId: bootstrap.selectedJobId,
    selectedMode: bootstrap.selectedMode,
    sessionConfig: bootstrap.sessionConfig,
    sessions: dependencies.interview.sessions,
    stats: dependencies.interview.stats,
    studios: dependencies.studiosApi.studios,
    resumes: dependencies.resumeApi.resumes,
  };
}

function createInterviewHubActionsInput(
  dependencies: ReturnType<typeof useInterviewHubDependencies>,
  bootstrap: ReturnType<typeof useInterviewHubBootstrap>,
  derived: ReturnType<typeof useInterviewHubDerived>,
) {
  return {
    closeConfig: bootstrap.showConfigModal,
    fallbackLocale: dependencies.i18n.fallbackLocale,
    getJob: dependencies.jobsApi.getJob,
    locale: dependencies.i18n.locale,
    selectedCoverLetterId: derived.selectedCoverLetterId,
    selectedJob: derived.selectedJob,
    selectedJobFallback: bootstrap.selectedJobFallback,
    selectedJobId: bootstrap.selectedJobId,
    selectedMode: bootstrap.selectedMode,
    selectedPortfolioId: derived.selectedPortfolioId,
    selectedResumeId: derived.selectedResumeId,
    sessionConfig: bootstrap.sessionConfig,
    startSession: dependencies.interview.startSession,
    starting: bootstrap.starting,
    studios: dependencies.studiosApi.studios,
  };
}

export function useInterviewHubPage() {
  const dependencies = useInterviewHubDependencies();
  const { i18n } = dependencies;
  const { getScoreBadgeClass } = useScoreColor();

  const bootstrap = useInterviewHubBootstrap(
    createInterviewHubBootstrapInput(dependencies),
    i18n.t,
  );
  const derived = useInterviewHubDerived(
    createInterviewHubDerivedInput(dependencies, bootstrap),
    i18n.t,
  );
  const actions = useInterviewHubActions(
    createInterviewHubActionsInput(dependencies, bootstrap, derived),
    dependencies.router,
    { $toast: dependencies.nuxtApp.$toast },
    i18n.t,
  );

  useInterviewHubPageWatchers(bootstrap, derived, actions);

  return {
    APP_ROUTES,
    ...bootstrap,
    ...derived,
    ...actions,
    INTERVIEW_CONFIG_DIALOG_DESCRIPTION_ID,
    INTERVIEW_CONFIG_DIALOG_TITLE_ID,
    INTERVIEW_ROLE_SUGGESTIONS_LIST_ID,
    formatSessionDate: actions.formatSessionDate,
    getScoreBadgeClass,
    handleStartInterview: async () => {
      await actions.handleStartInterview(derived.isStartDisabled.value || bootstrap.starting.value);
    },
    retryPathwaysFromWarning: async () => {
      await actions.retryPathwaysFromWarning(bootstrap.refreshInterviewHub);
    },
    ttsVoices: dependencies.tts.voices,
    selectJobById: async (jobId: string) => {
      await actions.selectJobById(jobId, derived.availableJobs.value);
    },
  };
}
