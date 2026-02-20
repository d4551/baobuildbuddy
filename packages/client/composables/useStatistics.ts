import type { CareerProgress, DashboardStats, WeeklyActivity } from "@bao/shared";
import { STATE_KEYS, asNumber, asString, isRecord } from "@bao/shared";
import { assertApiResponse, withLoadingState } from "./async-flow";

const toDashboardStats = (value: unknown): DashboardStats | null => {
  if (!isRecord(value)) return null;
  if (
    !isRecord(value.profile) ||
    !isRecord(value.jobs) ||
    !isRecord(value.resumes) ||
    !isRecord(value.coverLetters) ||
    !isRecord(value.portfolio) ||
    !isRecord(value.interviews) ||
    !isRecord(value.skills) ||
    !isRecord(value.ai) ||
    !isRecord(value.gamification) ||
    !isRecord(value.automation)
  ) {
    return null;
  }

  return {
    profile: {
      completeness: asNumber(value.profile.completeness) ?? 0,
    },
    jobs: {
      saved: asNumber(value.jobs.saved) ?? 0,
      applied: asNumber(value.jobs.applied) ?? 0,
      interviewing: asNumber(value.jobs.interviewing) ?? 0,
      offered: asNumber(value.jobs.offered) ?? 0,
    },
    resumes: {
      count: asNumber(value.resumes.count) ?? 0,
      lastUpdated: asString(value.resumes.lastUpdated) ?? null,
    },
    coverLetters: {
      count: asNumber(value.coverLetters.count) ?? 0,
    },
    portfolio: {
      projectCount: asNumber(value.portfolio.projectCount) ?? 0,
    },
    interviews: {
      totalSessions: asNumber(value.interviews.totalSessions) ?? 0,
      averageScore: asNumber(value.interviews.averageScore) ?? null,
    },
    skills: {
      mappedCount: asNumber(value.skills.mappedCount) ?? 0,
    },
    ai: {
      chatMessages: asNumber(value.ai.chatMessages) ?? 0,
      chatSessions: asNumber(value.ai.chatSessions) ?? 0,
    },
    gamification: {
      level: asNumber(value.gamification.level) ?? 1,
      xp: asNumber(value.gamification.xp) ?? 0,
      achievements: asNumber(value.gamification.achievements) ?? 0,
      streak: asNumber(value.gamification.streak) ?? 0,
    },
    automation: {
      totalRuns: asNumber(value.automation.totalRuns) ?? 0,
      successfulRuns: asNumber(value.automation.successfulRuns) ?? 0,
      successRate: asNumber(value.automation.successRate) ?? 0,
      todayRuns: asNumber(value.automation.todayRuns) ?? 0,
      recentRuns: Array.isArray(value.automation.recentRuns)
        ? value.automation.recentRuns
            .map((entry) => {
              if (!isRecord(entry)) return null;
              const id = asString(entry.id);
              const type = asString(entry.type);
              const status = asString(entry.status);
              const createdAt = asString(entry.createdAt);
              if (!id || !type || !status || !createdAt) return null;
              return { id, type, status, createdAt };
            })
            .filter(
              (entry): entry is DashboardStats["automation"]["recentRuns"][number] =>
                entry !== null,
            )
        : [],
    },
  };
};

const toWeeklyActivity = (value: unknown): WeeklyActivity | null => {
  if (!isRecord(value)) return null;
  if (!Array.isArray(value.days)) return null;

  return {
    days: value.days
      .map((entry) => {
        if (!isRecord(entry)) return null;
        const date = asString(entry.date);
        if (!date) return null;
        return {
          date,
          actions: asNumber(entry.actions) ?? 0,
          xpEarned: asNumber(entry.xpEarned) ?? 0,
        };
      })
      .filter((entry): entry is WeeklyActivity["days"][number] => entry !== null),
    topCategory: asString(value.topCategory) ?? "unknown",
    totalXP: asNumber(value.totalXP) ?? 0,
  };
};

const toCareerProgress = (value: unknown): CareerProgress | null => {
  if (!isRecord(value)) return null;
  return {
    skillCoverage: asNumber(value.skillCoverage) ?? 0,
    applicationSuccessRate: asNumber(value.applicationSuccessRate) ?? 0,
    interviewTrend: Array.isArray(value.interviewTrend)
      ? value.interviewTrend.filter((entry): entry is number => typeof entry === "number")
      : [],
  };
};

/**
 * Dashboard statistics composable for aggregate metrics and activity tracking.
 */
export function useStatistics() {
  const api = useApi();
  const dashboard = useState<DashboardStats | null>(STATE_KEYS.STATS_DASHBOARD, () => null);
  const weekly = useState<WeeklyActivity | null>(STATE_KEYS.STATS_WEEKLY, () => null);
  const career = useState<CareerProgress | null>(STATE_KEYS.STATS_CAREER, () => null);
  const loading = useState(STATE_KEYS.STATS_LOADING, () => false);

  async function fetchDashboard() {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.stats.dashboard.get();
      assertApiResponse(error, "Failed to fetch dashboard stats");
      dashboard.value = toDashboardStats(data);
    });
  }

  async function fetchWeekly() {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.stats.weekly.get();
      assertApiResponse(error, "Failed to fetch weekly activity");
      weekly.value = toWeeklyActivity(data);
    });
  }

  async function fetchCareerProgress() {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.stats.career.get();
      assertApiResponse(error, "Failed to fetch career progress");
      career.value = toCareerProgress(data);
    });
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
