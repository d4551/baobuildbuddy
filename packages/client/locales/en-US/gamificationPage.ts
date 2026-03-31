const gamificationPage = {
  gamificationPage: {
    pageTitle: "Gamification Hub",
    metricsSummary: "{brand} progression and challenge engine",
    seoTitle: "{brand} Gamification Hub",
    seoDescription:
      "Track XP progression, daily challenge completion, streak consistency, and achievement unlocks in one view.",
    loadErrorFallback: "Failed to load gamification data",
    retryButtonLabel: "Retry",
    retryAria: "Retry loading gamification data",
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
    challengeClaimAria: "Claim reward for challenge {challenge}",
    challengeDoneLabel: "Done",
    challengeCompletionToast: "Challenge completed",
    challengeCompleteErrorFallback: "Failed to complete challenge",
    streakDaysSuffix: "days in a row",
    longestStreakDesc: "personal best",
    noChallengesLabel: "No daily challenges available.",
    a11y: {
      levelProgress: "Level progression",
      challengeProgress: "Challenge progression",
    },
    achievementBadgeAria: "Achievement: {name}. {description}",
  },
} as const;

export default gamificationPage;
