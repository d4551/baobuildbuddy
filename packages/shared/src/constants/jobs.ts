import type { GameGenre, JobExperienceLevel, JobType, Platform, StudioType } from "../types/jobs";

/**
 * Sentinel value used by UI filters to represent "no active filter".
 */
export const JOB_FILTER_ALL_VALUE = "all";

/**
 * Canonical list of supported studio categories for job enrichment and filtering.
 */
export const JOB_STUDIO_TYPES: readonly StudioType[] = [
  "AAA",
  "Indie",
  "Mobile",
  "VR/AR",
  "Platform",
  "Esports",
  "Unknown",
];

/**
 * Canonical list of supported game genres for job enrichment and filtering.
 */
export const JOB_GAME_GENRES: readonly GameGenre[] = [
  "Action",
  "RPG",
  "Strategy",
  "Puzzle",
  "Simulation",
  "Sports",
  "Racing",
  "Shooter",
  "Platformer",
  "Horror",
  "MMORPG",
  "MOBA",
  "Battle Royale",
  "Roguelike",
  "Sandbox",
  "Adventure",
  "Fighting",
  "Survival",
  "Card Game",
  "Casual",
  "Indie",
];

/**
 * Canonical list of supported target platforms for job enrichment and filtering.
 */
export const JOB_SUPPORTED_PLATFORMS: readonly Platform[] = [
  "PC",
  "Console",
  "Mobile",
  "VR",
  "AR",
  "Web",
  "Switch",
  "PlayStation",
  "Xbox",
  "Steam",
];

/**
 * Canonical list of job experience levels used in parsing and filtering.
 */
export const JOB_EXPERIENCE_LEVELS: readonly JobExperienceLevel[] = [
  "entry",
  "junior",
  "mid",
  "senior",
  "principal",
  "director",
];

/**
 * Canonical list of job types used in parsing and filtering.
 */
export const JOB_TYPES: readonly JobType[] = [
  "full-time",
  "part-time",
  "contract",
  "internship",
  "freelance",
];

/**
 * Standard page size for the jobs discovery grid.
 */
export const JOB_DISCOVERY_DEFAULT_PAGE_SIZE = 12;

/**
 * Default page index for paginated job queries.
 */
export const JOB_QUERY_DEFAULT_PAGE = 1;

/**
 * Default page size for server-side job listing endpoints.
 */
export const JOB_QUERY_DEFAULT_LIMIT = 20;

/**
 * Maximum allowed page size for server-side job listing endpoints.
 */
export const JOB_QUERY_MAX_LIMIT = 100;
