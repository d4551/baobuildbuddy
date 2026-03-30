import type {
  Achievement,
  DailyChallenge,
  GamificationActionHistoryEntry,
  GamificationStats,
  LevelUpResult,
  UserGamificationData,
} from "@bao/shared";
import {
  DEFAULT_PROFILE_ID,
  getGamificationAchievementIcon,
  getGamificationChallengeIcon,
  getLevelForXP,
  isRecord,
  MS_PER_DAY,
  SCHEMA_MAX_ITEMS_BOARDS,
  settle,
} from "@bao/shared";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { gamification } from "../db/schema/schema-modules";
import { createServerLogger } from "../utils/logger";

const gamificationLogger = createServerLogger("gamification");

type ActionHistoryEntry = GamificationActionHistoryEntry;
type AchievementDefinition = Omit<Achievement, "unlocked" | "unlockedAt">;
type WeeklyDaySummary = { date: string; actions: number; xpEarned: number };
type WeeklyProgressResult = {
  challengesCompleted: number;
  xpEarned: number;
  actionsCount: number;
  days: WeeklyDaySummary[];
  topCategory: string;
};

const resolveAchievementIcon = (achievementId: string): string =>
  getGamificationAchievementIcon(achievementId);

const resolveChallengeIcon = (challengeId: string): string =>
  getGamificationChallengeIcon(challengeId);
const MAX_ACTION_HISTORY = SCHEMA_MAX_ITEMS_BOARDS;
const WEEK_DAYS = 7;
const GAMIFICATION_STAT_KEYS: Array<keyof GamificationStats> = [
  "profileComplete",
  "skillsMapped",
  "portfolioItems",
  "jobApplications",
  "chatSessions",
  "resumesGenerated",
  "coverLettersGenerated",
  "savedJobs",
  "jobsSaved",
  "interviewScore",
  "dataExported",
  "earlyLogin",
  "totalTimeSpent",
  "featuresUsed",
  "dailyStreak",
  "weeklyProgress",
  "interviewsCompleted",
  "studiosExplored",
];
type NumericGamificationStats = Partial<Record<string, number>>;
const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: "first_resume",
    name: "Getting Started",
    description: "Create your first resume",
    icon: resolveAchievementIcon("first_resume"),
    iconType: "emoji",
    category: "progress",
    xpReward: 50,
    requirements: { resumesGenerated: 1 },
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
    rarity: "common",
  },
  {
    id: "portfolio_pro",
    name: "Portfolio Pro",
    description: "Add 5 projects to your portfolio",
    icon: resolveAchievementIcon("portfolio_pro"),
    iconType: "emoji",
    category: "milestone",
    xpReward: 200,
    requirements: { portfolioItems: 5 },
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
    rarity: "legendary",
  },
];
const DAILY_CHALLENGE_DEFINITIONS: DailyChallenge[] = [
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

export class GamificationService {
  private readonly DEFAULT_ID = DEFAULT_PROFILE_ID;
  private typeSafeStats(
    stats: Partial<GamificationStats> | null | undefined,
  ): Partial<GamificationStats> & { actionHistory: ActionHistoryEntry[] } {
    return {
      ...this.toNumericStats(stats),
      actionHistory: this.toActionHistory(stats),
    };
  }

  private toNumericStats(
    stats: Partial<GamificationStats> | null | undefined,
  ): NumericGamificationStats {
    if (!stats || typeof stats !== "object") {
      return {};
    }

    const normalized: NumericGamificationStats = {};
    for (const key of GAMIFICATION_STAT_KEYS) {
      const value = stats[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        normalized[key] = value;
      }
    }
    return normalized;
  }

  private toActionHistory(stats: unknown): ActionHistoryEntry[] {
    if (!isRecord(stats)) {
      return [];
    }

    const rawHistory = stats.actionHistory;
    if (!Array.isArray(rawHistory)) {
      return [];
    }

    return rawHistory.filter(
      (entry): entry is ActionHistoryEntry =>
        isRecord(entry) &&
        typeof entry.action === "string" &&
        typeof entry.xpGained === "number" &&
        typeof entry.timestamp === "string",
    );
  }

  private isNumberValue(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
  }

  private getNumericStat(stats: NumericGamificationStats, key: string): number {
    const value = stats[key];
    return this.isNumberValue(value) ? value : 0;
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
    const baseXP = progress.xp;
    const multiplier = this.getStreakMultiplier(progress.currentStreak);
    const adjustedAmount = Math.round(amount * multiplier);
    const oldLevelData = getLevelForXP(baseXP);
    const newXP = baseXP + adjustedAmount;
    const newLevelData = getLevelForXP(newXP);
    const now = new Date().toISOString();
    const statsObj = this.typeSafeStats(progress.stats);

    await this.updateStreak();
    await this.persistAwardedXP(newXP, newLevelData.level, statsObj, {
      action: reason,
      xpGained: adjustedAmount,
      multiplier,
      timestamp: now,
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

  private async persistAwardedXP(
    newXP: number,
    newLevel: number,
    statsObj: Partial<GamificationStats> & { actionHistory: ActionHistoryEntry[] },
    actionEntry: ActionHistoryEntry,
  ): Promise<void> {
    const actionHistory = this.appendActionHistoryEntry(statsObj.actionHistory, actionEntry);
    const now = actionEntry.timestamp;
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
  }

  private appendActionHistoryEntry(
    actionHistory: ActionHistoryEntry[],
    entry: ActionHistoryEntry,
  ): ActionHistoryEntry[] {
    const updated = [...actionHistory, entry];
    if (updated.length <= MAX_ACTION_HISTORY) {
      return updated;
    }
    return updated.slice(updated.length - MAX_ACTION_HISTORY);
  }

  /**
   * Get all achievements with unlock status
   */
  async getAchievements(): Promise<Achievement[]> {
    const progress = await this.getProgress();
    const unlockedIds = new Set(progress.achievements);
    return ACHIEVEMENT_DEFINITIONS.map((achievement) => ({
      ...achievement,
      unlocked: unlockedIds.has(achievement.id),
    }));
  }

  /**
   * Check and unlock achievements based on current stats
   */
  async checkAchievements(stats: Partial<GamificationStats>): Promise<Achievement[]> {
    const progress = await this.getProgress();
    const achievements = await this.getAchievements();
    const pendingStats = this.toNumericStats(stats);
    const existingStats = this.toNumericStats(progress.stats);
    const unlockable = achievements.filter(
      (achievement) =>
        !achievement.unlocked &&
        this.areAchievementRequirementsMet(achievement, pendingStats, existingStats),
    );

    if (unlockable.length === 0) {
      return [];
    }

    const now = new Date().toISOString();
    const unlockedIds = [
      ...progress.achievements,
      ...unlockable.map((achievement) => achievement.id),
    ];
    await db
      .update(gamification)
      .set({
        achievements: Array.from(new Set(unlockedIds)),
        updatedAt: now,
      })
      .where(eq(gamification.id, this.DEFAULT_ID));
    await this.awardAchievementsSequentially(unlockable, 0);
    return unlockable.map((achievement) => ({ ...achievement, unlocked: true, unlockedAt: now }));
  }

  private areAchievementRequirementsMet(
    achievement: Achievement,
    pendingStats: NumericGamificationStats,
    existingStats: NumericGamificationStats,
  ): boolean {
    return Object.entries(achievement.requirements).every(([key, requiredValue]) => {
      const pendingValue = this.getNumericStat(pendingStats, key);
      const existingValue = this.getNumericStat(existingStats, key);
      const statValue = pendingValue || existingValue;
      return statValue >= requiredValue;
    });
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
      validUntil: new Date(Date.now() + MS_PER_DAY).toISOString(),
    }));
  }

  /**
   * Get predefined daily challenges
   */
  private getDefinedChallenges(): DailyChallenge[] {
    return DAILY_CHALLENGE_DEFINITIONS.map((challenge) => ({ ...challenge }));
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

    const yesterday = new Date(Date.now() - MS_PER_DAY).toISOString().split("T")[0];

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
  async getWeeklyProgress(): Promise<WeeklyProgressResult> {
    const progress = await this.getProgress();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - WEEK_DAYS * MS_PER_DAY);
    const actionHistory = this.typeSafeStats(progress.stats).actionHistory;
    const weekActions = this.filterActionsByDate(actionHistory, weekAgo, now);
    const dayMap = this.groupActionsByDate(weekActions);
    const categoryCount = this.groupCategoriesByAction(weekActions);

    return {
      challengesCompleted: this.countCompletedChallenges(progress.dailyChallenges, weekAgo, now),
      xpEarned: weekActions.reduce((sum, a) => sum + (a.xpGained || 0), 0),
      actionsCount: weekActions.length,
      days: this.buildWeeklyDaySummaries(now, dayMap),
      topCategory: this.resolveTopCategory(categoryCount),
    };
  }

  private filterActionsByDate(
    actions: ActionHistoryEntry[],
    start: Date,
    end: Date,
  ): ActionHistoryEntry[] {
    return actions.filter((action) => {
      const timestamp = new Date(action.timestamp);
      return timestamp >= start && timestamp <= end;
    });
  }

  private groupActionsByDate(
    actions: ActionHistoryEntry[],
  ): Map<string, { actions: number; xpEarned: number }> {
    const dayMap = new Map<string, { actions: number; xpEarned: number }>();
    for (const action of actions) {
      const day = action.timestamp.split("T")[0];
      const existing = dayMap.get(day) || { actions: 0, xpEarned: 0 };
      dayMap.set(day, {
        actions: existing.actions + 1,
        xpEarned: existing.xpEarned + (action.xpGained || 0),
      });
    }
    return dayMap;
  }

  private groupCategoriesByAction(actions: ActionHistoryEntry[]): Map<string, number> {
    const categoryCount = new Map<string, number>();
    for (const action of actions) {
      const category = action.action?.split(":")[0] || "general";
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    }
    return categoryCount;
  }

  private buildWeeklyDaySummaries(
    now: Date,
    dayMap: Map<string, { actions: number; xpEarned: number }>,
  ): WeeklyDaySummary[] {
    const days: WeeklyDaySummary[] = [];
    for (let offset = WEEK_DAYS - 1; offset >= 0; offset--) {
      const date = new Date(now.getTime() - offset * MS_PER_DAY).toISOString().split("T")[0];
      const dayData = dayMap.get(date) || { actions: 0, xpEarned: 0 };
      days.push({ date, ...dayData });
    }
    return days;
  }

  private resolveTopCategory(categoryCount: Map<string, number>): string {
    let topCategory = "general";
    let topCount = 0;
    for (const [category, count] of categoryCount) {
      if (count > topCount) {
        topCategory = category;
        topCount = count;
      }
    }
    return topCategory;
  }

  private countCompletedChallenges(
    dailyChallenges: Record<string, string[]>,
    start: Date,
    end: Date,
  ): number {
    let challengesCompleted = 0;
    for (const [dateKey, completed] of Object.entries(dailyChallenges)) {
      const date = new Date(dateKey);
      if (date >= start && date <= end && Array.isArray(completed)) {
        challengesCompleted += completed.length;
      }
    }
    return challengesCompleted;
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
    const monthAgo = new Date(now.getTime() - 30 * MS_PER_DAY);

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

  /**
   * Increment a stat counter, award XP, and check for newly unlocked achievements.
   */
  async trackAction(
    statKey: keyof GamificationStats,
    xpAmount: number,
    reason: string,
  ): Promise<void> {
    const progress = await this.getProgress();
    const currentStats = this.toNumericStats(progress.stats);
    const currentValue = this.getNumericStat(currentStats, statKey);
    const updatedStats: Partial<GamificationStats> = {
      ...currentStats,
      [statKey]: currentValue + 1,
    };

    const now = new Date().toISOString();
    await db
      .update(gamification)
      .set({ stats: updatedStats, updatedAt: now })
      .where(eq(gamification.id, this.DEFAULT_ID));

    await this.awardXP(xpAmount, reason);
    await this.checkAchievements(updatedStats);
  }

  /**
   * Fire-and-forget trackAction for use in route handlers. Logs errors without blocking response.
   */
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
