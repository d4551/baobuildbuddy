/**
 * Time constants in milliseconds. Single source of truth for duration calculations.
 */

import { MS_FIVE_MINUTES, MS_TWO_MINUTES } from "./numeric";

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

/** Seconds in one hour. */
export const SECONDS_PER_HOUR = MINUTES_PER_HOUR * SECONDS_PER_MINUTE;

/** Seconds in one day. */
export const SECONDS_PER_DAY = HOURS_PER_DAY * SECONDS_PER_HOUR;

/** Milliseconds in one minute. */
export const MS_PER_MINUTE = SECONDS_PER_MINUTE * MS_PER_SECOND;

/** Milliseconds in five minutes (scheduler / automation test offsets). */
export const MS_PER_FIVE_MINUTES = MS_FIVE_MINUTES;

/** Milliseconds in two minutes (speech / long provider timeouts). */
export const MS_PER_TWO_MINUTES = MS_TWO_MINUTES;

/** Milliseconds in one hour. */
export const MS_PER_HOUR = MINUTES_PER_HOUR * MS_PER_MINUTE;

/** Milliseconds in one day. */
export const MS_PER_DAY = HOURS_PER_DAY * MS_PER_HOUR;

/** Seconds in one week for relative-time thresholds. */
export const SECONDS_PER_WEEK = DAYS_PER_WEEK * SECONDS_PER_DAY;

/** Seconds in ~30 days for relative-time thresholds. */
export const SECONDS_PER_30_DAYS = DAYS_PER_MONTH_APPROX * SECONDS_PER_DAY;
