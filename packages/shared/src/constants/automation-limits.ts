/**
 * Default maximum number of automation runs returned by history endpoints.
 */
export const AUTOMATION_RUN_HISTORY_LIMIT = 50;

/**
 * Maximum length for job application URLs.
 */
export const AUTOMATION_MAX_JOB_URL_LENGTH = 2_048;

/**
 * Maximum length for custom answer keys.
 */
export const AUTOMATION_MAX_CUSTOM_ANSWER_KEY_LENGTH = 120;

/**
 * Maximum length for custom answer values.
 */
export const AUTOMATION_MAX_CUSTOM_ANSWER_VALUE_LENGTH = 2_000;

/**
 * Maximum number of custom answers per job application.
 */
export const AUTOMATION_MAX_CUSTOM_ANSWER_COUNT = 50;

/**
 * Maximum days to retain automation screenshots before cleanup.
 */
export const AUTOMATION_MAX_SCREENSHOT_RETENTION_DAYS = 30;

/**
 * Maximum number of runs to process per cleanup batch.
 */
export const AUTOMATION_CLEANUP_LIMIT = 500;

/**
 * Maximum concurrent automation runs.
 */
export const AUTOMATION_MAX_CONCURRENT_RUNS = 5;

/**
 * Maximum length for AI-generated email response body.
 */
export const AUTOMATION_MAX_EMAIL_MESSAGE_LENGTH = 12_000;

/**
 * Delay before retrying a failed scheduled run (ms).
 */
export const AUTOMATION_SCHEDULE_RETRY_DELAY_MS = 30_000;

/**
 * Maximum lead time for scheduling a run (30 days, ms).
 */
export const AUTOMATION_MAX_SCHEDULE_LEAD_TIME_MS = 30 * 24 * 60 * 60 * 1000;

/** Progress value when run is complete (100%). */
export const AUTOMATION_FINISHED_PROGRESS = 100;

/** Max length for screenshot filenames. */
export const AUTOMATION_MAX_SCREENSHOT_NAME_LENGTH = 96;

/** Max progress steps for run progress tracking. */
export const AUTOMATION_MAX_PROGRESS_STEPS = 10_000;

/** Min length for run IDs. */
export const AUTOMATION_MIN_ID_LENGTH = 8;
