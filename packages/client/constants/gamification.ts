import { APP_BRAND } from "@bao/shared";

/**
 * AsyncData key used by the gamification hub page.
 */
export const GAMIFICATION_ASYNC_DATA_KEY = "gamification-hub";

/**
 * Default goal fallback used when a challenge does not expose an explicit goal.
 */
export const GAMIFICATION_DEFAULT_CHALLENGE_GOAL = 1;

/**
 * Static UI copy for the gamification hub page.
 */
export const GAMIFICATION_COPY = {
  pageTitle: "Gamification Hub",
  metricsSummary: `${APP_BRAND.name} progression and challenge engine`,
  seoTitle: `${APP_BRAND.name} Gamification Hub`,
  seoDescription:
    "Track XP progression, daily challenge completion, streak consistency, and achievement unlocks in one view.",
  loadingSkeletonLines: 8,
  loadErrorFallback: "Failed to load gamification data",
  retryButtonLabel: "Retry",
  emptyStateTitle: "No progression data yet",
  emptyStateDescription:
    "Complete setup tasks, start interview practice, and take daily challenges to begin earning XP and unlocking achievements.",
  emptyStateCta: "Open Dashboard",
  levelPrefix: "Level",
  xpSuffix: "XP",
  xpUntilLevelLabel: "XP until level",
  currentStreakTitle: "Current Streak",
  longestStreakTitle: "Longest Streak",
  achievementsTitle: "Achievements",
  achievementsUnlockedLabel: "Unlocked",
  achievementsLockedLabel: "Locked",
  dailyChallengesTitle: "Daily Challenges",
  challengeClaimLabel: "Claim Reward",
  challengeDoneLabel: "Done",
  challengeCompletionToast: "Challenge completed",
  challengeCompleteErrorFallback: "Failed to complete challenge",
  streakDaysSuffix: "days in a row",
  longestStreakDesc: "personal best",
  noChallengesLabel: "No daily challenges available.",
} as const;
