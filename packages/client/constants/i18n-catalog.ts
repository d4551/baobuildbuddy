import enUS from "~/locales/en-US";
import esES from "~/locales/es-ES";
import frFR from "~/locales/fr-FR";
import jaJP from "~/locales/ja-JP";

/**
 * Canonical locale message catalog used by the Nuxt i18n plugin and brand override pipeline.
 */
export const I18N_MESSAGE_CATALOG = {
  "en-US": enUS,
  "es-ES": esES,
  "fr-FR": frFR,
  "ja-JP": jaJP,
} as const;

/**
 * Supported locale keys derived from the canonical catalog.
 */
export type AvailableLocale = keyof typeof I18N_MESSAGE_CATALOG;
