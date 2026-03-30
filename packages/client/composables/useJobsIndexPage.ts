import type { GameGenre, JobExperienceLevel, Platform, StudioType } from "@bao/shared";
import {
  APP_ROUTE_BUILDERS,
  formatRelativeTimeForDate,
  JOB_DISCOVERY_DEFAULT_PAGE_SIZE,
  JOB_EXPERIENCE_LEVELS,
  JOB_FILTER_ALL_VALUE,
  JOB_GAME_GENRES,
  JOB_STUDIO_TYPES,
  JOB_SUPPORTED_PLATFORMS,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { buildInterviewJobNavigation } from "~/utils/interview-navigation";
import { gameGenreLabel, jobExperienceLabel, platformLabel, studioTypeLabel } from "~/utils/labels";

type FilterSelection<T extends string> = T | typeof JOB_FILTER_ALL_VALUE;

interface JobsFilterState {
  location: string;
  remote: boolean;
  experienceLevel: FilterSelection<JobExperienceLevel>;
  studioType: FilterSelection<StudioType>;
  platform: FilterSelection<Platform>;
  genre: FilterSelection<GameGenre>;
}

function createJobsFilterState() {
  return reactive<JobsFilterState>({
    location: "",
    remote: false,
    experienceLevel: JOB_FILTER_ALL_VALUE,
    studioType: JOB_FILTER_ALL_VALUE,
    platform: JOB_FILTER_ALL_VALUE,
    genre: JOB_FILTER_ALL_VALUE,
  });
}

function createJobsFilterOptions() {
  return {
    experienceOptions: JOB_EXPERIENCE_LEVELS,
    studioTypeOptions: JOB_STUDIO_TYPES,
    platformOptions: JOB_SUPPORTED_PLATFORMS,
    genreOptions: JOB_GAME_GENRES,
  };
}

function translateRelativeDate(
  t: ReturnType<typeof useI18n>["t"],
  key: string,
  params?: { count?: number },
): string {
  return params ? t(key, params) : t(key);
}

function createJobsDerivedState(input: {
  jobs: ReturnType<typeof useJobs>["jobs"];
  searchQuery: Ref<string>;
  localFilters: JobsFilterState;
  currentPage: Ref<number>;
  t: ReturnType<typeof useI18n>["t"];
}) {
  const pageSize = JOB_DISCOVERY_DEFAULT_PAGE_SIZE;
  const filteredJobs = computed(() =>
    filterJobs({
      jobs: input.jobs.value,
      filters: input.localFilters,
      searchQuery: input.searchQuery.value,
    }),
  );
  const pagination = createJobsPaginationState({
    currentPage: input.currentPage,
    pageSize,
    totalJobs: computed(() => filteredJobs.value.length),
  });
  const jobsPaginationSummary = computed(() =>
    input.t("jobsPage.pagination.summary", {
      start: filteredJobs.value.length === 0 ? 0 : (input.currentPage.value - 1) * pageSize + 1,
      end: Math.min(input.currentPage.value * pageSize, filteredJobs.value.length),
      total: filteredJobs.value.length,
    }),
  );

  return {
    filteredJobs,
    jobsPaginationSummary,
    pageNumbers: pagination.pageNumbers,
    pageSize,
    paginatedJobs: pagination.paginatedItems(filteredJobs),
    totalPages: pagination.totalPages,
  };
}

function filterJobs(input: {
  jobs: ReturnType<typeof useJobs>["jobs"]["value"];
  filters: JobsFilterState;
  searchQuery: string;
}) {
  let result = [...input.jobs];

  if (input.searchQuery) {
    const query = input.searchQuery.toLowerCase();
    result = result.filter(
      (job) =>
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        (job.description || "").toLowerCase().includes(query),
    );
  }

  if (input.filters.location) {
    const normalizedLocation = input.filters.location.toLowerCase();
    result = result.filter((job) => job.location.toLowerCase().includes(normalizedLocation));
  }

  if (input.filters.remote) {
    result = result.filter((job) => job.remote);
  }

  if (input.filters.experienceLevel !== JOB_FILTER_ALL_VALUE) {
    result = result.filter((job) => job.experienceLevel === input.filters.experienceLevel);
  }

  if (input.filters.studioType !== JOB_FILTER_ALL_VALUE) {
    result = result.filter((job) => job.studioType === input.filters.studioType);
  }

  if (input.filters.platform !== JOB_FILTER_ALL_VALUE) {
    const platform = input.filters.platform;
    result = result.filter((job) => job.platforms?.includes(platform));
  }

  if (input.filters.genre !== JOB_FILTER_ALL_VALUE) {
    const genre = input.filters.genre;
    result = result.filter((job) => job.gameGenres?.includes(genre));
  }

  return result;
}

function createJobsPaginationState(input: {
  currentPage: Ref<number>;
  pageSize: number;
  totalJobs: ComputedRef<number>;
}) {
  const totalPages = computed(() => Math.ceil(input.totalJobs.value / input.pageSize));
  const pageNumbers = computed(() =>
    Array.from({ length: totalPages.value }, (_, index) => index + 1),
  );

  function paginatedItems<T>(items: ComputedRef<T[]>) {
    return computed(() => {
      const start = (input.currentPage.value - 1) * input.pageSize;
      return items.value.slice(start, start + input.pageSize);
    });
  }

  return {
    pageNumbers,
    paginatedItems,
    totalPages,
  };
}

function createJobsLabels(t: ReturnType<typeof useI18n>["t"]) {
  return {
    formatDate(date: string) {
      return formatRelativeTimeForDate(
        date,
        (key, params) => translateRelativeDate(t, key, params),
        {
          keyPrefix: "jobsPage.date",
        },
      );
    },
    experienceOptionLabel(value: FilterSelection<JobExperienceLevel>): string {
      if (value === JOB_FILTER_ALL_VALUE) return t("jobsPage.options.all");
      return jobExperienceLabel(t, value);
    },
    studioTypeOptionLabel(value: FilterSelection<StudioType>): string {
      if (value === JOB_FILTER_ALL_VALUE) return t("jobsPage.options.allTypes");
      return studioTypeLabel(t, value);
    },
    platformOptionLabel(value: FilterSelection<Platform>): string {
      if (value === JOB_FILTER_ALL_VALUE) return t("jobsPage.options.allPlatforms");
      return platformLabel(t, value);
    },
    genreOptionLabel(value: FilterSelection<GameGenre>): string {
      if (value === JOB_FILTER_ALL_VALUE) return t("jobsPage.options.allGenres");
      return gameGenreLabel(t, value);
    },
  };
}

function createJobsPageActions(input: {
  currentPage: Ref<number>;
  searchQuery: Ref<string>;
  localFilters: JobsFilterState;
  router: ReturnType<typeof useRouter>;
  refreshJobs: ReturnType<typeof useJobs>["refreshJobs"];
  refreshJobsBootstrap: () => Promise<unknown>;
  awardForAction: ReturnType<typeof usePipelineGamification>["awardForAction"];
  toast: ReturnType<typeof useNuxtApp>["$toast"];
  t: ReturnType<typeof useI18n>["t"];
  refreshing: Ref<boolean>;
}) {
  const searchCriteria = createJobsSearchCriteria(input);
  const refreshActions = createJobsRefreshActions(input);
  const navigation = createJobsNavigationActions(input.router);

  function clearFilters() {
    input.searchQuery.value = "";
    input.localFilters.location = "";
    input.localFilters.remote = false;
    input.localFilters.experienceLevel = JOB_FILTER_ALL_VALUE;
    input.localFilters.studioType = JOB_FILTER_ALL_VALUE;
    input.localFilters.platform = JOB_FILTER_ALL_VALUE;
    input.localFilters.genre = JOB_FILTER_ALL_VALUE;
    input.currentPage.value = 1;
  }

  async function handleSearch() {
    input.currentPage.value = 1;
    if (!searchCriteria.hasSearchCriteria()) {
      return;
    }
    await refreshActions.maybeAwardSearchXp();
  }

  return {
    clearFilters,
    handleRefresh: refreshActions.handleRefresh,
    handleSearch,
    interviewJob: (id: string) => navigation.interviewJob(id),
    refreshJobsBootstrap: input.refreshJobsBootstrap,
    viewJob: (id: string) => navigation.viewJob(id),
  };
}

function createJobsSearchCriteria(input: {
  searchQuery: Ref<string>;
  localFilters: JobsFilterState;
}) {
  function hasSearchCriteria(): boolean {
    return (
      input.searchQuery.value.trim().length > 0 ||
      input.localFilters.location.trim().length > 0 ||
      input.localFilters.remote ||
      input.localFilters.experienceLevel !== JOB_FILTER_ALL_VALUE ||
      input.localFilters.studioType !== JOB_FILTER_ALL_VALUE ||
      input.localFilters.platform !== JOB_FILTER_ALL_VALUE ||
      input.localFilters.genre !== JOB_FILTER_ALL_VALUE
    );
  }

  return {
    hasSearchCriteria,
  };
}

function createJobsRefreshActions(input: {
  awardForAction: ReturnType<typeof usePipelineGamification>["awardForAction"];
  refreshJobs: ReturnType<typeof useJobs>["refreshJobs"];
  refreshing: Ref<boolean>;
  t: ReturnType<typeof useI18n>["t"];
  toast: ReturnType<typeof useNuxtApp>["$toast"];
}) {
  async function maybeAwardSearchXp(): Promise<void> {
    const rewardResult = await settlePromise(
      input.awardForAction("jobSearch"),
      input.t("apiErrors.gamification.awardXPFailed"),
    );
    if (!rewardResult.ok) {
      return;
    }

    if (rewardResult.value.awarded) {
      input.toast.success(input.t("jobsPage.toasts.searchReward", { xp: rewardResult.value.amount }));
    }
  }

  async function handleRefresh() {
    input.refreshing.value = true;
    const refreshResult = await settlePromise(
      input.refreshJobs(),
      input.t("apiErrors.jobs.refreshFailed"),
    );
    if (refreshResult.ok) {
      await maybeAwardSearchXp();
    }
    input.refreshing.value = false;

    if (!refreshResult.ok) {
      throw refreshResult.error;
    }
  }

  return {
    handleRefresh,
    maybeAwardSearchXp,
  };
}

function createJobsNavigationActions(router: ReturnType<typeof useRouter>) {
  return {
    async interviewJob(id: string) {
      await router.push(buildInterviewJobNavigation(id, "jobs-list"));
    },
    async viewJob(id: string) {
      await router.push(APP_ROUTE_BUILDERS.jobDetail(id));
    },
  };
}

function createJobsPageRuntime() {
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
}

function registerJobsPageEffects(input: {
  currentPage: Ref<number>;
  localFilters: JobsFilterState;
  searchQuery: Ref<string>;
  totalPages: ComputedRef<number>;
}) {
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
}

export async function useJobsIndexPage() {
  const runtime = createJobsPageRuntime();

  const {
    error: jobsBootstrapError,
    status: jobsBootstrapStatus,
    refresh: refreshJobsBootstrap,
  } = await useAsyncData("jobs-page-bootstrap", async () => {
    await runtime.searchJobs();
    return true;
  });

  const derived = createJobsDerivedState({
    jobs: runtime.jobs,
    searchQuery: runtime.searchQuery,
    localFilters: runtime.localFilters,
    currentPage: runtime.currentPage,
    t: runtime.t,
  });
  const labels = createJobsLabels(runtime.t);
  const actions = createJobsPageActions({
    currentPage: runtime.currentPage,
    searchQuery: runtime.searchQuery,
    localFilters: runtime.localFilters,
    router: runtime.router,
    refreshJobs: runtime.refreshJobs,
    refreshJobsBootstrap,
    awardForAction: runtime.awardForAction,
    toast: runtime.toast,
    t: runtime.t,
    refreshing: runtime.refreshing,
  });

  registerJobsPageEffects({
    currentPage: runtime.currentPage,
    localFilters: runtime.localFilters,
    searchQuery: runtime.searchQuery,
    totalPages: derived.totalPages,
  });

  return {
    currentPage: runtime.currentPage,
    jobs: runtime.jobs,
    jobsBootstrapError,
    jobsBootstrapStatus,
    loading: runtime.loading,
    localFilters: runtime.localFilters,
    refreshing: runtime.refreshing,
    searchQuery: runtime.searchQuery,
    showFilters: runtime.showFilters,
    ...createJobsFilterOptions(),
    ...derived,
    ...labels,
    ...actions,
  };
}
