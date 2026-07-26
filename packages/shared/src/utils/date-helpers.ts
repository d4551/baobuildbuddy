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

/** Options for formatRelativeTime. */
export type FormatRelativeTimeOptions = {
  /** i18n key prefix (e.g. "common.relativeTime", "dashboard.relativeTime"). Default: "common.relativeTime". */
  keyPrefix?: string;
  /** When true and seconds < 60, use minutesAgo with count 1 instead of justNow. For namespaces without justNow. */
  minOneUnit?: boolean;
  /** When true, use daysAgo for all day+ ranges instead of weeksAgo. For namespaces without weeksAgo. */
  daysOnly?: boolean;
};

const DEFAULT_KEY_PREFIX = "common.relativeTime";

/**
 * Returns a translated relative time string using the provided translation function.
 * Use this for i18n-aware relative time display.
 */
export function formatRelativeTime(
  date: string | Date,
  t: RelativeTimeTranslator,
  options?: FormatRelativeTimeOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / MS_PER_SECOND);
  const prefix = options?.keyPrefix ?? DEFAULT_KEY_PREFIX;

  if (seconds < SECONDS_PER_MINUTE) {
    if (options?.minOneUnit) {
      return t(`${prefix}.minutesAgo`, { count: 1 });
    }
    return t(`${prefix}.justNow`);
  }
  if (seconds < SECONDS_PER_HOUR)
    return t(`${prefix}.minutesAgo`, {
      count: Math.max(1, Math.floor(seconds / SECONDS_PER_MINUTE)),
    });
  if (seconds < SECONDS_PER_DAY)
    return t(`${prefix}.hoursAgo`, {
      count: Math.max(1, Math.floor(seconds / SECONDS_PER_HOUR)),
    });
  if (options?.daysOnly || seconds < SECONDS_PER_WEEK)
    return t(`${prefix}.daysAgo`, {
      count: Math.max(1, Math.floor(seconds / SECONDS_PER_DAY)),
    });
  if (seconds < SECONDS_PER_30_DAYS)
    return t(`${prefix}.weeksAgo`, { count: Math.floor(seconds / SECONDS_PER_WEEK) });
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

/** Options for formatRelativeTimeForDate. */
export type FormatRelativeTimeForDateOptions = {
  /** i18n key prefix (e.g. "jobsPage.date", "jobCard.relativeTime"). */
  keyPrefix: string;
  /** Key for invalid/missing dates. Defaults to `${keyPrefix}.unknown`. */
  unknownKey?: string;
};

/**
 * Returns a translated relative date string (day granularity) using the provided translator.
 * Single source for job-posted-date, scraper dates, etc.
 * Use formatRelativeTime for sub-day granularity (chat, activity timestamps).
 */
export function formatRelativeTimeForDate(
  date: string | Date,
  t: RelativeTimeTranslator,
  options: FormatRelativeTimeForDateOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) {
    return t(options.unknownKey ?? `${options.keyPrefix}.unknown`);
  }

  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / MS_PER_DAY);

  if (diffDays <= 0) return t(`${options.keyPrefix}.today`);
  if (diffDays === 1) return t(`${options.keyPrefix}.yesterday`);
  if (diffDays < DAYS_PER_WEEK) return t(`${options.keyPrefix}.daysAgo`, { count: diffDays });
  if (diffDays < DAYS_PER_MONTH_APPROX)
    return t(`${options.keyPrefix}.weeksAgo`, {
      count: Math.floor(diffDays / DAYS_PER_WEEK),
    });
  return t(`${options.keyPrefix}.monthsAgo`, {
    count: Math.floor(diffDays / DAYS_PER_MONTH_APPROX),
  });
}
