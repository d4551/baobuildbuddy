/**
 * Canonical English locale message catalog for the client application.
 */
import catalog from "./en-US/catalog";

/**
 * Strongly-typed locale message schema used by `vue-i18n`.
 */
type LocaleMessageShape<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends readonly (infer U)[]
      ? readonly LocaleMessageShape<U>[]
      : T[K] extends Record<string, unknown>
        ? LocaleMessageShape<T[K]>
        : T[K];
};

export type AppTranslationSchema = LocaleMessageShape<typeof catalog>;

/**
 * Partial locale override schema layered on top of `AppTranslationSchema`.
 */
type LocaleMessageOverrides<T> = {
  [K in keyof T]?: T[K] extends string
    ? string
    : T[K] extends readonly (infer U)[]
      ? readonly LocaleMessageOverrides<U>[]
      : T[K] extends Record<string, unknown>
        ? LocaleMessageOverrides<T[K]>
        : T[K];
};

export type AppTranslationOverrides = LocaleMessageOverrides<AppTranslationSchema>;

/**
 * Default English locale message catalog.
 */
export default catalog;
