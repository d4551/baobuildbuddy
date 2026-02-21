import type { Job } from "@bao/shared";
import { STATE_KEYS, isRecord } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { toJob } from "./api-normalizers";
import { assertApiResponse, withLoadingState } from "./async-flow";

const toJobList = (value: unknown): Job[] =>
  Array.isArray(value)
    ? value.map((entry) => toJob(entry)).filter((entry): entry is Job => entry !== null)
    : [];

/**
 * Job search and application management composable.
 */
export function useJobs() {
  const api = useApi();
  const { t } = useI18n();
  const jobs = useState<Job[]>(STATE_KEYS.JOBS_LIST, () => []);
  const savedJobs = useState<Job[]>(STATE_KEYS.JOBS_SAVED, () => []);
  const applications = useState<Job[]>(STATE_KEYS.JOBS_APPLICATIONS, () => []);
  const loading = useState(STATE_KEYS.JOBS_LOADING, () => false);
  const filters = useState<Record<string, string>>(STATE_KEYS.JOBS_FILTERS, () => ({}));

  async function searchJobs(searchFilters?: Record<string, string>) {
    return withLoadingState(loading, async () => {
      if (searchFilters) {
        filters.value = searchFilters;
      }
      const { data, error } = await api.jobs.get({ query: filters.value });
      assertApiResponse(error, t("apiErrors.jobs.searchFailed"));
      jobs.value =
        isRecord(data) && Array.isArray(data.jobs) ? toJobList(data.jobs) : toJobList(data);
    });
  }

  async function getJob(id: string) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.jobs({ id }).get();
      assertApiResponse(error, t("apiErrors.jobs.fetchFailed"));
      return toJob(data);
    });
  }

  async function saveJob(jobId: string) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.jobs.save.post({ jobId });
      assertApiResponse(error, t("apiErrors.jobs.saveFailed"));
      await fetchSavedJobs();
      return data;
    });
  }

  async function unsaveJob(jobId: string) {
    return withLoadingState(loading, async () => {
      const { error } = await api.jobs.save({ jobId }).delete();
      assertApiResponse(error, t("apiErrors.jobs.unsaveFailed"));
      await fetchSavedJobs();
    });
  }

  async function fetchSavedJobs() {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.jobs.saved.get();
      assertApiResponse(error, t("apiErrors.jobs.fetchSavedFailed"));
      if (!Array.isArray(data)) {
        savedJobs.value = [];
        return;
      }
      savedJobs.value = data
        .map((entry) => (isRecord(entry) ? toJob(entry.job) : null))
        .filter((entry): entry is Job => entry !== null);
    });
  }

  async function applyToJob(jobId: string, notes?: string) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.jobs.apply.post({ jobId, notes });
      assertApiResponse(error, "Failed to apply to job");
      await fetchApplications();
      return data;
    });
  }

  async function updateApplication(id: string, status: string) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.jobs.apply({ id }).put({ status });
      assertApiResponse(error, "Failed to update application");
      await fetchApplications();
      return data;
    });
  }

  async function fetchApplications() {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.jobs.applications.get();
      assertApiResponse(error, "Failed to fetch applications");
      if (!Array.isArray(data)) {
        applications.value = [];
        return;
      }
      applications.value = data
        .map((entry) => (isRecord(entry) ? toJob(entry.job) : null))
        .filter((entry): entry is Job => entry !== null);
    });
  }

  async function refreshJobs() {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.jobs.refresh.post();
      assertApiResponse(error, "Failed to refresh jobs");
      await searchJobs();
      return data;
    });
  }

  const recommendations = useState<Job[]>(STATE_KEYS.JOBS_RECOMMENDATIONS, () => []);

  async function fetchRecommendations() {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.jobs.recommendations.get();
      assertApiResponse(error, "Failed to fetch job recommendations");
      if (isRecord(data) && Array.isArray(data.recommendations)) {
        recommendations.value = toJobList(data.recommendations);
        return;
      }
      recommendations.value = toJobList(data);
    });
  }

  return {
    jobs: readonly(jobs),
    savedJobs: readonly(savedJobs),
    applications: readonly(applications),
    recommendations: readonly(recommendations),
    loading: readonly(loading),
    filters: readonly(filters),
    searchJobs,
    getJob,
    saveJob,
    unsaveJob,
    fetchSavedJobs,
    applyToJob,
    updateApplication,
    fetchApplications,
    refreshJobs,
    fetchRecommendations,
  };
}
