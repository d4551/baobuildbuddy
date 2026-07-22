import type { GameGenre, JobExperienceLevel, JobType, Platform, StudioType } from "../types/jobs";
import { COUNT_FIFTEEN, COUNT_SIX } from "./numeric";
import { MS_PER_HOUR, MS_PER_MINUTE, MS_PER_SECOND } from "./time";

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

/**
 * Default cache expiry for aggregated job listings (6 hours).
 */
export const JOB_AGGREGATOR_CACHE_EXPIRY_MS = COUNT_SIX * MS_PER_HOUR;

/** Salary string parse multiplier (e.g. "50" → 50_000). */
export const JOB_SALARY_PARSE_MULTIPLIER = MS_PER_SECOND;

/** Rate limit window for job provider fetches (1 minute). */
export const JOB_PROVIDER_RATE_LIMIT_WINDOW_MS = MS_PER_MINUTE;

/** Maximum requests per provider per rate limit window. */
export const JOB_PROVIDER_RATE_LIMIT_MAX_REQUESTS = COUNT_FIFTEEN;

/** Default match score for job recommendations when AI matching is not used. */
export const JOB_DEFAULT_RECOMMENDATION_SCORE = 50;

/** Default match reason for recent-posting recommendations. */
export const JOB_DEFAULT_RECOMMENDATION_REASON = "Recent posting";

/** Neutral score used when no data available (resume fallback, matching). */
export const DEFAULT_SCORE_NEUTRAL = 50;

/** Matching weights for weighted average (skills, experience, location, etc.). */
export const MATCHING_WEIGHTS = {
  skills: 0.25,
  experience: 0.2,
  location: 0.15,
  salary: 0.15,
  culture: 0.1,
  technology: 0.15,
} as const;

/** Score threshold above which a factor is considered a strength. */
export const MATCHING_STRENGTH_THRESHOLD = 70;

/** Score threshold below which a factor needs improvement. */
export const MATCHING_IMPROVEMENT_THRESHOLD = 50;
