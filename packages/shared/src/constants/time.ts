/**
 * Time constants in milliseconds. Single source of truth for duration calculations.
 */

/** Milliseconds in one day. */
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Milliseconds in one minute. */
export const MS_PER_MINUTE = 60 * 1000;

/** Milliseconds in one hour. */
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;

/** Seconds in one week for relative-time thresholds. */
export const SECONDS_PER_WEEK = 7 * 24 * 60 * 60;

/** Seconds in 30 days for relative-time thresholds. */
export const SECONDS_PER_30_DAYS = 30 * 24 * 60 * 60;
