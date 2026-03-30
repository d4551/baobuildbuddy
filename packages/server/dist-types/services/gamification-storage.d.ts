import type { GamificationStats, UserGamificationData } from "@bao/shared";
import { type ActionHistoryEntry } from "./gamification-definitions";
export declare function getOrCreateGamificationProgress(id?: string): Promise<UserGamificationData>;
export declare function persistAwardedXP(input: {
    actionEntry: ActionHistoryEntry;
    id: string;
    newLevel: number;
    newXP: number;
    stats: Partial<GamificationStats> & {
        actionHistory: ActionHistoryEntry[];
    };
}): Promise<void>;
export declare function persistAchievements(input: {
    achievements: string[];
    id: string;
    updatedAt: string;
}): Promise<void>;
export declare function persistDailyChallenges(input: {
    dailyChallenges: Record<string, string[]>;
    id: string;
    updatedAt: string;
}): Promise<void>;
export declare function persistStreak(input: {
    currentStreak: number;
    id: string;
    lastActiveDate: string;
    longestStreak: number;
    updatedAt: string;
}): Promise<void>;
export declare function persistStats(input: {
    id: string;
    stats: Partial<GamificationStats>;
    updatedAt: string;
}): Promise<void>;
