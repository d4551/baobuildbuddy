/**
 * Shared interview feature defaults used across client and server layers.
 */

/**
 * Studio identifier used when creating a job-targeted interview session without a known studio match.
 */
export const INTERVIEW_FALLBACK_STUDIO_ID = "job-target";

/**
 * Label shown when a studio name cannot be resolved for a session.
 */
export const INTERVIEW_UNKNOWN_STUDIO_NAME = "Unknown Studio";

/**
 * Default number of interview questions when the caller does not provide an explicit count.
 */
export const INTERVIEW_DEFAULT_QUESTION_COUNT = 6;

/**
 * Default role label used for generic interviews when no role is provided.
 */
export const INTERVIEW_DEFAULT_ROLE_TYPE = "Game Developer";

/**
 * Default role category used for generic interviews.
 */
export const INTERVIEW_DEFAULT_ROLE_CATEGORY = "General";

/**
 * Canonical default experience level used by interview setup.
 */
export const INTERVIEW_DEFAULT_EXPERIENCE_LEVEL = "mid";

/**
 * Default interview focus areas shared by API and service layers.
 */
export const INTERVIEW_DEFAULT_FOCUS_AREAS = [
  "architecture",
  "collaboration",
  "problem-solving",
] as const;

/**
 * Default interview duration in minutes.
 */
export const INTERVIEW_DEFAULT_DURATION_MINUTES = 25;

/**
 * Default voice settings used when voice mode is enabled and individual values are not provided.
 */
export const INTERVIEW_DEFAULT_VOICE_SETTINGS = {
  rate: 1,
  pitch: 1,
  volume: 1,
  language: "en-US",
} as const;

/**
 * Job search query limit used by the interview hub when loading available targets.
 */
export const INTERVIEW_HUB_JOB_QUERY_LIMIT = "60";

/**
 * Job search query limit used by the scraper operations page.
 */
export const SCRAPER_JOB_QUERY_LIMIT = "80";

/**
 * Maximum number of job rows rendered in compact preview tables.
 */
export const JOB_PREVIEW_LIMIT = 12;

/**
 * Maximum number of recent interview sessions shown on the interview hub dashboard.
 */
export const INTERVIEW_HUB_RECENT_SESSION_LIMIT = 6;

/**
 * Default minimum value for interview progress indicators.
 */
export const INTERVIEW_PROGRESS_MIN = 0;

/**
 * Maximum percentage value for interview progress indicators.
 */
export const INTERVIEW_PROGRESS_MAX = 100;

/**
 * Number of recent interview sessions rendered per page in the interview hub table.
 */
export const INTERVIEW_HUB_RECENT_SESSION_PAGE_SIZE = INTERVIEW_HUB_RECENT_SESSION_LIMIT;

/**
 * Minimum response length required before submitting an interview answer.
 */
export const INTERVIEW_MIN_RESPONSE_LENGTH = 10;

/**
 * Canonical role options displayed in the interview hub setup flow.
 */
export const INTERVIEW_HUB_ROLE_OPTIONS = [
  "game-designer",
  "programmer",
  "artist",
  "producer",
  "qa",
] as const;

/**
 * Canonical experience options displayed in the interview hub setup flow.
 */
export const INTERVIEW_HUB_EXPERIENCE_OPTIONS = ["entry", "mid", "senior", "lead"] as const;

/**
 * Canonical question-count options displayed in the interview hub setup flow.
 */
export const INTERVIEW_HUB_QUESTION_COUNT_OPTIONS = [3, 5, 8] as const;
