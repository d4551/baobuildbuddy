import { STATE_KEYS } from "@bao/shared/constants/state-keys";
import type {
  Achievement,
  DailyChallenge,
  UserGamificationData,
} from "@bao/shared/types/gamification";
import type { JsonObject, JsonValue } from "@bao/shared/utils/json";
import { asJsonArray, isRecord } from "@bao/shared/utils/type-guards";
import { useI18n } from "vue-i18n";
import { withLoadingState } from "./async-flow";
import { parseAchievementList, parseDailyChallengeList } from "./gamification-entity-normalizers";
import { readRequiredApiPayload } from "~/utils/api-response";

interface GamificationState {
  progress: ReturnType<typeof useState<UserGamificationData | null>>;
  achievements: ReturnType<typeof useState<Achievement[]>>;
  challenges: ReturnType<typeof useState<DailyChallenge[]>>;
  weeklyProgress: ReturnType<typeof useState<JsonObject | null>>;
  monthlyStats: ReturnType<typeof useState<JsonObject | null>>;
  loading: ReturnType<typeof useState<boolean>>;
}

interface GamificationContext extends GamificationState {
  api: ReturnType<typeof useApi>;
  t: ReturnType<typeof useI18n>["t"];
}

type GamificationStatKey = Exclude<keyof UserGamificationData["stats"], "actionHistory">;

const GAMIFICATION_STAT_KEYS: readonly GamificationStatKey[] = [
  "profileComplete",
  "skillsMapped",
  "portfolioItems",
  "jobApplications",
  "chatSessions",
  "resumesGenerated",
  "coverLettersGenerated",
  "savedJobs",
  "jobsSaved",
  "interviewScore",
  "dataExported",
  "earlyLogin",
  "totalTimeSpent",
  "featuresUsed",
  "dailyStreak",
  "weeklyProgress",
  "interviewsCompleted",
  "studiosExplored",
];

const toNumberWithDefault = <T>(value: T, fallback: number): number =>
  typeof value === "number" ? value : fallback;

const toOptionalNumber = <T>(value: T): number | undefined =>
  typeof value === "number" ? value : undefined;

const toOptionalString = <T>(value: T): string | undefined =>
  typeof value === "string" ? value : undefined;

const toStringArray = <T>(value: T): string[] => {
  const entries = asJsonArray(value);
  if (!entries) {
    return [];
  }
  return entries.filter((entry): entry is string => typeof entry === "string");
};

const normalizeStats = <T>(value: T): UserGamificationData["stats"] => {
  const stats: UserGamificationData["stats"] = {};
  if (!isRecord(value)) {
    return stats;
  }

  for (const key of GAMIFICATION_STAT_KEYS) {
    const statValue = value[key];
    if (typeof statValue === "number") {
      stats[key] = statValue;
    }
  }
  return stats;
};

const normalizeDailyChallenges = <T>(value: T): Record<string, string[]> => {
  if (!isRecord(value)) {
    return {};
  }

  const dailyChallenges: Record<string, string[]> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (Array.isArray(entry)) {
      dailyChallenges[key] = toStringArray(entry);
    }
  }
  return dailyChallenges;
};

const normalizeProgress = <T>(value: T): UserGamificationData | null => {
  if (!isRecord(value)) {
    return null;
  }

  return {
    xp: toNumberWithDefault(value.xp, 0),
    level: toNumberWithDefault(value.level, 1),
    achievements: toStringArray(value.achievements),
    dailyChallenges: normalizeDailyChallenges(value.dailyChallenges),
    longestStreak: toNumberWithDefault(value.longestStreak, 0),
    currentStreak: toNumberWithDefault(value.currentStreak, 0),
    lastActiveDate: toOptionalString(value.lastActiveDate),
    stats: normalizeStats(value.stats),
    xpForNextLevel: toOptionalNumber(value.xpForNextLevel),
    streak: toOptionalNumber(value.streak),
  };
};

const createGamificationState = (): GamificationState => ({
  progress: useState<UserGamificationData | null>(STATE_KEYS.GAMIFICATION_PROGRESS, () => null),
  achievements: useState<Achievement[]>(STATE_KEYS.GAMIFICATION_ACHIEVEMENTS, () => []),
  challenges: useState<DailyChallenge[]>(STATE_KEYS.GAMIFICATION_CHALLENGES, () => []),
  weeklyProgress: useState<JsonObject | null>(STATE_KEYS.GAMIFICATION_WEEKLY, () => null),
  monthlyStats: useState<JsonObject | null>(STATE_KEYS.GAMIFICATION_MONTHLY, () => null),
  loading: useState(STATE_KEYS.GAMIFICATION_LOADING, () => false),
});

const createFetchProgressAction = (context: GamificationContext) => async () =>
  withLoadingState(context.loading, async () => {
    const data = await readRequiredApiPayload(
      context.api.gamification.progress.get(),
      context.t("apiErrors.gamification.fetchProgressFailed"),
    );
    const normalized = normalizeProgress(data);
    if (normalized) {
      context.progress.value = normalized;
    }
  });

const createAwardXpAction =
  (context: GamificationContext, fetchProgress: () => Promise<void>) =>
  async (amount: number, reason: string) =>
    withLoadingState(context.loading, async () => {
      await readRequiredApiPayload(
        context.api.gamification["award-xp"].post({ amount, reason }),
        context.t("apiErrors.gamification.awardXPFailed"),
      );
      await fetchProgress();
    });

const createFetchAchievementsAction = (context: GamificationContext) => async () =>
  withLoadingState(context.loading, async () => {
    const data = await readRequiredApiPayload(
      context.api.gamification.achievements.get(),
      context.t("apiErrors.gamification.fetchAchievementsFailed"),
    );
    context.achievements.value = parseAchievementList(data);
  });

const createFetchChallengesAction = (context: GamificationContext) => async () =>
  withLoadingState(context.loading, async () => {
    const data = await readRequiredApiPayload(
      context.api.gamification.challenges.get(),
      context.t("apiErrors.gamification.fetchChallengesFailed"),
    );
    if (!isRecord(data)) {
      context.challenges.value = [];
      return;
    }
    context.challenges.value = parseDailyChallengeList(data.challenges);
  });

const createCompleteChallengeAction =
  (
    context: GamificationContext,
    fetchChallenges: () => Promise<void>,
    fetchProgress: () => Promise<void>,
  ) =>
  async (id: string) =>
    withLoadingState(context.loading, async () => {
      await readRequiredApiPayload(
        context.api.gamification.challenges({ id }).complete.post(),
        context.t("apiErrors.gamification.completeChallengeFailed"),
      );
      await fetchChallenges();
      await fetchProgress();
    });

const createFetchWeeklyProgressAction = (context: GamificationContext) => async () =>
  withLoadingState(context.loading, async () => {
    const data = await readRequiredApiPayload(
      context.api.gamification.weekly.get(),
      context.t("apiErrors.gamification.fetchWeeklyFailed"),
    );
    context.weeklyProgress.value = isRecord(data) ? data : null;
  });

const createFetchMonthlyStatsAction = (context: GamificationContext) => async () =>
  withLoadingState(context.loading, async () => {
    const data = await readRequiredApiPayload(
      context.api.gamification.monthly.get(),
      context.t("apiErrors.gamification.fetchMonthlyFailed"),
    );
    context.monthlyStats.value = isRecord(data) ? data : null;
  });

const createGamificationComputedState = (state: GamificationState) => {
  const level = computed(() => {
    const xp = state.progress.value?.xp || 0;
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  });

  const xpToNextLevel = computed(() => {
    const nextLevelXp = level.value ** 2 * 100;
    const currentXp = state.progress.value?.xp || 0;
    return nextLevelXp - currentXp;
  });

  const currentStreak = computed(
    () => state.progress.value?.currentStreak || state.progress.value?.streak || 0,
  );

  const streakMultiplier = computed(() => {
    const streak = currentStreak.value;
    if (streak >= 30) return 3.0;
    if (streak >= 14) return 2.0;
    if (streak >= 7) return 1.5;
    if (streak >= 3) return 1.25;
    return 1.0;
  });

  const actionHistory = computed<JsonValue[]>(() => {
    const weeklyValue = state.weeklyProgress.value;
    if (!(isRecord(weeklyValue) && Array.isArray(weeklyValue.actionHistory))) {
      return [];
    }
    return asJsonArray(weeklyValue.actionHistory) ?? [];
  });

  return {
    level,
    xpToNextLevel,
    currentStreak,
    streakMultiplier,
    actionHistory,
  };
};

/**
 * Gamification system composable for XP, achievements, and challenges.
 */
export function useGamification() {
  const state = createGamificationState();
  const context: GamificationContext = {
    ...state,
    api: useApi(),
    t: useI18n().t,
  };

  const fetchProgress = createFetchProgressAction(context);
  const fetchChallenges = createFetchChallengesAction(context);
  const actions = {
    fetchProgress,
    awardXP: createAwardXpAction(context, fetchProgress),
    fetchAchievements: createFetchAchievementsAction(context),
    fetchChallenges,
    completeChallenge: createCompleteChallengeAction(context, fetchChallenges, fetchProgress),
    fetchWeeklyProgress: createFetchWeeklyProgressAction(context),
    fetchMonthlyStats: createFetchMonthlyStatsAction(context),
  };
  const computedState = createGamificationComputedState(state);

  return {
    progress: readonly(state.progress),
    achievements: readonly(state.achievements),
    challenges: readonly(state.challenges),
    weeklyProgress: readonly(state.weeklyProgress),
    monthlyStats: readonly(state.monthlyStats),
    loading: readonly(state.loading),
    ...computedState,
    ...actions,
  };
}
