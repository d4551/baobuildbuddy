import type { DailyChallenge, UserGamificationData, UserProfile } from "@bao/shared";
import type { RouteLocationRaw } from "vue-router";

export interface DashboardActivity {
  readonly type: string;
  readonly description: string;
  readonly timestamp: Date;
}

export interface DashboardChallengeViewModel {
  readonly id: string;
  readonly name: string;
  readonly xpReward: number;
  readonly completed: boolean;
  readonly progress: number;
  readonly goal: number;
}

export interface DashboardMetrics {
  readonly profileCompleteness: number;
  readonly savedJobs: number;
  readonly appliedJobs: number;
  readonly resumeCount: number;
  readonly coverLetterCount: number;
  readonly portfolioProjectCount: number;
  readonly automationRuns: number;
  readonly successfulAutomationRuns: number;
  readonly mappedSkillsCount: number;
  readonly interviewSessionCount: number;
}

export interface DashboardViewModel {
  readonly profile: UserProfile | null;
  readonly gamification: UserGamificationData | null;
  readonly dailyChallenge: DashboardChallengeViewModel | null;
  readonly recentActivity: readonly DashboardActivity[];
  readonly metrics: DashboardMetrics;
}

export interface DailyChallengesResponse {
  readonly challenges: DailyChallenge[];
  readonly completedCount: number;
  readonly totalCount: number;
  readonly date: string;
}

export interface DashboardStatCardViewModel {
  readonly id: string;
  readonly title: string;
  readonly to: RouteLocationRaw;
  readonly value: number;
  readonly iconPath: string;
  readonly accentClass: string;
  readonly ctaLabel: string;
  readonly ariaLabel: string;
}

export type DashboardUiState = "idle" | "loading" | "error" | "empty" | "success";
