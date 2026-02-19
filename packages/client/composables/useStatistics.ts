import type { CareerProgress, DashboardStats, WeeklyActivity } from "@navi/shared";
import { STATE_KEYS } from "@navi/shared";

/**
 * Dashboard statistics composable for aggregate metrics and activity tracking.
 */
export function useStatistics() {
  const api = useApi();
  const dashboard = useState<DashboardStats | null>(STATE_KEYS.STATS_DASHBOARD, () => null);
  const weekly = useState<WeeklyActivity[] | null>(STATE_KEYS.STATS_WEEKLY, () => null);
  const career = useState<CareerProgress | null>(STATE_KEYS.STATS_CAREER, () => null);
  const loading = useState(STATE_KEYS.STATS_LOADING, () => false);

  async function fetchDashboard() {
    loading.value = true;
    try {
      const { data, error } = await api.stats.dashboard.get();
      if (error) throw new Error("Failed to fetch dashboard stats");
      dashboard.value = data as DashboardStats;
    } finally {
      loading.value = false;
    }
  }

  async function fetchWeekly() {
    loading.value = true;
    try {
      const { data, error } = await api.stats.weekly.get();
      if (error) throw new Error("Failed to fetch weekly activity");
      weekly.value = data as WeeklyActivity[];
    } finally {
      loading.value = false;
    }
  }

  async function fetchCareerProgress() {
    loading.value = true;
    try {
      const { data, error } = await api.stats.career.get();
      if (error) throw new Error("Failed to fetch career progress");
      career.value = data as CareerProgress;
    } finally {
      loading.value = false;
    }
  }

  async function refreshAll() {
    await Promise.all([fetchDashboard(), fetchWeekly(), fetchCareerProgress()]);
  }

  // Computed convenience accessors
  const profileCompleteness = computed(() => dashboard.value?.profile?.completeness || 0);
  const totalJobsSaved = computed(() => dashboard.value?.jobs?.saved || 0);
  const totalApplications = computed(() => {
    const j = dashboard.value?.jobs;
    return j ? (j.applied || 0) + (j.interviewing || 0) + (j.offered || 0) : 0;
  });
  const currentLevel = computed(() => dashboard.value?.gamification?.level || 1);
  const currentXP = computed(() => dashboard.value?.gamification?.xp || 0);
  const currentStreak = computed(() => dashboard.value?.gamification?.streak || 0);
  const achievementCount = computed(() => dashboard.value?.gamification?.achievements || 0);
  const resumeCount = computed(() => dashboard.value?.resumes?.count || 0);
  const interviewCount = computed(() => dashboard.value?.interviews?.totalSessions || 0);
  const skillsMapped = computed(() => dashboard.value?.skills?.mappedCount || 0);

  return {
    dashboard: readonly(dashboard),
    weekly: readonly(weekly),
    career: readonly(career),
    loading: readonly(loading),
    // Convenience accessors
    profileCompleteness,
    totalJobsSaved,
    totalApplications,
    currentLevel,
    currentXP,
    currentStreak,
    achievementCount,
    resumeCount,
    interviewCount,
    skillsMapped,
    // Methods
    fetchDashboard,
    fetchWeekly,
    fetchCareerProgress,
    refreshAll,
  };
}
