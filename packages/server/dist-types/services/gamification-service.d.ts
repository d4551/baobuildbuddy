import type { Achievement, DailyChallenge, GamificationStats, LevelUpResult, UserGamificationData } from "@bao/shared/types/gamification";
import { type WeeklyProgressResult } from "./gamification-definitions";
export declare class GamificationService {
    private readonly DEFAULT_ID;
    getProgress(): Promise<UserGamificationData>;
    awardXP(amount: number, reason: string): Promise<LevelUpResult | null>;
    getAchievements(): Promise<Achievement[]>;
    checkAchievements(stats: Partial<GamificationStats>): Promise<Achievement[]>;
    private awardAchievementsSequentially;
    getDailyChallenges(): Promise<DailyChallenge[]>;
    completeChallenge(challengeId: string): Promise<boolean>;
    updateStreak(): Promise<void>;
    getWeeklyProgress(): Promise<WeeklyProgressResult>;
    getMonthlyStats(): Promise<{
        totalXP: number;
        levelsGained: number;
        achievementsUnlocked: number;
        challengesCompleted: number;
        actionsCount: number;
        streakDays: number;
    }>;
    trackAction(statKey: keyof GamificationStats, xpAmount: number, reason: string): Promise<{
        readonly xpAwarded: number;
        readonly reason: string;
    }>;
    trackActionFireAndForget(statKey: keyof GamificationStats, xpAmount: number, reason: string): void;
}
export declare const gamificationService: GamificationService;
