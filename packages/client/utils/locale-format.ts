const DEFAULT_LOCALE = "en-US";
const DATE_OPTION_KEYS = ["dateStyle", "weekday", "year", "month", "day", "era"] as const;
const SHARED_OPTION_KEYS = [
  "calendar",
  "formatMatcher",
  "localeMatcher",
  "numberingSystem",
  "timeZone",
] as const;
const TIME_OPTION_KEYS = [
  "timeStyle",
  "hour",
  "minute",
  "second",
  "fractionalSecondDigits",
  "hour12",
  "hourCycle",
  "dayPeriod",
  "timeZoneName",
] as const;

const isReadonlyUnknownArray = (value: unknown): value is readonly unknown[] =>
  Array.isArray(value);

function hasFormattingOption(
  options: Intl.DateTimeFormatOptions,
  keys: readonly (keyof Intl.DateTimeFormatOptions)[],
): boolean {
  return keys.some((key) => options[key] !== undefined);
}

function copyDefinedOptions(
  source: Intl.DateTimeFormatOptions,
  keys: readonly (keyof Intl.DateTimeFormatOptions)[],
): Intl.DateTimeFormatOptions {
  const target: Intl.DateTimeFormatOptions = {};
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined) {
      Reflect.set(target, key, value);
    }
  }
  return target;
}

function buildDateOnlyOptions(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions {
  return copyDefinedOptions(options, [...SHARED_OPTION_KEYS, ...DATE_OPTION_KEYS]);
}

function buildTimeOnlyOptions(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions {
  return copyDefinedOptions(options, [...SHARED_OPTION_KEYS, ...TIME_OPTION_KEYS]);
}

/**
 * Resolves a deterministic locale from vue-i18n locale and fallback-locale values.
 */
export function resolvePreferredLocale(localeValue: unknown, fallbackLocaleValue: unknown): string {
  if (typeof localeValue === "string" && localeValue.length > 0) {
    return localeValue;
  }

  if (typeof fallbackLocaleValue === "string" && fallbackLocaleValue.length > 0) {
    return fallbackLocaleValue;
  }

  if (isReadonlyUnknownArray(fallbackLocaleValue)) {
    const firstLocale = fallbackLocaleValue.at(0);
    if (typeof firstLocale === "string" && firstLocale.length > 0) {
      return firstLocale;
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * Formats a date-like value using the resolved locale. Returns `null` when the date is invalid.
 */
export function formatDateWithLocale(
  value: string | Date,
  localeValue: unknown,
  fallbackLocaleValue: unknown,
  options: Intl.DateTimeFormatOptions,
): string | null {
  const parsedDate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const locale = resolvePreferredLocale(localeValue, fallbackLocaleValue);
  const includesDate = hasFormattingOption(options, DATE_OPTION_KEYS);
  const includesTime = hasFormattingOption(options, TIME_OPTION_KEYS);

  if (includesDate && includesTime) {
    const formattedDate = new Intl.DateTimeFormat(locale, buildDateOnlyOptions(options)).format(
      parsedDate,
    );
    const formattedTime = new Intl.DateTimeFormat(locale, buildTimeOnlyOptions(options)).format(
      parsedDate,
    );

    return `${formattedDate} ${formattedTime}`;
  }

  return new Intl.DateTimeFormat(locale, options).format(parsedDate);
}
