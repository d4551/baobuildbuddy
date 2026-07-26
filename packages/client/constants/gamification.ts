/**
 * AsyncData key used by the gamification hub page.
 */
export const GAMIFICATION_ASYNC_DATA_KEY = "gamification-hub";

/**
 * Default goal fallback used when a challenge does not expose an explicit goal.
 */
export const GAMIFICATION_DEFAULT_CHALLENGE_GOAL = 1;

/**
 * Skeleton line count for loading state.
 */
export const GAMIFICATION_LOADING_SKELETON_LINES = 8;

/**
 * Progressbar value floor used across gamification UI components.
 */
export const GAMIFICATION_PROGRESS_MIN = 0;

/**
 * Progressbar value cap used across gamification UI components.
 */
export const GAMIFICATION_PROGRESS_MAX = 100;

/**
 * Fallback target XP when a level transition is unavailable.
 */
export const GAMIFICATION_XP_TARGET_FALLBACK = 100;

/**
 * Shared iconography — AppIcon registry names (no emoji literals in surfaces).
 */
export const GAMIFICATION_LEVEL_ICON = "IconSparkles" as const;
export const GAMIFICATION_CURRENT_STREAK_ICON = "IconBolt" as const;
export const GAMIFICATION_LONGEST_STREAK_ICON = "IconCheckCircle" as const;
export const GAMIFICATION_ACHIEVEMENTS_ICON = "IconBolt" as const;
