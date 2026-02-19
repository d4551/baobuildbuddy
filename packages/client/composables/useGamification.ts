import type { Achievement, DailyChallenge, UserGamificationData } from "@navi/shared";
import { STATE_KEYS } from "@navi/shared";

/**
 * Gamification system composable for XP, achievements, and challenges.
 */
export function useGamification() {
  const api = useApi();
  const progress = useState<UserGamificationData | null>(STATE_KEYS.GAMIFICATION_PROGRESS, () => null);
  const achievements = useState<Achievement[]>(STATE_KEYS.GAMIFICATION_ACHIEVEMENTS, () => []);
  const challenges = useState<DailyChallenge[]>(STATE_KEYS.GAMIFICATION_CHALLENGES, () => []);
  const loading = useState(STATE_KEYS.GAMIFICATION_LOADING, () => false);

  async function fetchProgress() {
    loading.value = true;
    try {
      const { data, error } = await api.gamification.progress.get();
      if (error) throw new Error("Failed to fetch progress");
      progress.value = data as UserGamificationData;
    } finally {
      loading.value = false;
    }
  }

  async function awardXP(amount: number, reason: string) {
    loading.value = true;
    try {
      const { data, error } = await api.gamification["award-xp"].post({ amount, reason });
      if (error) throw new Error("Failed to award XP");
      progress.value = data as UserGamificationData;
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
      achievements.value = data as Achievement[];
    } finally {
      loading.value = false;
    }
  }

  async function fetchChallenges() {
    loading.value = true;
    try {
      const { data, error } = await api.gamification.challenges.get();
      if (error) throw new Error("Failed to fetch challenges");
      challenges.value = data as DailyChallenge[];
    } finally {
      loading.value = false;
    }
  }

  async function completeChallenge(id: string) {
    loading.value = true;
    try {
      const { data, error } = await api.gamification.challenges[id].complete.post();
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

  const currentStreak = computed(() => {
    return progress.value?.currentStreak || progress.value?.streak || 0;
  });

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
  const monthlyStats = useState<Record<string, unknown> | null>(STATE_KEYS.GAMIFICATION_MONTHLY, () => null);

  async function fetchWeeklyProgress() {
    loading.value = true;
    try {
      const { data, error } = await api.gamification.weekly.get();
      if (error) throw new Error("Failed to fetch weekly progress");
      weeklyProgress.value = data as Record<string, unknown>;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMonthlyStats() {
    loading.value = true;
    try {
      const { data, error } = await api.gamification.monthly.get();
      if (error) throw new Error("Failed to fetch monthly stats");
      monthlyStats.value = data as Record<string, unknown>;
    } finally {
      loading.value = false;
    }
  }

  const actionHistory = computed(() => {
    return (progress.value?.stats as Record<string, unknown>)?.actionHistory || [];
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
