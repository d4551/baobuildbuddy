import type { Job } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";

/**
 * Job search and application management composable.
 */
export function useJobs() {
  const api = useApi();
  const jobs = useState<Job[]>(STATE_KEYS.JOBS_LIST, () => []);
  const savedJobs = useState<Job[]>(STATE_KEYS.JOBS_SAVED, () => []);
  const applications = useState<Job[]>(STATE_KEYS.JOBS_APPLICATIONS, () => []);
  const loading = useState(STATE_KEYS.JOBS_LOADING, () => false);
  const filters = useState<Record<string, string>>(STATE_KEYS.JOBS_FILTERS, () => ({}));

  async function searchJobs(searchFilters?: Record<string, string>) {
    loading.value = true;
    try {
      if (searchFilters) {
        filters.value = searchFilters;
      }
      const { data, error } = await api.jobs.get({ query: filters.value });
      if (error) throw new Error("Failed to search jobs");
      jobs.value = data as Job[];
    } finally {
      loading.value = false;
    }
  }

  async function getJob(id: string) {
    loading.value = true;
    try {
      const { data, error } = await api.jobs[id].get();
      if (error) throw new Error("Failed to fetch job");
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function saveJob(jobId: string) {
    loading.value = true;
    try {
      const { data, error } = await api.jobs.save.post({ jobId });
      if (error) throw new Error("Failed to save job");
      await fetchSavedJobs();
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function unsaveJob(jobId: string) {
    loading.value = true;
    try {
      const { error } = await api.jobs.save[jobId].delete();
      if (error) throw new Error("Failed to unsave job");
      await fetchSavedJobs();
    } finally {
      loading.value = false;
    }
  }

  async function fetchSavedJobs() {
    loading.value = true;
    try {
      const { data, error } = await api.jobs.saved.get();
      if (error) throw new Error("Failed to fetch saved jobs");
      savedJobs.value = data as Job[];
    } finally {
      loading.value = false;
    }
  }

  async function applyToJob(jobId: string, notes?: string) {
    loading.value = true;
    try {
      const { data, error } = await api.jobs.apply.post({ jobId, notes });
      if (error) throw new Error("Failed to apply to job");
      await fetchApplications();
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function updateApplication(id: string, status: string) {
    loading.value = true;
    try {
      const { data, error } = await api.jobs.apply[id].put({ status });
      if (error) throw new Error("Failed to update application");
      await fetchApplications();
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function fetchApplications() {
    loading.value = true;
    try {
      const { data, error } = await api.jobs.applications.get();
      if (error) throw new Error("Failed to fetch applications");
      applications.value = data as Job[];
    } finally {
      loading.value = false;
    }
  }

  async function refreshJobs() {
    loading.value = true;
    try {
      const { data, error } = await api.jobs.refresh.post();
      if (error) throw new Error("Failed to refresh jobs");
      await searchJobs();
      return data;
    } finally {
      loading.value = false;
    }
  }

  const recommendations = useState<Job[]>(STATE_KEYS.JOBS_RECOMMENDATIONS, () => []);

  async function fetchRecommendations() {
    loading.value = true;
    try {
      const { data, error } = await api.jobs.recommendations.get();
      if (error) throw new Error("Failed to fetch job recommendations");
      recommendations.value = data as Job[];
    } finally {
      loading.value = false;
    }
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
