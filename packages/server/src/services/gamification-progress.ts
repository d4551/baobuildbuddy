import type { Achievement, DailyChallenge, GamificationStats } from "@bao/shared";
import { isRecord, MS_PER_DAY } from "@bao/shared";
import {
  DAILY_CHALLENGE_DEFINITIONS,
  GAMIFICATION_STAT_KEYS,
  type NumericGamificationStats,
  type ActionHistoryEntry,
  WEEK_DAYS,
  type WeeklyDaySummary,
  type WeeklyProgressResult,
} from "./gamification-definitions";

export function typeSafeStats(
  stats: Partial<GamificationStats> | null | undefined,
): Partial<GamificationStats> & { actionHistory: ActionHistoryEntry[] } {
  return {
    ...toNumericStats(stats),
    actionHistory: toActionHistory(stats),
  };
}

export function toNumericStats(
  stats: Partial<GamificationStats> | null | undefined,
): NumericGamificationStats {
  if (!stats || typeof stats !== "object") {
    return {};
  }

  const normalized: NumericGamificationStats = {};
  for (const key of GAMIFICATION_STAT_KEYS) {
    const value = stats[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      normalized[key] = value;
    }
  }
  return normalized;
}

export function toActionHistory(stats: unknown): ActionHistoryEntry[] {
  if (!isRecord(stats)) {
    return [];
  }

  const rawHistory = stats.actionHistory;
  if (!Array.isArray(rawHistory)) {
    return [];
  }

  return rawHistory.filter(
    (entry): entry is ActionHistoryEntry =>
      isRecord(entry) &&
      typeof entry.action === "string" &&
      typeof entry.xpGained === "number" &&
      typeof entry.timestamp === "string",
  );
}

export function getNumericStat(stats: NumericGamificationStats, key: string): number {
  const value = stats[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

const STREAK_MULTIPLIER_STEPS = [
  [30, 3.0],
  [14, 2.0],
  [7, 1.5],
  [3, 1.25],
] as const;

export function getStreakMultiplier(currentStreak: number): number {
  return STREAK_MULTIPLIER_STEPS.find(([threshold]) => currentStreak >= threshold)?.[1] ?? 1.0;
}

export function areAchievementRequirementsMet(
  achievement: Achievement,
  pendingStats: NumericGamificationStats,
  existingStats: NumericGamificationStats,
): boolean {
  for (const [key, requiredValue] of Object.entries(achievement.requirements)) {
    const pendingValue = getNumericStat(pendingStats, key);
    const existingValue = getNumericStat(existingStats, key);
    const statValue = pendingValue || existingValue;
    if (statValue < requiredValue) {
      return false;
    }
  }
  return true;
}

export function getDefinedChallenges(): DailyChallenge[] {
  return DAILY_CHALLENGE_DEFINITIONS.map((challenge) => ({ ...challenge }));
}

export function filterActionsByDate(
  actions: ActionHistoryEntry[],
  start: Date,
  end: Date,
): ActionHistoryEntry[] {
  return actions.filter((action) => {
    const timestamp = new Date(action.timestamp);
    return timestamp >= start && timestamp <= end;
  });
}

export function groupActionsByDate(
  actions: ActionHistoryEntry[],
): Map<string, { actions: number; xpEarned: number }> {
  const dayMap = new Map<string, { actions: number; xpEarned: number }>();
  for (const action of actions) {
    const day = action.timestamp.split("T")[0];
    const existing = dayMap.get(day) || { actions: 0, xpEarned: 0 };
    dayMap.set(day, {
      actions: existing.actions + 1,
      xpEarned: existing.xpEarned + (action.xpGained || 0),
    });
  }
  return dayMap;
}

export function groupCategoriesByAction(actions: ActionHistoryEntry[]): Map<string, number> {
  const categoryCount = new Map<string, number>();
  for (const action of actions) {
    const category = action.action?.split(":")[0] || "general";
    categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
  }
  return categoryCount;
}

export function buildWeeklyDaySummaries(
  now: Date,
  dayMap: Map<string, { actions: number; xpEarned: number }>,
): WeeklyDaySummary[] {
  const days: WeeklyDaySummary[] = [];
  for (let offset = WEEK_DAYS - 1; offset >= 0; offset--) {
    const date = new Date(now.getTime() - offset * MS_PER_DAY).toISOString().split("T")[0];
    const dayData = dayMap.get(date) || { actions: 0, xpEarned: 0 };
    days.push({ date, ...dayData });
  }
  return days;
}

export function resolveTopCategory(categoryCount: Map<string, number>): string {
  let topCategory = "general";
  let topCount = 0;
  for (const [category, count] of categoryCount) {
    if (count > topCount) {
      topCategory = category;
      topCount = count;
    }
  }
  return topCategory;
}

export function countCompletedChallenges(
  dailyChallenges: Record<string, string[]>,
  start: Date,
  end: Date,
): number {
  return Object.entries(dailyChallenges).reduce((total, [dateKey, completed]) => {
    const date = new Date(dateKey);
    return date >= start && date <= end && Array.isArray(completed)
      ? total + completed.length
      : total;
  }, 0);
}

export function buildWeeklyProgress(
  stats: Partial<GamificationStats> | null | undefined,
  dailyChallenges: Record<string, string[]>,
): WeeklyProgressResult {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - WEEK_DAYS * MS_PER_DAY);
  const actionHistory = typeSafeStats(stats).actionHistory;
  const weekActions = filterActionsByDate(actionHistory, weekAgo, now);
  const dayMap = groupActionsByDate(weekActions);
  const categoryCount = groupCategoriesByAction(weekActions);

  return {
    challengesCompleted: countCompletedChallenges(dailyChallenges, weekAgo, now),
    xpEarned: weekActions.reduce((sum, action) => sum + (action.xpGained || 0), 0),
    actionsCount: weekActions.length,
    days: buildWeeklyDaySummaries(now, dayMap),
    topCategory: resolveTopCategory(categoryCount),
  };
}

export function buildMonthlyStats(input: {
  currentStreak: number;
  dailyChallenges: Record<string, string[]>;
  stats: Partial<GamificationStats> | null | undefined;
}) {
  const actionHistory = typeSafeStats(input.stats).actionHistory;
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * MS_PER_DAY);
  const monthActions = filterActionsByDate(actionHistory, monthAgo, now);
  const totalXP = monthActions.reduce((sum, action) => sum + (action.xpGained || 0), 0);

  return {
    totalXP,
    levelsGained: Math.floor(totalXP / 100),
    achievementsUnlocked: monthActions.filter((action) =>
      action.action?.startsWith("Achievement unlocked:"),
    ).length,
    challengesCompleted: countCompletedChallenges(input.dailyChallenges, monthAgo, now),
    actionsCount: monthActions.length,
    streakDays: Math.min(input.currentStreak, 30),
  };
}

export function appendActionHistoryEntry(
  actionHistory: ActionHistoryEntry[],
  entry: ActionHistoryEntry,
  maxEntries: number,
): ActionHistoryEntry[] {
  const updated = [...actionHistory, entry];
  if (updated.length <= maxEntries) {
    return updated;
  }
  return updated.slice(updated.length - maxEntries);
}
