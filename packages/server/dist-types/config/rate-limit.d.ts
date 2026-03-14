/**
 * Rate limit configuration. Single source of truth for duration and max requests.
 */
/** Rate limit window duration (1 minute). */
export declare const RATE_LIMIT_DURATION_MS: number;
/** Max requests per window for automation routes. */
export declare const RATE_LIMIT_MAX_AUTOMATION = 30;
/** Max requests per window for skill analysis (AI) routes. */
export declare const RATE_LIMIT_MAX_SKILL_ANALYSIS = 20;
/** Global rate limit window duration (1 minute). */
export declare const RATE_LIMIT_GLOBAL_DURATION_MS: number;
/** Max requests per window for global rate limit. */
export declare const RATE_LIMIT_GLOBAL_MAX_REQUESTS = 100;
/** Settings route rate limit window duration (1 minute). */
export declare const RATE_LIMIT_SETTINGS_DURATION_MS: number;
/** Max requests per window for settings routes. */
export declare const RATE_LIMIT_SETTINGS_MAX_REQUESTS = 10;
