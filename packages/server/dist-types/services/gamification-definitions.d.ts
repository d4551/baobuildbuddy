import type { GamificationActionHistoryEntry } from "@bao/shared";
import { ACHIEVEMENT_DEFINITIONS, GAMIFICATION_STAT_KEYS } from "./gamification-achievement-definitions";
import { DAILY_CHALLENGE_DEFINITIONS } from "./gamification-challenge-definitions";
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
export { ACHIEVEMENT_DEFINITIONS, DAILY_CHALLENGE_DEFINITIONS, GAMIFICATION_STAT_KEYS, };
