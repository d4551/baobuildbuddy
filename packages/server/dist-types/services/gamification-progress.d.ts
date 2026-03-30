import type { Achievement, DailyChallenge, GamificationStats } from "@bao/shared";
import { type NumericGamificationStats, type ActionHistoryEntry, type WeeklyDaySummary, type WeeklyProgressResult } from "./gamification-definitions";
export declare function typeSafeStats(stats: Partial<GamificationStats> | null | undefined): Partial<GamificationStats> & {
    actionHistory: ActionHistoryEntry[];
};
export declare function toNumericStats(stats: Partial<GamificationStats> | null | undefined): NumericGamificationStats;
export declare function toActionHistory(stats: unknown): ActionHistoryEntry[];
export declare function getNumericStat(stats: NumericGamificationStats, key: string): number;
export declare function getStreakMultiplier(currentStreak: number): number;
export declare function areAchievementRequirementsMet(achievement: Achievement, pendingStats: NumericGamificationStats, existingStats: NumericGamificationStats): boolean;
export declare function getDefinedChallenges(): DailyChallenge[];
export declare function filterActionsByDate(actions: ActionHistoryEntry[], start: Date, end: Date): ActionHistoryEntry[];
export declare function groupActionsByDate(actions: ActionHistoryEntry[]): Map<string, {
    actions: number;
    xpEarned: number;
}>;
export declare function groupCategoriesByAction(actions: ActionHistoryEntry[]): Map<string, number>;
export declare function buildWeeklyDaySummaries(now: Date, dayMap: Map<string, {
    actions: number;
    xpEarned: number;
}>): WeeklyDaySummary[];
export declare function resolveTopCategory(categoryCount: Map<string, number>): string;
export declare function countCompletedChallenges(dailyChallenges: Record<string, string[]>, start: Date, end: Date): number;
export declare function buildWeeklyProgress(stats: Partial<GamificationStats> | null | undefined, dailyChallenges: Record<string, string[]>): WeeklyProgressResult;
export declare function buildMonthlyStats(input: {
    currentStreak: number;
    dailyChallenges: Record<string, string[]>;
    stats: Partial<GamificationStats> | null | undefined;
}): {
    totalXP: number;
    levelsGained: number;
    achievementsUnlocked: number;
    challengesCompleted: number;
    actionsCount: number;
    streakDays: number;
};
export declare function appendActionHistoryEntry(actionHistory: ActionHistoryEntry[], entry: ActionHistoryEntry, maxEntries: number): ActionHistoryEntry[];
