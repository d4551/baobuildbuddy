import type { Achievement, DailyChallenge, GamificationActionHistoryEntry, GamificationStats } from "@bao/shared";
type AchievementDefinition = Omit<Achievement, "unlocked" | "unlockedAt">;
export declare const GAMIFICATION_DEFAULT_ID = "default";
export declare const MAX_ACTION_HISTORY = 500;
export declare const WEEK_DAYS = 7;
export type ActionHistoryEntry = GamificationActionHistoryEntry;
export type NumericGamificationStats = Partial<Record<string, number>>;
export type WeeklyDaySummary = {
    date: string;
    actions: number;
    xpEarned: number;
};
export type WeeklyProgressResult = {
    challengesCompleted: number;
    xpEarned: number;
    actionsCount: number;
    days: WeeklyDaySummary[];
    topCategory: string;
};
export declare const GAMIFICATION_STAT_KEYS: Array<keyof GamificationStats>;
export declare const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[];
export declare const DAILY_CHALLENGE_DEFINITIONS: DailyChallenge[];
export {};
