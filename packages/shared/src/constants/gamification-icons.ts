/**
 * Canonical gamification icon assets shared across server and client.
 */

/**
 * Canonical icon for each gamification achievement by identifier.
 */
export const GAMIFICATION_ACHIEVEMENT_ICON_BY_ID = {
  first_resume: "📄",
  resume_master: "🏆",
  portfolio_builder: "💼",
  skill_mapper: "🧭",
  interview_ready: "🎤",
  consistent_user: "🔥",
  job_hunter: "🎯",
  explorer: "🧭",
  portfolio_pro: "⭐",
  interview_master: "🥇",
  skill_cartographer: "🧭",
  studio_scholar: "🎓",
  ai_collaborator: "🤖",
  cover_letter_crafter: "📝",
  job_hunter_elite: "🥅",
  perfect_score: "🏅",
  streak_legend: "🔥",
  data_guardian: "🛡️",
  early_bird: "🌅",
  completionist: "✅",
} as const;

/**
 * Canonical icon for each daily gamification challenge by identifier.
 */
export const GAMIFICATION_CHALLENGE_ICON_BY_ID = {
  update_profile: "🧠",
  apply_job: "📩",
  map_skill: "🧩",
  practice_interview: "🎤",
  explore_studio: "🕹️",
  interview_sprint: "⏱️",
  skill_discovery: "💡",
  network_builder: "🤝",
  portfolio_polish: "🎨",
  ai_deep_dive: "🧠",
} as const;

/**
 * Canonical icon for each career pathway type by identifier.
 */
export const GAMIFICATION_PATHWAY_ICON_BY_ID = {
  technical: "💻",
  leadership: "🤝",
  community: "👥",
  creative: "🎨",
  analytical: "📈",
  communication: "🗣️",
  project_management: "📋",
} as const;

/**
 * Fallback icon when no mapping exists.
 */
export const GAMIFICATION_ICON_FALLBACK = "🎮" as const;

/**
 * Achievement identifier keys backed by the gamification icon map.
 */
export type GamificationAchievementIconId = keyof typeof GAMIFICATION_ACHIEVEMENT_ICON_BY_ID;

/**
 * Challenge identifier keys backed by the gamification challenge icon map.
 */
export type GamificationChallengeIconId = keyof typeof GAMIFICATION_CHALLENGE_ICON_BY_ID;

/**
 * Career pathway identifier keys backed by the career pathway icon map.
 */
export type GamificationPathwayIconId = keyof typeof GAMIFICATION_PATHWAY_ICON_BY_ID;

/**
 * Type guard for challenge icon keys.
 */
const isGamificationChallengeIconId = (value: string): value is GamificationChallengeIconId =>
  Object.hasOwn(GAMIFICATION_CHALLENGE_ICON_BY_ID, value);

/**
 * Type guard for achievement icon keys.
 */
const isGamificationAchievementIconId = (value: string): value is GamificationAchievementIconId =>
  Object.hasOwn(GAMIFICATION_ACHIEVEMENT_ICON_BY_ID, value);

/**
 * Type guard for pathway icon keys.
 */
const isGamificationPathwayIconId = (value: string): value is GamificationPathwayIconId =>
  Object.hasOwn(GAMIFICATION_PATHWAY_ICON_BY_ID, value);

/**
 * Resolves an icon by challenge identifier.
 */
export function getGamificationChallengeIcon(challengeId: string): string {
  if (isGamificationChallengeIconId(challengeId)) {
    return GAMIFICATION_CHALLENGE_ICON_BY_ID[challengeId];
  }

  return GAMIFICATION_ICON_FALLBACK;
}

/**
 * Resolves an icon by achievement identifier.
 */
export function getGamificationAchievementIcon(achievementId: string): string {
  if (isGamificationAchievementIconId(achievementId)) {
    return GAMIFICATION_ACHIEVEMENT_ICON_BY_ID[achievementId];
  }

  return GAMIFICATION_ICON_FALLBACK;
}

/**
 * Resolves an icon by pathway identifier.
 */
export function getGamificationPathwayIcon(pathwayId: string): string {
  if (isGamificationPathwayIconId(pathwayId)) {
    return GAMIFICATION_PATHWAY_ICON_BY_ID[pathwayId];
  }

  return GAMIFICATION_ICON_FALLBACK;
}
