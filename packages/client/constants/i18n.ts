import { APP_LANGUAGE_CODES, type AppLanguageCode } from "@bao/shared";

export const LOCALE_NAME_KEY_BY_CODE = {
  "en-US": "common.localeNames.enUS",
  "es-ES": "common.localeNames.esES",
  "fr-FR": "common.localeNames.frFR",
  "ja-JP": "common.localeNames.jaJP",
} as const satisfies Record<AppLanguageCode, string>;

export const isAppLanguageCode = (value: string): value is AppLanguageCode =>
  APP_LANGUAGE_CODES.some((code) => code === value);

export const resolveLocaleLabel = (
  t: (key: string, values?: Record<string, unknown>) => string,
  localeCode: string,
): string => {
  if (!isAppLanguageCode(localeCode)) {
    return localeCode;
  }

  return t(LOCALE_NAME_KEY_BY_CODE[localeCode]);
};
