/**
 * Rate limit configuration. Single source of truth for duration and max requests.
 */

import { MS_PER_MINUTE } from "@bao/shared/constants/time";

/** Rate limit window duration (1 minute). */
export const RATE_LIMIT_DURATION_MS = MS_PER_MINUTE;

/** Max requests per window for automation routes. */
export const RATE_LIMIT_MAX_AUTOMATION = 30;

/** Max requests per window for skill analysis (AI) routes. */
export const RATE_LIMIT_MAX_SKILL_ANALYSIS = 20;

/** Global rate limit window duration (1 minute). */
export const RATE_LIMIT_GLOBAL_DURATION_MS = MS_PER_MINUTE;

/** Max requests per window for global rate limit. */
export const RATE_LIMIT_GLOBAL_MAX_REQUESTS = 100;

/** Auth bootstrap route rate limit window duration (1 minute). */
export const RATE_LIMIT_AUTH_BOOTSTRAP_DURATION_MS = MS_PER_MINUTE;

/** Max first-run auth bootstrap requests per window. */
export const RATE_LIMIT_AUTH_BOOTSTRAP_MAX_REQUESTS = 5;

/** Settings route rate limit window duration (1 minute). */
export const RATE_LIMIT_SETTINGS_DURATION_MS = MS_PER_MINUTE;

/** Max requests per window for settings routes. */
export const RATE_LIMIT_SETTINGS_MAX_REQUESTS = 10;
