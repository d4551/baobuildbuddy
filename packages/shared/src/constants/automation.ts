/**
 * Supported automation run types across API and client surfaces.
 */
export const AUTOMATION_RUN_TYPES = ["scrape", "job_apply", "email"] as const;

/**
 * Canonical automation run status lifecycle values.
 */
export const AUTOMATION_RUN_STATUSES = ["pending", "running", "success", "error"] as const;

/**
 * Default maximum number of automation runs returned by history endpoints.
 */
export const AUTOMATION_RUN_HISTORY_LIMIT = 50;

/**
 * Union type for an automation run type.
 */
export type AutomationRunType = (typeof AUTOMATION_RUN_TYPES)[number];

/**
 * Union type for an automation run status.
 */
export type AutomationRunStatus = (typeof AUTOMATION_RUN_STATUSES)[number];
