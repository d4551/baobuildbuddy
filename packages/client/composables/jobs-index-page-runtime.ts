import { useI18n } from "vue-i18n";
import type { JobsFilterState, JobsIndexTab } from "~/composables/jobs-index-page-contracts";
import {
  createJobsFilterState,
  JOBS_INDEX_DEFAULT_TAB,
} from "~/composables/jobs-index-page-contracts";

export const createJobsPageRuntime = () => {
  const {
    jobs,
    loading,
    searchJobs,
    refreshJobs,
    recommendations,
    fetchRecommendations,
    savedJobs,
    applications,
    fetchSavedJobs,
    fetchApplications,
  } = useJobs();
  const router = useRouter();
  const { t, te } = useI18n();
  const { $toast } = useNuxtApp();
  const { awardForAction } = usePipelineGamification();
  const { matchJobs: matchJobsRaw } = useAI();
  const matchJobs = async (resumeId: string): Promise<void> => {
    await matchJobsRaw(resumeId);
  };
  const { resumes, fetchResumes } = useResume();

  const searchQuery = ref("");
  const localFilters = createJobsFilterState();
  const currentPage = ref(1);
  const refreshing = ref(false);
  const matching = ref(false);
  const showFilters = ref(false);
  const activeTab = ref<JobsIndexTab>(JOBS_INDEX_DEFAULT_TAB);

  return {
    activeTab,
    applications,
    awardForAction,
    currentPage,
    fetchApplications,
    fetchRecommendations,
    fetchResumes,
    fetchSavedJobs,
    jobs,
    loading,
    localFilters,
    matchJobs,
    matching,
    recommendations,
    refreshing,
    refreshJobs,
    resumes,
    router,
    savedJobs,
    searchJobs,
    searchQuery,
    showFilters,
    t,
    te,
    toast: $toast,
  };
};

export const registerJobsPageEffects = (input: {
  currentPage: Ref<number>;
  localFilters: JobsFilterState;
  searchQuery: Ref<string>;
  totalPages: ComputedRef<number>;
}) => {
  watch(
    () => ({
      search: input.searchQuery.value,
      location: input.localFilters.location,
      remote: input.localFilters.remote,
      experienceLevel: input.localFilters.experienceLevel,
      studioType: input.localFilters.studioType,
      platform: input.localFilters.platform,
      genre: input.localFilters.genre,
    }),
    () => {
      input.currentPage.value = 1;
    },
  );

  watch(input.totalPages, (nextTotal) => {
    if (nextTotal <= 0) {
      input.currentPage.value = 1;
      return;
    }
    if (input.currentPage.value > nextTotal) {
      input.currentPage.value = nextTotal;
    }
  });
};
