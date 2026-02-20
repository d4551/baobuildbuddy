/**
 * Date utility helpers
 */

export type RelativeTimeTranslator = (key: string, params?: { count?: number }) => string;

/**
 * Returns a translated relative time string using the provided translation function.
 * Use this for i18n-aware relative time display.
 */
export function formatRelativeTime(date: string | Date, t: RelativeTimeTranslator): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return t("common.relativeTime.justNow");
  if (seconds < 3600)
    return t("common.relativeTime.minutesAgo", { count: Math.floor(seconds / 60) });
  if (seconds < 86400)
    return t("common.relativeTime.hoursAgo", { count: Math.floor(seconds / 3600) });
  if (seconds < 604800)
    return t("common.relativeTime.daysAgo", { count: Math.floor(seconds / 86400) });
  if (seconds < 2592000)
    return t("common.relativeTime.weeksAgo", { count: Math.floor(seconds / 604800) });
  return d.toLocaleDateString();
}

/** @deprecated Use formatRelativeTime with i18n t() for locale-aware output */
export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
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

export function isToday(date: string | Date): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

export function daysBetween(a: string | Date, b: string | Date): number {
  const da = typeof a === "string" ? new Date(a) : a;
  const db = typeof b === "string" ? new Date(b) : b;
  return Math.floor(Math.abs(da.getTime() - db.getTime()) / 86400000);
}
