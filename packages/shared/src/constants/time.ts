/**
 * Time constants in milliseconds. Single source of truth for duration calculations.
 */

/** Milliseconds in one second. */
export const MS_PER_SECOND = 1000;

/** Seconds in one minute. */
export const SECONDS_PER_MINUTE = 60;

/** Minutes in one hour. */
export const MINUTES_PER_HOUR = 60;

/** Hours in one day. */
export const HOURS_PER_DAY = 24;

/** Days in one week. */
export const DAYS_PER_WEEK = 7;

/** Approximate days in one month for relative-time thresholds. */
export const DAYS_PER_MONTH_APPROX = 30;

/** Milliseconds in one minute. */
export const MS_PER_MINUTE = SECONDS_PER_MINUTE * MS_PER_SECOND;

/** Milliseconds in one hour. */
export const MS_PER_HOUR = MINUTES_PER_HOUR * MS_PER_MINUTE;

/** Milliseconds in one day. */
export const MS_PER_DAY = HOURS_PER_DAY * MS_PER_HOUR;

/** Seconds in one week for relative-time thresholds. */
export const SECONDS_PER_WEEK =
  DAYS_PER_WEEK * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE;

/** Seconds in ~30 days for relative-time thresholds. */
export const SECONDS_PER_30_DAYS =
  DAYS_PER_MONTH_APPROX * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE;
