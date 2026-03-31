import { APP_ROUTE_BUILDERS, JOB_FILTER_ALL_VALUE } from "@bao/shared";
import { settlePromise } from "~/composables/async-flow";
import { buildInterviewJobNavigation } from "~/utils/interview-navigation";
import type { JobsFilterState, JobsTranslate } from "~/composables/jobs-index-page-contracts";

const createJobsSearchCriteria = (input: {
  searchQuery: Ref<string>;
  localFilters: JobsFilterState;
}) => ({
  hasSearchCriteria(): boolean {
    return (
      input.searchQuery.value.trim().length > 0 ||
      input.localFilters.location.trim().length > 0 ||
      input.localFilters.remote ||
      input.localFilters.experienceLevel !== JOB_FILTER_ALL_VALUE ||
      input.localFilters.studioType !== JOB_FILTER_ALL_VALUE ||
      input.localFilters.platform !== JOB_FILTER_ALL_VALUE ||
      input.localFilters.genre !== JOB_FILTER_ALL_VALUE
    );
  },
});

const createJobsRefreshActions = (input: {
  awardForAction: ReturnType<typeof usePipelineGamification>["awardForAction"];
  refreshJobs: ReturnType<typeof useJobs>["refreshJobs"];
  refreshing: Ref<boolean>;
  t: JobsTranslate;
  toast: ReturnType<typeof useNuxtApp>["$toast"];
}) => {
  async function maybeAwardSearchXp(): Promise<void> {
    const rewardResult = await settlePromise(
      input.awardForAction("jobSearch"),
      input.t("apiErrors.gamification.awardXPFailed"),
    );
    if (!rewardResult.ok) {
      return;
    }

    if (rewardResult.value.awarded) {
      input.toast.success(
        input.t("jobsPage.toasts.searchReward", { xp: rewardResult.value.amount }),
      );
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
};

const createJobsNavigationActions = (router: ReturnType<typeof useRouter>) => ({
  async interviewJob(id: string) {
    await router.push(buildInterviewJobNavigation(id, "jobs-list"));
  },
  async viewJob(id: string) {
    await router.push(APP_ROUTE_BUILDERS.jobDetail(id));
  },
});

export const createJobsPageActions = (input: {
  currentPage: Ref<number>;
  searchQuery: Ref<string>;
  localFilters: JobsFilterState;
  router: ReturnType<typeof useRouter>;
  refreshJobs: ReturnType<typeof useJobs>["refreshJobs"];
  refreshJobsBootstrap: () => Promise<unknown>;
  awardForAction: ReturnType<typeof usePipelineGamification>["awardForAction"];
  toast: ReturnType<typeof useNuxtApp>["$toast"];
  t: JobsTranslate;
  refreshing: Ref<boolean>;
}) => {
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
};
