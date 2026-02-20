/**
 * Supported runtime language codes.
 */
export const APP_LANGUAGE_CODES = ["en"] as const;

/**
 * Language code union derived from `APP_LANGUAGE_CODES`.
 */
export type AppLanguageCode = (typeof APP_LANGUAGE_CODES)[number];

/**
 * Default language code used for app settings and preference fallbacks.
 */
export const DEFAULT_APP_LANGUAGE: AppLanguageCode = "en";

/**
 * Select-option model for language preference inputs.
 */
export const APP_LANGUAGE_OPTIONS: ReadonlyArray<{
  readonly value: AppLanguageCode;
  readonly label: string;
}> = [{ value: "en", label: "English" }];

/**
 * Supported browser ids for automation defaults.
 */
export const AUTOMATION_BROWSER_OPTIONS = ["chrome", "chromium", "edge"] as const;

/**
 * Browser option union derived from `AUTOMATION_BROWSER_OPTIONS`.
 */
export type AutomationBrowserOption = (typeof AUTOMATION_BROWSER_OPTIONS)[number];
