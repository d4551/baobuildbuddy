import type { Achievement, DailyChallenge, GamificationStats, LevelUpResult, UserGamificationData } from "@bao/shared";
export declare class GamificationService {
    private readonly DEFAULT_ID;
    private typeSafeStats;
    /**
     * Get or create the gamification progress record
     */
    getProgress(): Promise<UserGamificationData>;
    /**
     * Get streak multiplier based on consecutive active days
     */
    private getStreakMultiplier;
    /**
     * Award XP and handle level ups with streak multiplier
     */
    awardXP(amount: number, reason: string): Promise<LevelUpResult | null>;
    /**
     * Get all achievements with unlock status
     */
    getAchievements(): Promise<Achievement[]>;
    /**
     * Check and unlock achievements based on current stats
     */
    checkAchievements(stats: Partial<GamificationStats>): Promise<Achievement[]>;
    /**
     * Get daily challenges
     */
    getDailyChallenges(): Promise<DailyChallenge[]>;
    /**
     * Get predefined daily challenges
     */
    private getDefinedChallenges;
    /**
     * Complete a daily challenge
     */
    completeChallenge(challengeId: string): Promise<boolean>;
    /**
     * Update consecutive active day streak
     */
    updateStreak(): Promise<void>;
    /**
     * Get weekly progress from action history
     */
    getWeeklyProgress(): Promise<{
        challengesCompleted: number;
        xpEarned: number;
        actionsCount: number;
        days: Array<{
            date: string;
            actions: number;
            xpEarned: number;
        }>;
        topCategory: string;
    }>;
    /**
     * Get monthly statistics
     */
    getMonthlyStats(): Promise<{
        totalXP: number;
        levelsGained: number;
        achievementsUnlocked: number;
        challengesCompleted: number;
        actionsCount: number;
        streakDays: number;
    }>;
}
export declare const gamificationService: GamificationService;
