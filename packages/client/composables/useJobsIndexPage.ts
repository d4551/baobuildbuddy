import { settlePromise } from "~/composables/async-flow";
import { createJobsPageActions } from "~/composables/jobs-index-page-actions";
import { createJobsFilterOptions } from "~/composables/jobs-index-page-contracts";
import { createJobsDerivedState, createJobsLabels } from "~/composables/jobs-index-page-derived";
import {
  createJobsPageRuntime,
  registerJobsPageEffects,
} from "~/composables/jobs-index-page-runtime";

export function useJobsIndexPage() {
  const runtime = createJobsPageRuntime();

  const {
    error: jobsBootstrapError,
    status: jobsBootstrapStatus,
    refresh: refreshJobsBootstrap,
  } = useAsyncData("jobs-page-bootstrap", async () => {
    await runtime.searchJobs();
    await settlePromise(
      runtime.fetchRecommendations(),
      runtime.t("apiErrors.jobs.fetchRecommendationsFailed"),
    );
    return true;
  });

  const {
    error: savedJobsError,
    status: savedJobsStatus,
    refresh: refreshSavedJobs,
  } = useAsyncData("jobs-page-saved", async () => {
    await runtime.fetchSavedJobs();
    return true;
  });

  const {
    error: applicationsError,
    status: applicationsStatus,
    refresh: refreshApplications,
  } = useAsyncData("jobs-page-applications", async () => {
    await runtime.fetchApplications();
    return true;
  });

  const derived = createJobsDerivedState({
    jobs: runtime.jobs,
    searchQuery: runtime.searchQuery,
    localFilters: runtime.localFilters,
    currentPage: runtime.currentPage,
    t: runtime.t,
  });
  const labels = createJobsLabels(runtime.t, runtime.te);
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
    matching: runtime.matching,
    matchJobs: runtime.matchJobs,
    fetchResumes: runtime.fetchResumes,
    resumes: runtime.resumes,
    fetchRecommendations: runtime.fetchRecommendations,
  });

  registerJobsPageEffects({
    currentPage: runtime.currentPage,
    localFilters: runtime.localFilters,
    searchQuery: runtime.searchQuery,
    totalPages: derived.totalPages,
  });

  return {
    activeTab: runtime.activeTab,
    applications: runtime.applications,
    applicationsError,
    applicationsStatus,
    currentPage: runtime.currentPage,
    jobs: runtime.jobs,
    jobsBootstrapError,
    jobsBootstrapStatus,
    loading: runtime.loading,
    localFilters: runtime.localFilters,
    matching: runtime.matching,
    recommendations: runtime.recommendations,
    refreshing: runtime.refreshing,
    refreshApplications,
    refreshSavedJobs,
    savedJobs: runtime.savedJobs,
    savedJobsError,
    savedJobsStatus,
    searchQuery: runtime.searchQuery,
    showFilters: runtime.showFilters,
    ...createJobsFilterOptions(),
    ...derived,
    ...labels,
    ...actions,
  };
}
