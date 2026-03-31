import { useI18n } from "vue-i18n";
import type { JobsFilterState } from "~/composables/jobs-index-page-contracts";
import { createJobsFilterState } from "~/composables/jobs-index-page-contracts";

export const createJobsPageRuntime = () => {
  const { jobs, loading, searchJobs, refreshJobs } = useJobs();
  const router = useRouter();
  const { t } = useI18n();
  const { $toast } = useNuxtApp();
  const { awardForAction } = usePipelineGamification();

  const searchQuery = ref("");
  const localFilters = createJobsFilterState();
  const currentPage = ref(1);
  const refreshing = ref(false);
  const showFilters = ref(false);

  return {
    awardForAction,
    currentPage,
    jobs,
    loading,
    localFilters,
    refreshing,
    refreshJobs,
    router,
    searchJobs,
    searchQuery,
    showFilters,
    t,
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
