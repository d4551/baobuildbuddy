import type { SkillCategory } from "@bao/shared";

/**
 * Non-category sentinel used by UI filters to represent all mappings.
 */
export const SKILLS_FILTER_ALL_VALUE = "all";

/**
 * Minimum input length for game-expression entries.
 */
export const SKILLS_MIN_GAME_EXPRESSION_LENGTH = 2;

/**
 * Minimum input length for transferable-skill entries.
 */
export const SKILLS_MIN_TRANSFERABLE_SKILL_LENGTH = 2;

/**
 * Confidence slider bounds.
 */
export const SKILLS_CONFIDENCE_MIN = 0;
export const SKILLS_CONFIDENCE_MAX = 100;
export const SKILLS_DEFAULT_CONFIDENCE = 50;

/**
 * Number of top-confidence mappings shown in the skills insights preview.
 */
export const SKILLS_TOP_MAPPINGS_PREVIEW_LIMIT = 5;

/**
 * Readiness score thresholds used for progress color coding.
 */
export const SKILLS_READINESS_THRESHOLD_HIGH = 80;
export const SKILLS_READINESS_THRESHOLD_MEDIUM = 60;

/**
 * XP rewards for skill-mapper user actions.
 */
export const SKILLS_GAMIFICATION_XP = {
  mappingAdded: 20,
  aiAnalysisCompleted: 35,
} as const;

/**
 * Canonical gamification reasons emitted by skill-mapper actions.
 */
export const SKILLS_GAMIFICATION_REASONS = {
  mappingAdded: "skills_mapping_added",
  aiAnalysisCompleted: "skills_ai_analysis_completed",
} as const;

/**
 * Allowed gamification reason literals emitted by skill-mapper actions.
 */
export type SkillsGamificationReason =
  (typeof SKILLS_GAMIFICATION_REASONS)[keyof typeof SKILLS_GAMIFICATION_REASONS];

/**
 * Default category applied to new mappings.
 */
export const SKILLS_DEFAULT_CATEGORY: SkillCategory = "leadership";

/**
 * Translation keys for each canonical skill category.
 */
export const SKILLS_CATEGORY_LABEL_KEYS: Record<SkillCategory, string> = {
  leadership: "skillsPage.categories.leadership",
  community: "skillsPage.categories.community",
  technical: "skillsPage.categories.technical",
  creative: "skillsPage.categories.creative",
  analytical: "skillsPage.categories.analytical",
  communication: "skillsPage.categories.communication",
  project_management: "skillsPage.categories.projectManagement",
};

/**
 * Fallback demand level used for manual mapping creation.
 */
export const SKILLS_DEFAULT_DEMAND_LEVEL = "medium";
