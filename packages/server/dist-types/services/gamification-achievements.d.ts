import type { Achievement } from "@bao/shared/types/gamification";
import { type NumericGamificationStats } from "./gamification-definitions";
export declare function buildAchievementStatuses(unlockedIds: string[]): Achievement[];
export declare function findUnlockableAchievements(input: {
    achievements: Achievement[];
    existingStats: NumericGamificationStats;
    pendingStats: NumericGamificationStats;
}): Achievement[];
