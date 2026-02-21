import { getLevelForXP } from "@bao/shared";
import type {
  Achievement,
  DailyChallenge,
  GamificationStats,
  LevelUpResult,
  UserGamificationData,
} from "@bao/shared";
import { getGamificationAchievementIcon, getGamificationChallengeIcon } from "@bao/shared";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { gamification } from "../db/schema";

type ActionHistoryEntry = {
  action: string;
  xpGained: number;
  multiplier?: number;
  timestamp: string;
};

const resolveAchievementIcon = (achievementId: string): string =>
  getGamificationAchievementIcon(achievementId);

const resolveChallengeIcon = (challengeId: string): string =>
  getGamificationChallengeIcon(challengeId);

export class GamificationService {
  private readonly DEFAULT_ID = "default";
  private typeSafeStats(
    stats: Partial<GamificationStats> | null | undefined,
  ): Partial<GamificationStats> & { actionHistory: ActionHistoryEntry[] } {
    const normalized =
      stats && typeof stats === "object"
        ? ({ ...stats } as Partial<GamificationStats> & {
            actionHistory?: ActionHistoryEntry[];
          })
        : {};

    return {
      ...normalized,
      actionHistory: Array.isArray(normalized.actionHistory) ? normalized.actionHistory : [],
    };
  }

  /**
   * Get or create the gamification progress record
   */
  async getProgress(): Promise<UserGamificationData> {
    const results = await db
      .select()
      .from(gamification)
      .where(eq(gamification.id, this.DEFAULT_ID));

    if (results.length > 0) {
      const row = results[0];
      const progress: UserGamificationData = {
        xp: row.xp || 0,
        level: row.level || 1,
        achievements: row.achievements || [],
        dailyChallenges: row.dailyChallenges || {},
        longestStreak: row.longestStreak || 0,
        currentStreak: row.currentStreak || 0,
        stats: row.stats || {},
      };
      if (row.lastActiveDate) {
        progress.lastActiveDate = row.lastActiveDate;
      }
      return progress;
    }

    // Create default record
    const now = new Date().toISOString();
    await db.insert(gamification).values({
      id: this.DEFAULT_ID,
      xp: 0,
      level: 1,
      achievements: [],
      dailyChallenges: {},
      longestStreak: 0,
      currentStreak: 0,
      stats: {},
      createdAt: now,
      updatedAt: now,
    });

    return {
      xp: 0,
      level: 1,
      achievements: [],
      dailyChallenges: {},
      longestStreak: 0,
      currentStreak: 0,
      stats: {},
    };
  }

  /**
   * Get streak multiplier based on consecutive active days
   */
  private getStreakMultiplier(currentStreak: number): number {
    if (currentStreak >= 30) return 3.0;
    if (currentStreak >= 14) return 2.0;
    if (currentStreak >= 7) return 1.5;
    if (currentStreak >= 3) return 1.25;
    return 1.0;
  }

  /**
   * Award XP and handle level ups with streak multiplier
   */
  async awardXP(amount: number, reason: string): Promise<LevelUpResult | null> {
    const progress = await this.getProgress();
    const oldLevel = progress.level;
    const oldXP = progress.xp;

    // Apply streak multiplier
    const multiplier = this.getStreakMultiplier(progress.currentStreak);
    const adjustedAmount = Math.round(amount * multiplier);
    const newXP = oldXP + adjustedAmount;

    // Calculate new level
    const oldLevelData = getLevelForXP(oldXP);
    const newLevelData = getLevelForXP(newXP);
    const newLevel = newLevelData.level;

    // Update streak
    await this.updateStreak();

    // Track action in history
    const statsObj = this.typeSafeStats(progress.stats);
    const actionHistory = [...statsObj.actionHistory];
    actionHistory.push({
      action: reason,
      xpGained: adjustedAmount,
      multiplier,
      timestamp: new Date().toISOString(),
    });
    // Keep last 500 actions
    if (actionHistory.length > 500) actionHistory.splice(0, actionHistory.length - 500);

    // Update progress
    const now = new Date().toISOString();
    await db
      .update(gamification)
      .set({
        xp: newXP,
        level: newLevel,
        lastActiveDate: now,
        stats: { ...statsObj, actionHistory },
        updatedAt: now,
      })
      .where(eq(gamification.id, this.DEFAULT_ID));

    // Check for level up
    if (newLevel > oldLevel) {
      const unlockedFeatures = newLevelData.features || [];

      return {
        xpGained: adjustedAmount,
        oldLevel,
        newLevel,
        oldTitle: oldLevelData.title,
        newTitle: newLevelData.title,
        unlockedFeatures,
        bonusXP: adjustedAmount - amount,
      };
    }

    return null;
  }

  /**
   * Get all achievements with unlock status
   */
  async getAchievements(): Promise<Achievement[]> {
    const progress = await this.getProgress();
    const unlockedIds = progress.achievements;

    // Define all available achievements
    const allAchievements: Achievement[] = [
      {
        id: "first_resume",
        name: "Getting Started",
        description: "Create your first resume",
        icon: resolveAchievementIcon("first_resume"),
        iconType: "emoji",
        category: "progress",
        xpReward: 50,
        requirements: { resumesGenerated: 1 },
        unlocked: unlockedIds.includes("first_resume"),
        rarity: "common",
      },
      {
        id: "resume_master",
        name: "Resume Master",
        description: "Create 5 different resumes",
        icon: resolveAchievementIcon("resume_master"),
        iconType: "emoji",
        category: "milestone",
        xpReward: 200,
        requirements: { resumesGenerated: 5 },
        unlocked: unlockedIds.includes("resume_master"),
        rarity: "rare",
      },
      {
        id: "portfolio_builder",
        name: "Portfolio Builder",
        description: "Add 3 projects to your portfolio",
        icon: resolveAchievementIcon("portfolio_builder"),
        iconType: "emoji",
        category: "progress",
        xpReward: 100,
        requirements: { portfolioItems: 3 },
        unlocked: unlockedIds.includes("portfolio_builder"),
        rarity: "common",
      },
      {
        id: "skill_mapper",
        name: "Skill Mapper",
        description: "Map 10 gaming skills to career skills",
        icon: resolveAchievementIcon("skill_mapper"),
        iconType: "emoji",
        category: "skill",
        xpReward: 150,
        requirements: { skillsMapped: 10 },
        unlocked: unlockedIds.includes("skill_mapper"),
        rarity: "rare",
      },
      {
        id: "interview_ready",
        name: "Interview Ready",
        description: "Complete 5 mock interviews",
        icon: resolveAchievementIcon("interview_ready"),
        iconType: "emoji",
        category: "progress",
        xpReward: 250,
        requirements: { interviewsCompleted: 5 },
        unlocked: unlockedIds.includes("interview_ready"),
        rarity: "epic",
      },
      {
        id: "consistent_user",
        name: "Consistent User",
        description: "Maintain a 7-day streak",
        icon: resolveAchievementIcon("consistent_user"),
        iconType: "emoji",
        category: "special",
        xpReward: 300,
        requirements: { dailyStreak: 7 },
        unlocked: unlockedIds.includes("consistent_user"),
        rarity: "epic",
      },
      {
        id: "job_hunter",
        name: "Job Hunter",
        description: "Apply to 20 jobs",
        icon: resolveAchievementIcon("job_hunter"),
        iconType: "emoji",
        category: "progress",
        xpReward: 400,
        requirements: { jobApplications: 20 },
        unlocked: unlockedIds.includes("job_hunter"),
        rarity: "legendary",
      },
      {
        id: "explorer",
        name: "Studio Explorer",
        description: "Explore 10 different game studios",
        icon: resolveAchievementIcon("explorer"),
        iconType: "emoji",
        category: "progress",
        xpReward: 100,
        requirements: { studiosExplored: 10 },
        unlocked: unlockedIds.includes("explorer"),
        rarity: "common",
      },
      // --- 12 NEW ACHIEVEMENTS ---
      {
        id: "portfolio_pro",
        name: "Portfolio Pro",
        description: "Add 5 projects to your portfolio",
        icon: resolveAchievementIcon("portfolio_pro"),
        iconType: "emoji",
        category: "milestone",
        xpReward: 200,
        requirements: { portfolioItems: 5 },
        unlocked: unlockedIds.includes("portfolio_pro"),
        rarity: "rare",
      },
      {
        id: "interview_master",
        name: "Interview Master",
        description: "Complete 10 mock interviews",
        icon: resolveAchievementIcon("interview_master"),
        iconType: "emoji",
        category: "milestone",
        xpReward: 500,
        requirements: { interviewsCompleted: 10 },
        unlocked: unlockedIds.includes("interview_master"),
        rarity: "epic",
      },
      {
        id: "skill_cartographer",
        name: "Skill Cartographer",
        description: "Map 20 skills to career paths",
        icon: resolveAchievementIcon("skill_cartographer"),
        iconType: "emoji",
        category: "skill",
        xpReward: 300,
        requirements: { skillsMapped: 20 },
        unlocked: unlockedIds.includes("skill_cartographer"),
        rarity: "rare",
      },
      {
        id: "studio_scholar",
        name: "Studio Scholar",
        description: "Explore 25 different game studios",
        icon: resolveAchievementIcon("studio_scholar"),
        iconType: "emoji",
        category: "progress",
        xpReward: 150,
        requirements: { studiosExplored: 25 },
        unlocked: unlockedIds.includes("studio_scholar"),
        rarity: "rare",
      },
      {
        id: "ai_collaborator",
        name: "AI Collaborator",
        description: "Have 50 AI chat conversations",
        icon: resolveAchievementIcon("ai_collaborator"),
        iconType: "emoji",
        category: "special",
        xpReward: 250,
        requirements: { chatSessions: 50 },
        unlocked: unlockedIds.includes("ai_collaborator"),
        rarity: "rare",
      },
      {
        id: "cover_letter_crafter",
        name: "Cover Letter Crafter",
        description: "Generate 5 cover letters",
        icon: resolveAchievementIcon("cover_letter_crafter"),
        iconType: "emoji",
        category: "progress",
        xpReward: 200,
        requirements: { coverLettersGenerated: 5 },
        unlocked: unlockedIds.includes("cover_letter_crafter"),
        rarity: "rare",
      },
      {
        id: "job_hunter_elite",
        name: "Job Hunter Elite",
        description: "Save 50 jobs to your board",
        icon: resolveAchievementIcon("job_hunter_elite"),
        iconType: "emoji",
        category: "milestone",
        xpReward: 500,
        requirements: { jobsSaved: 50 },
        unlocked: unlockedIds.includes("job_hunter_elite"),
        rarity: "epic",
      },
      {
        id: "perfect_score",
        name: "Perfect Score",
        description: "Score 90+ on a mock interview",
        icon: resolveAchievementIcon("perfect_score"),
        iconType: "emoji",
        category: "special",
        xpReward: 750,
        requirements: { interviewScore: 90 },
        unlocked: unlockedIds.includes("perfect_score"),
        rarity: "legendary",
      },
      {
        id: "streak_legend",
        name: "Streak Legend",
        description: "Maintain a 30-day activity streak",
        icon: resolveAchievementIcon("streak_legend"),
        iconType: "emoji",
        category: "special",
        xpReward: 1000,
        requirements: { dailyStreak: 30 },
        unlocked: unlockedIds.includes("streak_legend"),
        rarity: "legendary",
      },
      {
        id: "data_guardian",
        name: "Data Guardian",
        description: "Export your data for the first time",
        icon: resolveAchievementIcon("data_guardian"),
        iconType: "emoji",
        category: "progress",
        xpReward: 100,
        requirements: { dataExported: 1 },
        unlocked: unlockedIds.includes("data_guardian"),
        rarity: "common",
      },
      {
        id: "early_bird",
        name: "Early Bird",
        description: "Log in before 8 AM",
        icon: resolveAchievementIcon("early_bird"),
        iconType: "emoji",
        category: "special",
        xpReward: 50,
        requirements: { earlyLogin: 1 },
        unlocked: unlockedIds.includes("early_bird"),
        rarity: "common",
      },
      {
        id: "completionist",
        name: "Completionist",
        description: "Fill out 100% of your profile",
        icon: resolveAchievementIcon("completionist"),
        iconType: "emoji",
        category: "milestone",
        xpReward: 1000,
        requirements: { profileComplete: 100 },
        unlocked: unlockedIds.includes("completionist"),
        rarity: "legendary",
      },
    ];

    return allAchievements;
  }

  /**
   * Check and unlock achievements based on current stats
   */
  async checkAchievements(stats: Partial<GamificationStats>): Promise<Achievement[]> {
    const progress = await this.getProgress();
    const achievements = await this.getAchievements();
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of achievements) {
      if (achievement.unlocked) continue;

      // Check if requirements are met
      const requirementsMet = Object.entries(achievement.requirements).every(([key, value]) => {
        const pendingStats = stats as Partial<Record<string, number>>;
        const existingStats = progress.stats as Partial<Record<string, number>>;
        const statValue = pendingStats[key] || existingStats[key] || 0;
        return statValue >= value;
      });

      if (requirementsMet) {
        // Unlock achievement
        const updatedAchievements = [...progress.achievements, achievement.id];
        const now = new Date().toISOString();

        await db
          .update(gamification)
          .set({
            achievements: updatedAchievements,
            updatedAt: now,
          })
          .where(eq(gamification.id, this.DEFAULT_ID));

        // Award XP
        await this.awardXP(achievement.xpReward, `Achievement unlocked: ${achievement.name}`);

        achievement.unlocked = true;
        achievement.unlockedAt = now;
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Get daily challenges
   */
  async getDailyChallenges(): Promise<DailyChallenge[]> {
    const progress = await this.getProgress();
    const today = new Date().toISOString().split("T")[0];

    // Check if we have challenges for today
    const todaysChallenges = progress.dailyChallenges[today] || [];

    // If we already have challenges for today, return them
    if (todaysChallenges.length > 0) {
      return this.getDefinedChallenges().map((challenge) => ({
        ...challenge,
        completed: todaysChallenges.includes(challenge.id),
      }));
    }

    // Generate new challenges for today (all uncompleted)
    return this.getDefinedChallenges().map((challenge) => ({
      ...challenge,
      completed: false,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }));
  }

  /**
   * Get predefined daily challenges
   */
  private getDefinedChallenges(): DailyChallenge[] {
    return [
      {
        id: "update_profile",
        name: "Profile Polisher",
        description: "Update your profile or resume",
        icon: resolveChallengeIcon("update_profile"),
        iconType: "emoji",
        xpReward: 25,
        category: "profile",
        completed: false,
      },
      {
        id: "apply_job",
        name: "Job Application",
        description: "Apply to at least one job",
        icon: resolveChallengeIcon("apply_job"),
        iconType: "emoji",
        xpReward: 50,
        category: "job_search",
        completed: false,
      },
      {
        id: "map_skill",
        name: "Skill Mapper",
        description: "Map a gaming skill to a career skill",
        icon: resolveChallengeIcon("map_skill"),
        iconType: "emoji",
        xpReward: 30,
        category: "skill_building",
        completed: false,
      },
      {
        id: "practice_interview",
        name: "Interview Practice",
        description: "Complete a mock interview",
        icon: resolveChallengeIcon("practice_interview"),
        iconType: "emoji",
        xpReward: 75,
        category: "skill_building",
        completed: false,
      },
      {
        id: "explore_studio",
        name: "Studio Explorer",
        description: "Explore a new game studio",
        icon: resolveChallengeIcon("explore_studio"),
        iconType: "emoji",
        xpReward: 20,
        category: "engagement",
        completed: false,
      },
      // --- 5 NEW DAILY CHALLENGES ---
      {
        id: "interview_sprint",
        name: "Interview Sprint",
        description: "Complete an interview session",
        icon: resolveChallengeIcon("interview_sprint"),
        iconType: "emoji",
        xpReward: 75,
        category: "skill_building",
        completed: false,
      },
      {
        id: "skill_discovery",
        name: "Skill Discovery",
        description: "Map 2 new gaming skills",
        icon: resolveChallengeIcon("skill_discovery"),
        iconType: "emoji",
        xpReward: 40,
        category: "skill_building",
        completed: false,
      },
      {
        id: "network_builder",
        name: "Network Builder",
        description: "Research 3 gaming studios",
        icon: resolveChallengeIcon("network_builder"),
        iconType: "emoji",
        xpReward: 35,
        category: "engagement",
        completed: false,
      },
      {
        id: "portfolio_polish",
        name: "Portfolio Polish",
        description: "Update a portfolio project",
        icon: resolveChallengeIcon("portfolio_polish"),
        iconType: "emoji",
        xpReward: 45,
        category: "profile",
        completed: false,
      },
      {
        id: "ai_deep_dive",
        name: "AI Deep Dive",
        description: "Have a 5+ turn AI conversation",
        icon: resolveChallengeIcon("ai_deep_dive"),
        iconType: "emoji",
        xpReward: 60,
        category: "engagement",
        completed: false,
      },
    ];
  }

  /**
   * Complete a daily challenge
   */
  async completeChallenge(challengeId: string): Promise<boolean> {
    const progress = await this.getProgress();
    const today = new Date().toISOString().split("T")[0];

    const todaysChallenges = progress.dailyChallenges[today] || [];

    // Check if already completed
    if (todaysChallenges.includes(challengeId)) {
      return false;
    }

    // Find the challenge to get XP reward
    const challenges = this.getDefinedChallenges();
    const challenge = challenges.find((c) => c.id === challengeId);

    if (!challenge) {
      return false;
    }

    // Mark as completed
    const updatedChallenges = {
      ...progress.dailyChallenges,
      [today]: [...todaysChallenges, challengeId],
    };

    const now = new Date().toISOString();
    await db
      .update(gamification)
      .set({
        dailyChallenges: updatedChallenges,
        updatedAt: now,
      })
      .where(eq(gamification.id, this.DEFAULT_ID));

    // Award XP
    await this.awardXP(challenge.xpReward, `Daily challenge completed: ${challenge.name}`);

    return true;
  }

  /**
   * Update consecutive active day streak
   */
  async updateStreak(): Promise<void> {
    const progress = await this.getProgress();
    const today = new Date().toISOString().split("T")[0];
    const lastActive = progress.lastActiveDate?.split("T")[0];

    if (!lastActive || lastActive === today) {
      // Same day or first activity, no change needed
      return;
    }

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    let newStreak = progress.currentStreak;

    if (lastActive === yesterday) {
      // Consecutive day
      newStreak += 1;
    } else {
      // Streak broken
      newStreak = 1;
    }

    const newLongest = Math.max(progress.longestStreak, newStreak);

    const now = new Date().toISOString();
    await db
      .update(gamification)
      .set({
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActiveDate: now,
        updatedAt: now,
      })
      .where(eq(gamification.id, this.DEFAULT_ID));
  }
  /**
   * Get weekly progress from action history
   */
  async getWeeklyProgress(): Promise<{
    challengesCompleted: number;
    xpEarned: number;
    actionsCount: number;
    days: Array<{ date: string; actions: number; xpEarned: number }>;
    topCategory: string;
  }> {
    const progress = await this.getProgress();
    const statsObj = this.typeSafeStats(progress.stats);
    const actionHistory = statsObj.actionHistory;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Filter actions from last 7 days
    const weekActions = actionHistory.filter((a) => {
      const ts = new Date(a.timestamp);
      return ts >= weekAgo && ts <= now;
    });

    // Group by day
    const dayMap = new Map<string, { actions: number; xpEarned: number }>();
    const categoryCount = new Map<string, number>();

    for (const action of weekActions) {
      const date = action.timestamp.split("T")[0];
      const existing = dayMap.get(date) || { actions: 0, xpEarned: 0 };
      existing.actions++;
      existing.xpEarned += action.xpGained || 0;
      dayMap.set(date, existing);

      // Track categories
      const category = action.action?.split(":")[0] || "general";
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    }

    // Build days array for last 7 days
    const days: Array<{ date: string; actions: number; xpEarned: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const dayData = dayMap.get(date) || { actions: 0, xpEarned: 0 };
      days.push({ date, ...dayData });
    }

    // Find top category
    let topCategory = "general";
    let topCount = 0;
    for (const [cat, cnt] of categoryCount) {
      if (cnt > topCount) {
        topCategory = cat;
        topCount = cnt;
      }
    }

    // Count challenge completions from dailyChallenges
    let challengesCompleted = 0;
    for (const [dateKey, completed] of Object.entries(progress.dailyChallenges)) {
      const dateObj = new Date(dateKey);
      if (dateObj >= weekAgo && dateObj <= now && Array.isArray(completed)) {
        challengesCompleted += completed.length;
      }
    }

    return {
      challengesCompleted,
      xpEarned: weekActions.reduce((sum, a) => sum + (a.xpGained || 0), 0),
      actionsCount: weekActions.length,
      days,
      topCategory,
    };
  }

  /**
   * Get monthly statistics
   */
  async getMonthlyStats(): Promise<{
    totalXP: number;
    levelsGained: number;
    achievementsUnlocked: number;
    challengesCompleted: number;
    actionsCount: number;
    streakDays: number;
  }> {
    const progress = await this.getProgress();
    const statsObj = this.typeSafeStats(progress.stats);
    const actionHistory = statsObj.actionHistory;

    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter actions from last 30 days
    const monthActions = actionHistory.filter((a) => {
      const ts = new Date(a.timestamp);
      return ts >= monthAgo && ts <= now;
    });

    const totalXP = monthActions.reduce((sum, a) => sum + (a.xpGained || 0), 0);

    // Count levels gained (approximate from XP)
    const levelsGained = Math.floor(totalXP / 100);

    // Count achievement unlocks from action history
    const achievementsUnlocked = monthActions.filter((a) =>
      a.action?.startsWith("Achievement unlocked:"),
    ).length;

    // Count challenge completions
    let challengesCompleted = 0;
    for (const [dateKey, completed] of Object.entries(progress.dailyChallenges)) {
      const dateObj = new Date(dateKey);
      if (dateObj >= monthAgo && dateObj <= now && Array.isArray(completed)) {
        challengesCompleted += completed.length;
      }
    }

    return {
      totalXP,
      levelsGained,
      achievementsUnlocked,
      challengesCompleted,
      actionsCount: monthActions.length,
      streakDays: Math.min(progress.currentStreak, 30),
    };
  }
}

export const gamificationService = new GamificationService();
