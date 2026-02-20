import type { Achievement, DailyChallenge, UserGamificationData } from "@bao/shared";
import { STATE_KEYS, isRecord } from "@bao/shared";

const normalizeProgress = (value: unknown): UserGamificationData | null => {
  if (!isRecord(value)) {
    return null;
  }

  const statsValue = isRecord(value.stats) ? value.stats : {};
  const stats: Partial<UserGamificationData["stats"]> = {
    profileComplete:
      typeof statsValue.profileComplete === "number" ? statsValue.profileComplete : undefined,
    skillsMapped: typeof statsValue.skillsMapped === "number" ? statsValue.skillsMapped : undefined,
    portfolioItems:
      typeof statsValue.portfolioItems === "number" ? statsValue.portfolioItems : undefined,
    jobApplications:
      typeof statsValue.jobApplications === "number" ? statsValue.jobApplications : undefined,
    chatSessions: typeof statsValue.chatSessions === "number" ? statsValue.chatSessions : undefined,
    resumesGenerated:
      typeof statsValue.resumesGenerated === "number" ? statsValue.resumesGenerated : undefined,
    savedJobs: typeof statsValue.savedJobs === "number" ? statsValue.savedJobs : undefined,
    totalTimeSpent:
      typeof statsValue.totalTimeSpent === "number" ? statsValue.totalTimeSpent : undefined,
    featuresUsed: typeof statsValue.featuresUsed === "number" ? statsValue.featuresUsed : undefined,
    dailyStreak: typeof statsValue.dailyStreak === "number" ? statsValue.dailyStreak : undefined,
    weeklyProgress:
      typeof statsValue.weeklyProgress === "number" ? statsValue.weeklyProgress : undefined,
    interviewsCompleted:
      typeof statsValue.interviewsCompleted === "number"
        ? statsValue.interviewsCompleted
        : undefined,
    studiosExplored:
      typeof statsValue.studiosExplored === "number" ? statsValue.studiosExplored : undefined,
  };

  const dailyChallengesValue = isRecord(value.dailyChallenges) ? value.dailyChallenges : {};
  const dailyChallenges: Record<string, string[]> = {};
  for (const [key, entry] of Object.entries(dailyChallengesValue)) {
    if (Array.isArray(entry)) {
      dailyChallenges[key] = entry.filter((item): item is string => typeof item === "string");
    }
  }

  const achievements = Array.isArray(value.achievements)
    ? value.achievements.filter((entry): entry is string => typeof entry === "string")
    : [];

  return {
    xp: typeof value.xp === "number" ? value.xp : 0,
    level: typeof value.level === "number" ? value.level : 1,
    achievements,
    dailyChallenges,
    longestStreak: typeof value.longestStreak === "number" ? value.longestStreak : 0,
    currentStreak: typeof value.currentStreak === "number" ? value.currentStreak : 0,
    lastActiveDate: typeof value.lastActiveDate === "string" ? value.lastActiveDate : undefined,
    stats,
    xpForNextLevel: typeof value.xpForNextLevel === "number" ? value.xpForNextLevel : undefined,
    streak: typeof value.streak === "number" ? value.streak : undefined,
  };
};

/**
 * Gamification system composable for XP, achievements, and challenges.
 */
export function useGamification() {
  const api = useApi();
  const progress = useState<UserGamificationData | null>(
    STATE_KEYS.GAMIFICATION_PROGRESS,
    () => null,
  );
  const achievements = useState<Achievement[]>(STATE_KEYS.GAMIFICATION_ACHIEVEMENTS, () => []);
  const challenges = useState<DailyChallenge[]>(STATE_KEYS.GAMIFICATION_CHALLENGES, () => []);
  const loading = useState(STATE_KEYS.GAMIFICATION_LOADING, () => false);

  async function fetchProgress() {
    loading.value = true;
    try {
      const { data, error } = await api.gamification.progress.get();
      if (error) throw new Error("Failed to fetch progress");
      const normalized = normalizeProgress(data);
      if (normalized) {
        progress.value = normalized;
      }
    } finally {
      loading.value = false;
    }
  }

  async function awardXP(amount: number, reason: string) {
    loading.value = true;
    try {
      const { data, error } = await api.gamification["award-xp"].post({ amount, reason });
      if (error) throw new Error("Failed to award XP");
      await fetchProgress();
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function fetchAchievements() {
    loading.value = true;
    try {
      const { data, error } = await api.gamification.achievements.get();
      if (error) throw new Error("Failed to fetch achievements");
      achievements.value = Array.isArray(data)
        ? data.filter((entry): entry is Achievement => isRecord(entry))
        : [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchChallenges() {
    loading.value = true;
    try {
      const { data, error } = await api.gamification.challenges.get();
      if (error) throw new Error("Failed to fetch challenges");
      if (!isRecord(data) || !Array.isArray(data.challenges)) {
        challenges.value = [];
        return;
      }
      challenges.value = data.challenges.filter((entry): entry is DailyChallenge =>
        isRecord(entry),
      );
    } finally {
      loading.value = false;
    }
  }

  async function completeChallenge(id: string) {
    loading.value = true;
    try {
      const { data, error } = await api.gamification.challenges({ id }).complete.post();
      if (error) throw new Error("Failed to complete challenge");
      await fetchChallenges();
      await fetchProgress();
      return data;
    } finally {
      loading.value = false;
    }
  }

  const level = computed(() => {
    if (!progress.value) return 1;
    const xp = progress.value.xp || 0;
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  });

  const xpToNextLevel = computed(() => {
    const currentLevel = level.value;
    const nextLevelXP = currentLevel ** 2 * 100;
    const currentXP = progress.value?.xp || 0;
    return nextLevelXP - currentXP;
  });

  const currentStreak = computed(
    () => progress.value?.currentStreak || progress.value?.streak || 0,
  );

  const streakMultiplier = computed(() => {
    const streak = currentStreak.value;
    if (streak >= 30) return 3.0;
    if (streak >= 14) return 2.0;
    if (streak >= 7) return 1.5;
    if (streak >= 3) return 1.25;
    return 1.0;
  });

  const weeklyProgress = useState<Record<string, unknown> | null>(
    STATE_KEYS.GAMIFICATION_WEEKLY,
    () => null,
  );
  const monthlyStats = useState<Record<string, unknown> | null>(
    STATE_KEYS.GAMIFICATION_MONTHLY,
    () => null,
  );

  async function fetchWeeklyProgress() {
    loading.value = true;
    try {
      const { data, error } = await api.gamification.weekly.get();
      if (error) throw new Error("Failed to fetch weekly progress");
      weeklyProgress.value = isRecord(data) ? data : null;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMonthlyStats() {
    loading.value = true;
    try {
      const { data, error } = await api.gamification.monthly.get();
      if (error) throw new Error("Failed to fetch monthly stats");
      monthlyStats.value = isRecord(data) ? data : null;
    } finally {
      loading.value = false;
    }
  }

  const actionHistory = computed(() => {
    if (!isRecord(weeklyProgress.value)) {
      return [];
    }
    const entries = weeklyProgress.value.actionHistory;
    return Array.isArray(entries) ? entries : [];
  });

  return {
    progress: readonly(progress),
    achievements: readonly(achievements),
    challenges: readonly(challenges),
    weeklyProgress: readonly(weeklyProgress),
    monthlyStats: readonly(monthlyStats),
    loading: readonly(loading),
    level,
    xpToNextLevel,
    currentStreak,
    streakMultiplier,
    actionHistory,
    fetchProgress,
    awardXP,
    fetchAchievements,
    fetchChallenges,
    completeChallenge,
    fetchWeeklyProgress,
    fetchMonthlyStats,
  };
}
