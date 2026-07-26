import { describe, expect, test } from "bun:test";
import {
  MS_PER_DAY,
  MS_PER_SECOND,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
  SECONDS_PER_WEEK,
} from "../constants/time";
import {
  formatDate,
  formatRelativeTime,
  formatRelativeTimeForDate,
  RELATIVE_TIME_KEY,
} from "./date-helpers";

type TranslationCall = { key: string; count: number };

/** Sentinel count recorded when a bucket emits no interpolation params. */
const NO_COUNT = -1;

/** Records the key + params each call resolved to, so ranges are asserted exactly. */
const recordingTranslator = () => {
  const calls: TranslationCall[] = [];
  const t = (key: string, params?: { count?: number }): string => {
    calls.push({ key, count: params?.count ?? NO_COUNT });
    return key;
  };
  return { calls, t };
};

/**
 * Bucket-boundary fixtures. Named so each assertion states which bucket it probes
 * rather than leaving a bare number at the call site.
 */
const JUST_NOW_SECONDS = 5;
const MINUTES_BUCKET = 5;
const MINUTES_BUCKET_REMAINDER_SECONDS = 30;
const HOURS_BUCKET = 3;
const TWO_UNITS = 2;
const DAYS_BUCKET = 3;
const WITHIN_WEEK_DAYS = 4;
const YESTERDAY_DAYS = 1;
const FUTURE_DAYS = 5;
const WITHIN_MONTH_DAYS = 15;
const BEYOND_MONTH_DAYS = 95;
const BEYOND_MONTH_MONTHS = 3;
const FAR_PAST_DAYS = 400;
const EXPECTED_NAMESPACE_CALLS = 3;

const secondsAgo = (seconds: number): Date => new Date(Date.now() - seconds * MS_PER_SECOND);
const daysAgo = (days: number): Date => new Date(Date.now() - days * MS_PER_DAY);

describe("relative-time i18n keys resolve to the single canonical namespace", () => {
  test("every exported key sits under common.relativeTime", () => {
    for (const key of Object.values(RELATIVE_TIME_KEY)) {
      expect(key.startsWith("common.relativeTime.")).toBe(true);
    }
  });

  test("no surface-specific namespace leaks into emitted keys", () => {
    const { calls, t } = recordingTranslator();
    formatRelativeTime(secondsAgo(SECONDS_PER_HOUR * TWO_UNITS), t);
    formatRelativeTimeForDate(daysAgo(DAYS_BUCKET), t);
    formatRelativeTimeForDate("not-a-date", t);

    expect(calls.length).toBe(EXPECTED_NAMESPACE_CALLS);
    for (const call of calls) {
      expect(call.key.startsWith("common.relativeTime.")).toBe(true);
    }
  });
});

describe("formatRelativeTime covers each sub-day bucket", () => {
  test("under a minute is justNow", () => {
    const { calls, t } = recordingTranslator();
    formatRelativeTime(secondsAgo(JUST_NOW_SECONDS), t);
    expect(calls).toEqual([{ key: RELATIVE_TIME_KEY.justNow, count: NO_COUNT }]);
  });

  test("minutes bucket floors to at least one", () => {
    const { calls, t } = recordingTranslator();
    formatRelativeTime(
      secondsAgo(SECONDS_PER_MINUTE * MINUTES_BUCKET + MINUTES_BUCKET_REMAINDER_SECONDS),
      t,
    );
    expect(calls).toEqual([{ key: RELATIVE_TIME_KEY.minutesAgo, count: MINUTES_BUCKET }]);
  });

  test("hours bucket", () => {
    const { calls, t } = recordingTranslator();
    formatRelativeTime(secondsAgo(SECONDS_PER_HOUR * HOURS_BUCKET), t);
    expect(calls).toEqual([{ key: RELATIVE_TIME_KEY.hoursAgo, count: HOURS_BUCKET }]);
  });

  test("days bucket", () => {
    const { calls, t } = recordingTranslator();
    formatRelativeTime(secondsAgo(SECONDS_PER_DAY * DAYS_BUCKET), t);
    expect(calls).toEqual([{ key: RELATIVE_TIME_KEY.daysAgo, count: DAYS_BUCKET }]);
  });

  test("weeks bucket", () => {
    const { calls, t } = recordingTranslator();
    formatRelativeTime(secondsAgo(SECONDS_PER_WEEK * TWO_UNITS), t);
    expect(calls).toEqual([{ key: RELATIVE_TIME_KEY.weeksAgo, count: TWO_UNITS }]);
  });

  test("beyond thirty days falls back to a locale date, not a key", () => {
    const { calls, t } = recordingTranslator();
    const output = formatRelativeTime(daysAgo(FAR_PAST_DAYS), t);
    expect(calls.length).toBe(0);
    expect(output).not.toContain("common.relativeTime");
  });

  test("invalid input resolves to the shared unknown key", () => {
    const { calls, t } = recordingTranslator();
    formatRelativeTime("clearly-not-a-date", t);
    expect(calls).toEqual([{ key: RELATIVE_TIME_KEY.unknown, count: NO_COUNT }]);
  });
});

describe("formatRelativeTimeForDate covers each calendar-day bucket", () => {
  test("same day is today", () => {
    const { calls, t } = recordingTranslator();
    formatRelativeTimeForDate(new Date(), t);
    expect(calls).toEqual([{ key: RELATIVE_TIME_KEY.today, count: NO_COUNT }]);
  });

  test("a future date still reads as today rather than a negative count", () => {
    const { calls, t } = recordingTranslator();
    formatRelativeTimeForDate(new Date(Date.now() + MS_PER_DAY * FUTURE_DAYS), t);
    expect(calls).toEqual([{ key: RELATIVE_TIME_KEY.today, count: NO_COUNT }]);
  });

  test("one day back is yesterday", () => {
    const { calls, t } = recordingTranslator();
    formatRelativeTimeForDate(daysAgo(YESTERDAY_DAYS), t);
    expect(calls).toEqual([{ key: RELATIVE_TIME_KEY.yesterday, count: NO_COUNT }]);
  });

  test("within a week counts days", () => {
    const { calls, t } = recordingTranslator();
    formatRelativeTimeForDate(daysAgo(WITHIN_WEEK_DAYS), t);
    expect(calls).toEqual([{ key: RELATIVE_TIME_KEY.daysAgo, count: WITHIN_WEEK_DAYS }]);
  });

  test("within a month counts weeks", () => {
    const { calls, t } = recordingTranslator();
    formatRelativeTimeForDate(daysAgo(WITHIN_MONTH_DAYS), t);
    expect(calls).toEqual([{ key: RELATIVE_TIME_KEY.weeksAgo, count: TWO_UNITS }]);
  });

  test("beyond a month counts months", () => {
    const { calls, t } = recordingTranslator();
    formatRelativeTimeForDate(daysAgo(BEYOND_MONTH_DAYS), t);
    expect(calls).toEqual([{ key: RELATIVE_TIME_KEY.monthsAgo, count: BEYOND_MONTH_MONTHS }]);
  });

  test("invalid input resolves to the shared unknown key", () => {
    const { calls, t } = recordingTranslator();
    formatRelativeTimeForDate("", t);
    expect(calls).toEqual([{ key: RELATIVE_TIME_KEY.unknown, count: NO_COUNT }]);
  });

  test("accepts ISO strings identically to Date instances", () => {
    const { calls, t } = recordingTranslator();
    const when = daysAgo(WITHIN_WEEK_DAYS);
    formatRelativeTimeForDate(when, t);
    formatRelativeTimeForDate(when.toISOString(), t);
    expect(calls).toEqual([
      { key: RELATIVE_TIME_KEY.daysAgo, count: WITHIN_WEEK_DAYS },
      { key: RELATIVE_TIME_KEY.daysAgo, count: WITHIN_WEEK_DAYS },
    ]);
  });
});

describe("formatDate renders a stable absolute date", () => {
  test("formats an ISO string in the requested locale", () => {
    expect(formatDate("2026-03-14T12:00:00.000Z", "en-US")).toContain("2026");
  });

  test("defaults to en-US when no locale is supplied", () => {
    expect(formatDate(new Date("2026-03-14T12:00:00.000Z"))).toContain("2026");
  });
});
