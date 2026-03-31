import type { Achievement, GamificationStats } from "@bao/shared/types/gamification";
type AchievementDefinition = Omit<Achievement, "unlocked" | "unlockedAt">;
export declare const GAMIFICATION_STAT_KEYS: Array<keyof GamificationStats>;
export declare const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[];
export {};
