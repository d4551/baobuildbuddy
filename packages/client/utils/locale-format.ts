const DEFAULT_LOCALE = "en-US";

const isReadonlyUnknownArray = (value: unknown): value is readonly unknown[] =>
  Array.isArray(value);

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
  return new Intl.DateTimeFormat(locale, options).format(parsedDate);
}
