import { createJobsFilterOptions } from "~/composables/jobs-index-page-contracts";
import { createJobsDerivedState, createJobsLabels } from "~/composables/jobs-index-page-derived";
import { createJobsPageActions } from "~/composables/jobs-index-page-actions";
import {
  createJobsPageRuntime,
  registerJobsPageEffects,
} from "~/composables/jobs-index-page-runtime";

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
