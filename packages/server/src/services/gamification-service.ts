import { MS_PER_DAY } from "@bao/shared/constants/time";
import { getLevelForXP } from "@bao/shared/constants/xp-levels";
import type {
  Achievement,
  DailyChallenge,
  GamificationStats,
  LevelUpResult,
  UserGamificationData,
} from "@bao/shared/types/gamification";
import { settle } from "@bao/shared/utils/promise";
import { createServerLogger } from "../utils/logger";
import { buildAchievementStatuses, findUnlockableAchievements } from "./gamification-achievements";
import { buildDailyChallengesView, completeChallengeState } from "./gamification-challenges";
import { GAMIFICATION_DEFAULT_ID, type WeeklyProgressResult } from "./gamification-definitions";
import {
  buildMonthlyStats,
  buildWeeklyProgress,
  getNumericStat,
  getStreakMultiplier,
  toNumericStats,
  typeSafeStats,
} from "./gamification-progress";
import {
  getOrCreateGamificationProgress,
  persistAchievements,
  persistAwardedXP,
  persistDailyChallenges,
  persistStats,
  persistStreak,
} from "./gamification-storage";

const gamificationLogger = createServerLogger("gamification");

export class GamificationService {
  private readonly DEFAULT_ID = GAMIFICATION_DEFAULT_ID;

  async getProgress(): Promise<UserGamificationData> {
    return await getOrCreateGamificationProgress(this.DEFAULT_ID);
  }

  async awardXP(amount: number, reason: string): Promise<LevelUpResult | null> {
    const progress = await this.getProgress();
    const multiplier = getStreakMultiplier(progress.currentStreak);
    const adjustedAmount = Math.round(amount * multiplier);
    const oldLevelData = getLevelForXP(progress.xp);
    const newXP = progress.xp + adjustedAmount;
    const newLevelData = getLevelForXP(newXP);
    const now = new Date().toISOString();

    await this.updateStreak();
    await persistAwardedXP({
      actionEntry: {
        action: reason,
        xpGained: adjustedAmount,
        multiplier,
        timestamp: now,
      },
      id: this.DEFAULT_ID,
      newLevel: newLevelData.level,
      newXP,
      stats: typeSafeStats(progress.stats),
    });

    if (newLevelData.level <= progress.level) {
      return null;
    }

    return {
      xpGained: adjustedAmount,
      oldLevel: progress.level,
      newLevel: newLevelData.level,
      oldTitle: oldLevelData.title,
      newTitle: newLevelData.title,
      unlockedFeatures: newLevelData.features || [],
      bonusXP: adjustedAmount - amount,
    };
  }

  async getAchievements(): Promise<Achievement[]> {
    const progress = await this.getProgress();
    return buildAchievementStatuses(progress.achievements);
  }

  async checkAchievements(stats: Partial<GamificationStats>): Promise<Achievement[]> {
    const progress = await this.getProgress();
    const unlockable = findUnlockableAchievements({
      achievements: await this.getAchievements(),
      existingStats: toNumericStats(progress.stats),
      pendingStats: toNumericStats(stats),
    });

    if (unlockable.length === 0) {
      return [];
    }

    const now = new Date().toISOString();
    const unlockedIds = Array.from(
      new Set([...progress.achievements, ...unlockable.map((achievement) => achievement.id)]),
    );
    await persistAchievements({
      achievements: unlockedIds,
      id: this.DEFAULT_ID,
      updatedAt: now,
    });

    await this.awardAchievementsSequentially(unlockable, 0);
    return unlockable.map((achievement) => ({ ...achievement, unlocked: true, unlockedAt: now }));
  }

  private async awardAchievementsSequentially(
    achievements: Achievement[],
    index: number,
  ): Promise<void> {
    if (index >= achievements.length) {
      return;
    }

    const achievement = achievements[index];
    await this.awardXP(achievement.xpReward, `Achievement unlocked: ${achievement.name}`);
    await this.awardAchievementsSequentially(achievements, index + 1);
  }

  async getDailyChallenges(): Promise<DailyChallenge[]> {
    const progress = await this.getProgress();
    return buildDailyChallengesView(progress.dailyChallenges, new Date());
  }

  async completeChallenge(challengeId: string): Promise<boolean> {
    const progress = await this.getProgress();
    const now = new Date();
    const completedChallenge = completeChallengeState({
      challengeId,
      dailyChallenges: progress.dailyChallenges,
      now,
    });

    if (!completedChallenge) {
      return false;
    }

    await persistDailyChallenges({
      dailyChallenges: completedChallenge.updatedChallenges,
      id: this.DEFAULT_ID,
      updatedAt: now.toISOString(),
    });
    await this.awardXP(
      completedChallenge.challenge.xpReward,
      `Daily challenge completed: ${completedChallenge.challenge.name}`,
    );

    return true;
  }

  async updateStreak(): Promise<void> {
    const progress = await this.getProgress();
    const today = new Date().toISOString().split("T")[0];
    const lastActive = progress.lastActiveDate?.split("T")[0];

    if (!lastActive || lastActive === today) {
      return;
    }

    const yesterday = new Date(Date.now() - MS_PER_DAY).toISOString().split("T")[0];
    const currentStreak = lastActive === yesterday ? progress.currentStreak + 1 : 1;
    const longestStreak = Math.max(progress.longestStreak, currentStreak);
    const now = new Date().toISOString();

    await persistStreak({
      currentStreak,
      id: this.DEFAULT_ID,
      lastActiveDate: now,
      longestStreak,
      updatedAt: now,
    });
  }

  async getWeeklyProgress(): Promise<WeeklyProgressResult> {
    const progress = await this.getProgress();
    return buildWeeklyProgress(progress.stats, progress.dailyChallenges);
  }

  async getMonthlyStats(): Promise<{
    totalXP: number;
    levelsGained: number;
    achievementsUnlocked: number;
    challengesCompleted: number;
    actionsCount: number;
    streakDays: number;
  }> {
    const progress = await this.getProgress();
    return buildMonthlyStats({
      currentStreak: progress.currentStreak,
      dailyChallenges: progress.dailyChallenges,
      stats: progress.stats,
    });
  }

  async trackAction(
    statKey: keyof GamificationStats,
    xpAmount: number,
    reason: string,
  ): Promise<{ readonly xpAwarded: number; readonly reason: string }> {
    const progress = await this.getProgress();
    const currentStats = toNumericStats(progress.stats);
    const updatedStats: Partial<GamificationStats> = {
      ...currentStats,
      [statKey]: getNumericStat(currentStats, statKey) + 1,
    };

    const now = new Date().toISOString();
    await persistStats({
      id: this.DEFAULT_ID,
      stats: updatedStats,
      updatedAt: now,
    });

    await this.awardXP(xpAmount, reason);
    await this.checkAchievements(updatedStats);
    return { xpAwarded: xpAmount, reason };
  }

  trackActionFireAndForget(
    statKey: keyof GamificationStats,
    xpAmount: number,
    reason: string,
  ): void {
    settle(this.trackAction(statKey, xpAmount, reason)).then(
      (result) => {
        if (result.status === "rejected") {
          gamificationLogger.error("trackAction failed", {
            statKey,
            reason,
            err: result.reason instanceof Error ? result.reason.message : String(result.reason),
          });
        }
      },
      () => undefined,
    );
  }
}

export const gamificationService = new GamificationService();
