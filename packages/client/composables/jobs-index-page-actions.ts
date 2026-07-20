import { JOB_FILTER_ALL_VALUE } from "@bao/shared/constants/jobs";
import { APP_ROUTE_BUILDERS } from "@bao/shared/constants/routes";
import { settlePromise } from "~/composables/async-flow";
import type { JobsFilterState, JobsTranslate } from "~/composables/jobs-index-page-contracts";
import { buildInterviewJobNavigation } from "~/utils/interview-navigation";

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
  matching: Ref<boolean>;
  matchJobs: (resumeId: string) => Promise<unknown>;
  fetchResumes: () => Promise<void>;
  resumes: { readonly value: ReadonlyArray<{ readonly id?: string }> };
  fetchRecommendations: () => Promise<void>;
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

  async function handleAiMatch() {
    input.matching.value = true;
    const resumesResult = await settlePromise(
      input.fetchResumes(),
      input.t("apiErrors.resumes.fetchListFailed"),
    );
    if (!resumesResult.ok) {
      input.matching.value = false;
      input.toast.error(input.t("apiErrors.resumes.fetchListFailed"));
      return;
    }
    const resumeId = input.resumes.value[0]?.id;
    if (!resumeId) {
      input.matching.value = false;
      input.toast.error(input.t("jobsPage.toasts.matchNeedsResume"));
      return;
    }
    const matchResult = await settlePromise(
      input.matchJobs(resumeId),
      input.t("apiErrors.ai.matchJobsFailed"),
    );
    if (matchResult.ok) {
      await settlePromise(
        input.fetchRecommendations(),
        input.t("apiErrors.jobs.fetchRecommendationsFailed"),
      );
      input.toast.success(input.t("jobsPage.toasts.matchComplete"));
    } else {
      input.toast.error(input.t("apiErrors.ai.matchJobsFailed"));
    }
    input.matching.value = false;
  }

  return {
    clearFilters,
    handleAiMatch,
    handleRefresh: refreshActions.handleRefresh,
    handleSearch,
    interviewJob: (id: string) => navigation.interviewJob(id),
    refreshJobsBootstrap: input.refreshJobsBootstrap,
    viewJob: (id: string) => navigation.viewJob(id),
  };
};
