import { STATE_KEYS } from "@bao/shared/constants/state-keys";
import type { CareerProgress, DashboardStats, WeeklyActivity } from "@bao/shared/types/search";
import { asNumber, asString, isRecord } from "@bao/shared/utils/type-guards";
import { useI18n } from "vue-i18n";
import { withLoadingState } from "./async-flow";

type StatisticsState = {
  readonly dashboard: ReturnType<typeof useState<DashboardStats | null>>;
  readonly weekly: ReturnType<typeof useState<WeeklyActivity | null>>;
  readonly career: ReturnType<typeof useState<CareerProgress | null>>;
  readonly loading: ReturnType<typeof useState<boolean>>;
};

type DashboardSections = {
  readonly profile: Record<string, unknown>;
  readonly jobs: Record<string, unknown>;
  readonly resumes: Record<string, unknown>;
  readonly coverLetters: Record<string, unknown>;
  readonly portfolio: Record<string, unknown>;
  readonly interviews: Record<string, unknown>;
  readonly skills: Record<string, unknown>;
  readonly ai: Record<string, unknown>;
  readonly gamification: Record<string, unknown>;
  readonly automation: Record<string, unknown>;
};

const asRecordOrNull = (value: unknown): Record<string, unknown> | null =>
  isRecord(value) ? value : null;

const resolveDashboardSections = (value: Record<string, unknown>): DashboardSections | null => {
  const profile = asRecordOrNull(value.profile);
  const jobs = asRecordOrNull(value.jobs);
  const resumes = asRecordOrNull(value.resumes);
  const coverLetters = asRecordOrNull(value.coverLetters);
  const portfolio = asRecordOrNull(value.portfolio);
  const interviews = asRecordOrNull(value.interviews);
  const skills = asRecordOrNull(value.skills);
  const ai = asRecordOrNull(value.ai);
  const gamification = asRecordOrNull(value.gamification);
  const automation = asRecordOrNull(value.automation);

  if (
    !(
      profile &&
      jobs &&
      resumes &&
      coverLetters &&
      portfolio &&
      interviews &&
      skills &&
      ai &&
      gamification &&
      automation
    )
  ) {
    return null;
  }

  return {
    profile,
    jobs,
    resumes,
    coverLetters,
    portfolio,
    interviews,
    skills,
    ai,
    gamification,
    automation,
  };
};

const toRecentAutomationRun = (
  value: unknown,
): DashboardStats["automation"]["recentRuns"][number] | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = asString(value.id);
  const type = asString(value.type);
  const status = asString(value.status);
  const createdAt = asString(value.createdAt);
  if (!(id && type && status && createdAt)) {
    return null;
  }

  return { id, type, status, createdAt };
};

const toRecentAutomationRuns = (value: unknown): DashboardStats["automation"]["recentRuns"] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => toRecentAutomationRun(entry))
    .filter((entry): entry is DashboardStats["automation"]["recentRuns"][number] => entry !== null);
};

const toProfileStats = (value: DashboardSections["profile"]): DashboardStats["profile"] => ({
  completeness: asNumber(value.completeness) ?? 0,
});

const toJobStats = (value: DashboardSections["jobs"]): DashboardStats["jobs"] => ({
  saved: asNumber(value.saved) ?? 0,
  applied: asNumber(value.applied) ?? 0,
  interviewing: asNumber(value.interviewing) ?? 0,
  offered: asNumber(value.offered) ?? 0,
});

const toResumeStats = (value: DashboardSections["resumes"]): DashboardStats["resumes"] => ({
  count: asNumber(value.count) ?? 0,
  lastUpdated: asString(value.lastUpdated) ?? null,
});

const toCoverLetterStats = (
  value: DashboardSections["coverLetters"],
): DashboardStats["coverLetters"] => ({
  count: asNumber(value.count) ?? 0,
});

const toPortfolioStats = (value: DashboardSections["portfolio"]): DashboardStats["portfolio"] => ({
  projectCount: asNumber(value.projectCount) ?? 0,
});

const toInterviewStats = (
  value: DashboardSections["interviews"],
): DashboardStats["interviews"] => ({
  totalSessions: asNumber(value.totalSessions) ?? 0,
  averageScore: asNumber(value.averageScore) ?? null,
});

const toSkillStats = (value: DashboardSections["skills"]): DashboardStats["skills"] => ({
  mappedCount: asNumber(value.mappedCount) ?? 0,
});

const toAiStats = (value: DashboardSections["ai"]): DashboardStats["ai"] => ({
  chatMessages: asNumber(value.chatMessages) ?? 0,
  chatSessions: asNumber(value.chatSessions) ?? 0,
});

const toGamificationStats = (
  value: DashboardSections["gamification"],
): DashboardStats["gamification"] => ({
  level: asNumber(value.level) ?? 1,
  xp: asNumber(value.xp) ?? 0,
  achievements: asNumber(value.achievements) ?? 0,
  streak: asNumber(value.streak) ?? 0,
});

const toAutomationStats = (
  value: DashboardSections["automation"],
): DashboardStats["automation"] => ({
  totalRuns: asNumber(value.totalRuns) ?? 0,
  successfulRuns: asNumber(value.successfulRuns) ?? 0,
  successRate: asNumber(value.successRate) ?? 0,
  todayRuns: asNumber(value.todayRuns) ?? 0,
  recentRuns: toRecentAutomationRuns(value.recentRuns),
});

const toDashboardStats = (value: unknown): DashboardStats | null => {
  if (!isRecord(value)) {
    return null;
  }

  const sections = resolveDashboardSections(value);
  if (!sections) {
    return null;
  }

  return {
    profile: toProfileStats(sections.profile),
    jobs: toJobStats(sections.jobs),
    resumes: toResumeStats(sections.resumes),
    coverLetters: toCoverLetterStats(sections.coverLetters),
    portfolio: toPortfolioStats(sections.portfolio),
    interviews: toInterviewStats(sections.interviews),
    skills: toSkillStats(sections.skills),
    ai: toAiStats(sections.ai),
    gamification: toGamificationStats(sections.gamification),
    automation: toAutomationStats(sections.automation),
  };
};

const toWeeklyActivity = (value: unknown): WeeklyActivity | null => {
  if (!(isRecord(value) && Array.isArray(value.days))) {
    return null;
  }

  return {
    days: value.days
      .map((entry) => {
        if (!isRecord(entry)) {
          return null;
        }
        const date = asString(entry.date);
        if (!date) {
          return null;
        }
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
  if (!isRecord(value)) {
    return null;
  }

  return {
    skillCoverage: asNumber(value.skillCoverage) ?? 0,
    applicationSuccessRate: asNumber(value.applicationSuccessRate) ?? 0,
    interviewTrend: Array.isArray(value.interviewTrend)
      ? value.interviewTrend.filter((entry): entry is number => typeof entry === "number")
      : [],
  };
};

const readApiData = async (
  request: Promise<unknown>,
  fallbackMessage: string,
): Promise<unknown> => {
  const response = await request;
  if (!(isRecord(response) && "data" in response)) {
    throw new Error(fallbackMessage);
  }
  if ("error" in response && response.error) {
    throw new Error(fallbackMessage);
  }
  return response.data;
};

function createStatisticsState(): StatisticsState {
  return {
    dashboard: useState<DashboardStats | null>(STATE_KEYS.STATS_DASHBOARD, () => null),
    weekly: useState<WeeklyActivity | null>(STATE_KEYS.STATS_WEEKLY, () => null),
    career: useState<CareerProgress | null>(STATE_KEYS.STATS_CAREER, () => null),
    loading: useState(STATE_KEYS.STATS_LOADING, () => false),
  };
}

function createStatisticsActions(
  api: ReturnType<typeof useApi>,
  t: ReturnType<typeof useI18n>["t"],
  state: StatisticsState,
) {
  const fetchDashboard = async () =>
    withLoadingState(state.loading, async () => {
      const data = await readApiData(
        api.stats.dashboard.get(),
        t("apiErrors.statistics.fetchDashboardFailed"),
      );
      state.dashboard.value = toDashboardStats(data);
    });

  const fetchWeekly = async () =>
    withLoadingState(state.loading, async () => {
      const data = await readApiData(
        api.stats.weekly.get(),
        t("apiErrors.statistics.fetchWeeklyFailed"),
      );
      state.weekly.value = toWeeklyActivity(data);
    });

  const fetchCareerProgress = async () =>
    withLoadingState(state.loading, async () => {
      const data = await readApiData(
        api.stats.career.get(),
        t("apiErrors.statistics.fetchCareerFailed"),
      );
      state.career.value = toCareerProgress(data);
    });

  const refreshAll = async () => {
    await Promise.all([fetchDashboard(), fetchWeekly(), fetchCareerProgress()]);
  };

  return {
    fetchDashboard,
    fetchWeekly,
    fetchCareerProgress,
    refreshAll,
  };
}

function createStatisticsAccessors(dashboard: StatisticsState["dashboard"]) {
  const profileCompleteness = computed(() => dashboard.value?.profile?.completeness ?? 0);
  const totalJobsSaved = computed(() => dashboard.value?.jobs?.saved ?? 0);
  const totalApplications = computed(() => {
    const jobs = dashboard.value?.jobs;
    if (!jobs) {
      return 0;
    }
    return (jobs.applied ?? 0) + (jobs.interviewing ?? 0) + (jobs.offered ?? 0);
  });
  const currentLevel = computed(() => dashboard.value?.gamification?.level ?? 1);
  const currentXP = computed(() => dashboard.value?.gamification?.xp ?? 0);
  const currentStreak = computed(() => dashboard.value?.gamification?.streak ?? 0);
  const achievementCount = computed(() => dashboard.value?.gamification?.achievements ?? 0);
  const resumeCount = computed(() => dashboard.value?.resumes?.count ?? 0);
  const interviewCount = computed(() => dashboard.value?.interviews?.totalSessions ?? 0);
  const skillsMapped = computed(() => dashboard.value?.skills?.mappedCount ?? 0);

  return {
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
  };
}

/**
 * Dashboard statistics composable for aggregate metrics and activity tracking.
 */
export function useStatistics() {
  const api = useApi();
  const { t } = useI18n();
  const state = createStatisticsState();
  const actions = createStatisticsActions(api, t, state);
  const accessors = createStatisticsAccessors(state.dashboard);

  return {
    dashboard: readonly(state.dashboard),
    weekly: readonly(state.weekly),
    career: readonly(state.career),
    loading: readonly(state.loading),
    profileCompleteness: accessors.profileCompleteness,
    totalJobsSaved: accessors.totalJobsSaved,
    totalApplications: accessors.totalApplications,
    currentLevel: accessors.currentLevel,
    currentXP: accessors.currentXP,
    currentStreak: accessors.currentStreak,
    achievementCount: accessors.achievementCount,
    resumeCount: accessors.resumeCount,
    interviewCount: accessors.interviewCount,
    skillsMapped: accessors.skillsMapped,
    fetchDashboard: actions.fetchDashboard,
    fetchWeekly: actions.fetchWeekly,
    fetchCareerProgress: actions.fetchCareerProgress,
    refreshAll: actions.refreshAll,
  };
}
