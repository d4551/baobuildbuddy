/**
 * Date utility helpers
 */

import {
  DAYS_PER_MONTH_APPROX,
  DAYS_PER_WEEK,
  MS_PER_DAY,
  MS_PER_SECOND,
  SECONDS_PER_30_DAYS,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
  SECONDS_PER_WEEK,
} from "../constants/time";

export type RelativeTimeTranslator = (key: string, params?: { count?: number }) => string;

/**
 * Single canonical i18n namespace for every relative-time rendering in the app.
 * Per-surface namespaces (`jobsPage.date`, `jobCard.relativeTime`,
 * `dashboard.relativeTime`, `automation.scraper.*`) previously duplicated this
 * copy; they were collapsed into this one SSOT so wording stays consistent and
 * translators maintain a single set of strings.
 */
export const RELATIVE_TIME_KEY = {
  justNow: "common.relativeTime.justNow",
  minutesAgo: "common.relativeTime.minutesAgo",
  hoursAgo: "common.relativeTime.hoursAgo",
  today: "common.relativeTime.today",
  yesterday: "common.relativeTime.yesterday",
  daysAgo: "common.relativeTime.daysAgo",
  weeksAgo: "common.relativeTime.weeksAgo",
  monthsAgo: "common.relativeTime.monthsAgo",
  unknown: "common.relativeTime.unknown",
} as const;

/**
 * Returns a translated relative time string at sub-day granularity
 * (just now / minutes / hours), falling back to day, week, and locale-date
 * ranges. Use this for chat and activity timestamps.
 */
export function formatRelativeTime(date: string | Date, t: RelativeTimeTranslator): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) {
    return t(RELATIVE_TIME_KEY.unknown);
  }
  const seconds = Math.floor((Date.now() - d.getTime()) / MS_PER_SECOND);

  if (seconds < SECONDS_PER_MINUTE) {
    return t(RELATIVE_TIME_KEY.justNow);
  }
  if (seconds < SECONDS_PER_HOUR)
    return t(RELATIVE_TIME_KEY.minutesAgo, {
      count: Math.max(1, Math.floor(seconds / SECONDS_PER_MINUTE)),
    });
  if (seconds < SECONDS_PER_DAY)
    return t(RELATIVE_TIME_KEY.hoursAgo, {
      count: Math.max(1, Math.floor(seconds / SECONDS_PER_HOUR)),
    });
  if (seconds < SECONDS_PER_WEEK)
    return t(RELATIVE_TIME_KEY.daysAgo, {
      count: Math.max(1, Math.floor(seconds / SECONDS_PER_DAY)),
    });
  if (seconds < SECONDS_PER_30_DAYS)
    return t(RELATIVE_TIME_KEY.weeksAgo, { count: Math.floor(seconds / SECONDS_PER_WEEK) });
  return d.toLocaleDateString();
}

export function formatDate(date: string | Date, locale?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale ?? "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Returns a translated relative date string at day granularity
 * (today / yesterday / days / weeks / months). Single source for
 * job-posted dates, scraper dates, and any other calendar-day display.
 * Use formatRelativeTime for sub-day granularity.
 */
export function formatRelativeTimeForDate(date: string | Date, t: RelativeTimeTranslator): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) {
    return t(RELATIVE_TIME_KEY.unknown);
  }

  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / MS_PER_DAY);

  if (diffDays <= 0) return t(RELATIVE_TIME_KEY.today);
  if (diffDays === 1) return t(RELATIVE_TIME_KEY.yesterday);
  if (diffDays < DAYS_PER_WEEK) return t(RELATIVE_TIME_KEY.daysAgo, { count: diffDays });
  if (diffDays < DAYS_PER_MONTH_APPROX)
    return t(RELATIVE_TIME_KEY.weeksAgo, {
      count: Math.floor(diffDays / DAYS_PER_WEEK),
    });
  return t(RELATIVE_TIME_KEY.monthsAgo, {
    count: Math.floor(diffDays / DAYS_PER_MONTH_APPROX),
  });
}
