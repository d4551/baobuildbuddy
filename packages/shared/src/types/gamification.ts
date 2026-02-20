/**
 * Gamification system types
 */

export interface GamificationStats {
  profileComplete: number;
  skillsMapped: number;
  portfolioItems: number;
  jobApplications: number;
  chatSessions: number;
  resumesGenerated: number;
  savedJobs: number;
  totalTimeSpent: number;
  featuresUsed: number;
  dailyStreak: number;
  weeklyProgress: number;
  interviewsCompleted: number;
  studiosExplored: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconType: "mdi" | "emoji" | "custom";
  category: "progress" | "social" | "skill" | "special" | "milestone";
  xpReward: number;
  requirements: Record<string, number>;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  hidden?: boolean;
}

export interface DailyChallenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconType: "mdi" | "emoji" | "custom";
  xpReward: number;
  category: "profile" | "job_search" | "skill_building" | "social" | "engagement";
  completed: boolean;
  requirements?: Record<string, number>;
  validUntil?: string;
  progress?: number;
  goal?: number;
}

export interface XPLevel {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
  accentColor:
    | "base-content"
    | "neutral"
    | "primary"
    | "secondary"
    | "accent"
    | "info"
    | "success"
    | "warning"
    | "error";
  features: string[];
}

export interface UserGamificationData {
  xp: number;
  level: number;
  achievements: string[];
  dailyChallenges: Record<string, string[]>;
  longestStreak: number;
  currentStreak: number;
  lastActiveDate?: string;
  stats: Partial<GamificationStats>;
  xpForNextLevel?: number;
  streak?: number;
}

export interface StreakInfo {
  current: number;
  longest: number;
  isNewRecord: boolean;
  lastActivity: string;
  multiplier: number;
}

export interface LevelUpResult {
  xpGained: number;
  oldLevel: number;
  newLevel: number;
  oldTitle: string;
  newTitle: string;
  unlockedFeatures: string[];
  bonusXP?: number;
}

export interface AchievementUnlockResult {
  achievement: Achievement;
  xpGained: number;
  totalAchievements: number;
}

export interface GamificationNotification {
  id: string;
  type: "xp_gain" | "level_up" | "achievement" | "challenge_complete" | "streak" | "milestone";
  title: string;
  message: string;
  icon: string;
  duration: number;
  priority: "low" | "medium" | "high";
  timestamp: string;
}
