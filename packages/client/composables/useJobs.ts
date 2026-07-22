import { STATE_KEYS } from "@bao/shared/constants/state-keys";
import type { Job } from "@bao/shared/types/jobs";
import { asJsonArray, isRecord } from "@bao/shared/utils/type-guards";
import { useI18n } from "vue-i18n";
import { readRequiredApiPayload } from "~/utils/api-response";
import { toJob } from "./api-normalizer-jobs";
import { withLoadingState } from "./async-flow";

const toJobList = (value: unknown): Job[] =>
  Array.isArray(value)
    ? value.map((entry) => toJob(entry)).filter((entry): entry is Job => entry !== null)
    : [];

interface JobsContext {
  api: ReturnType<typeof useApi>;
  t: ReturnType<typeof useI18n>["t"];
  loading: ReturnType<typeof useState<boolean>>;
  jobs: ReturnType<typeof useState<Job[]>>;
  savedJobs: ReturnType<typeof useState<Job[]>>;
  applications: ReturnType<typeof useState<Job[]>>;
  recommendations: ReturnType<typeof useState<Job[]>>;
  filters: ReturnType<typeof useState<Record<string, string>>>;
}

async function searchJobs(
  context: JobsContext,
  searchFilters?: Record<string, string>,
): Promise<void> {
  return withLoadingState(context.loading, async () => {
    if (searchFilters) {
      context.filters.value = searchFilters;
    }
    const data = await readRequiredApiPayload(
      context.api.jobs.get({ query: context.filters.value }),
      context.t("apiErrors.jobs.searchFailed"),
    );
    context.jobs.value =
      isRecord(data) && Array.isArray(data.jobs) ? toJobList(data.jobs) : toJobList(data);
  });
}

async function getJob(context: JobsContext, id: string): Promise<Job | null> {
  return withLoadingState(context.loading, async () => {
    const data = await readRequiredApiPayload(
      context.api.jobs({ id }).get(),
      context.t("apiErrors.jobs.fetchFailed"),
    );
    return toJob(data);
  });
}

async function fetchSavedJobs(context: JobsContext): Promise<void> {
  return withLoadingState(context.loading, async () => {
    const data = await readRequiredApiPayload(
      context.api.jobs.saved.get(),
      context.t("apiErrors.jobs.fetchSavedFailed"),
    );
    if (!Array.isArray(data)) {
      context.savedJobs.value = [];
      return;
    }
    const entries = asJsonArray(data) ?? [];
    const jobs: Job[] = [];
    for (const entry of entries) {
      if (!isRecord(entry)) {
        continue;
      }
      const job = toJob(entry.job);
      if (job) {
        jobs.push(job);
      }
    }
    context.savedJobs.value = jobs;
  });
}

async function saveJob(context: JobsContext, jobId: string): Promise<unknown> {
  return withLoadingState(context.loading, async () => {
    const data = await readRequiredApiPayload(
      context.api.jobs.save.post({ jobId }),
      context.t("apiErrors.jobs.saveFailed"),
    );
    await fetchSavedJobs(context);
    return data;
  });
}

async function unsaveJob(context: JobsContext, jobId: string): Promise<void> {
  return withLoadingState(context.loading, async () => {
    const jobSaveRoute = context.api.jobs.save({ jobId });
    await readRequiredApiPayload(jobSaveRoute.delete(), context.t("apiErrors.jobs.unsaveFailed"));
    await fetchSavedJobs(context);
  });
}

async function fetchApplications(context: JobsContext): Promise<void> {
  return withLoadingState(context.loading, async () => {
    const data = await readRequiredApiPayload(
      context.api.jobs.applications.get(),
      context.t("apiErrors.jobs.fetchApplicationsFailed"),
    );
    if (!Array.isArray(data)) {
      context.applications.value = [];
      return;
    }
    const entries = asJsonArray(data) ?? [];
    const jobs: Job[] = [];
    for (const entry of entries) {
      if (!isRecord(entry)) {
        continue;
      }
      const job = toJob(entry.job);
      if (job) {
        jobs.push(job);
      }
    }
    context.applications.value = jobs;
  });
}

async function applyToJob(context: JobsContext, jobId: string, notes?: string): Promise<unknown> {
  return withLoadingState(context.loading, async () => {
    const data = await readRequiredApiPayload(
      context.api.jobs.apply.post({ jobId, notes }),
      context.t("apiErrors.jobs.applyFailed"),
    );
    await fetchApplications(context);
    return data;
  });
}

async function updateApplication(
  context: JobsContext,
  id: string,
  status: string,
): Promise<unknown> {
  return withLoadingState(context.loading, async () => {
    const applicationRoute = context.api.jobs.apply({ id });
    const data = await readRequiredApiPayload(
      applicationRoute.put({ status }),
      context.t("apiErrors.jobs.updateApplicationFailed"),
    );
    await fetchApplications(context);
    return data;
  });
}

async function refreshJobs(context: JobsContext): Promise<unknown> {
  return withLoadingState(context.loading, async () => {
    const data = await readRequiredApiPayload(
      context.api.jobs.refresh.post(),
      context.t("apiErrors.jobs.refreshFailed"),
    );
    await searchJobs(context);
    return data;
  });
}

async function fetchRecommendations(context: JobsContext): Promise<void> {
  return withLoadingState(context.loading, async () => {
    const data = await readRequiredApiPayload(
      context.api.jobs.recommendations.get(),
      context.t("apiErrors.jobs.fetchRecommendationsFailed"),
    );
    if (isRecord(data) && Array.isArray(data.recommendations)) {
      context.recommendations.value = toJobList(data.recommendations);
      return;
    }
    context.recommendations.value = toJobList(data);
  });
}

/**
 * Job search and application management composable.
 */
export function useJobs() {
  const context: JobsContext = {
    api: useApi(),
    t: useI18n().t,
    jobs: useState<Job[]>(STATE_KEYS.JOBS_LIST, () => []),
    savedJobs: useState<Job[]>(STATE_KEYS.JOBS_SAVED, () => []),
    applications: useState<Job[]>(STATE_KEYS.JOBS_APPLICATIONS, () => []),
    recommendations: useState<Job[]>(STATE_KEYS.JOBS_RECOMMENDATIONS, () => []),
    loading: useState(STATE_KEYS.JOBS_LOADING, () => false),
    filters: useState<Record<string, string>>(STATE_KEYS.JOBS_FILTERS, () => ({})),
  };

  return {
    jobs: readonly(context.jobs),
    savedJobs: readonly(context.savedJobs),
    applications: readonly(context.applications),
    recommendations: readonly(context.recommendations),
    loading: readonly(context.loading),
    filters: readonly(context.filters),
    searchJobs: (searchFilters?: Record<string, string>) => searchJobs(context, searchFilters),
    getJob: (id: string) => getJob(context, id),
    saveJob: (jobId: string) => saveJob(context, jobId),
    unsaveJob: (jobId: string) => unsaveJob(context, jobId),
    fetchSavedJobs: () => fetchSavedJobs(context),
    applyToJob: (jobId: string, notes?: string) => applyToJob(context, jobId, notes),
    updateApplication: (id: string, status: string) => updateApplication(context, id, status),
    fetchApplications: () => fetchApplications(context),
    refreshJobs: () => refreshJobs(context),
    fetchRecommendations: () => fetchRecommendations(context),
  };
}
