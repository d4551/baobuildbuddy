import { createI18n } from "vue-i18n";
import enUS from "~/locales/en-US";
import esES from "~/locales/es-ES";
import frFR from "~/locales/fr-FR";
import jaJP from "~/locales/ja-JP";

const I18N_MESSAGE_CATALOG = {
  "en-US": enUS,
  "es-ES": esES,
  "fr-FR": frFR,
  "ja-JP": jaJP,
} as const;

type AvailableLocale = keyof typeof I18N_MESSAGE_CATALOG;

const DEFAULT_LOCALE: AvailableLocale = "en-US";
const ACCEPT_LANGUAGE_SEPARATOR = ",";
const ACCEPT_LANGUAGE_WEIGHT_SEPARATOR = ";";
const ACCEPT_LANGUAGE_VARIANT_SEPARATOR = "-";

interface LocaleResolutionInput {
  readonly cookieLocale: string | null | undefined;
  readonly acceptLanguageHeader: string | undefined;
  readonly browserLocale: string | undefined;
  readonly supportedLocales: readonly AvailableLocale[];
  readonly defaultLocale: AvailableLocale;
}

const normalizeLocaleCandidate = (value: string): string =>
  value.trim().toLowerCase().replace("_", ACCEPT_LANGUAGE_VARIANT_SEPARATOR);

const isAvailableLocale = (value: string): value is AvailableLocale =>
  value in I18N_MESSAGE_CATALOG;

const parseSupportedLocales = (
  configuredLocales: readonly string[],
): readonly AvailableLocale[] => {
  const normalizedConfigured = new Set(configuredLocales.map(normalizeLocaleCandidate));
  const availableLocales = Object.keys(I18N_MESSAGE_CATALOG).filter(isAvailableLocale);
  const configuredAvailableLocales = availableLocales.filter((locale) =>
    normalizedConfigured.has(normalizeLocaleCandidate(locale)),
  );
  return configuredAvailableLocales.length > 0 ? configuredAvailableLocales : [DEFAULT_LOCALE];
};

const resolveFromCandidates = (
  candidates: readonly (string | null | undefined)[],
  supportedLocales: readonly AvailableLocale[],
): AvailableLocale | null => {
  const normalizedSupportedLocales = new Map(
    supportedLocales.map((locale) => [normalizeLocaleCandidate(locale), locale]),
  );

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const normalizedCandidate = normalizeLocaleCandidate(candidate);
    const directMatch = normalizedSupportedLocales.get(normalizedCandidate);
    if (directMatch) {
      return directMatch;
    }

    const baseLanguage = normalizedCandidate.split(ACCEPT_LANGUAGE_VARIANT_SEPARATOR)[0];
    const languageMatch = supportedLocales.find((locale) =>
      normalizeLocaleCandidate(locale).startsWith(
        `${baseLanguage}${ACCEPT_LANGUAGE_VARIANT_SEPARATOR}`,
      ),
    );
    if (languageMatch) {
      return languageMatch;
    }
  }

  return null;
};

const parseAcceptLanguageValues = (value: string | undefined): string[] => {
  if (!value) {
    return [];
  }
  return value
    .split(ACCEPT_LANGUAGE_SEPARATOR)
    .map((entry) => entry.split(ACCEPT_LANGUAGE_WEIGHT_SEPARATOR)[0]?.trim() ?? "")
    .filter((entry) => entry.length > 0);
};

const resolveInitialLocale = ({
  cookieLocale,
  acceptLanguageHeader,
  browserLocale,
  supportedLocales,
  defaultLocale,
}: LocaleResolutionInput): AvailableLocale => {
  const acceptLanguageLocales = parseAcceptLanguageValues(acceptLanguageHeader);
  const resolvedLocale = resolveFromCandidates(
    [cookieLocale, ...acceptLanguageLocales, browserLocale],
    supportedLocales,
  );
  return resolvedLocale ?? defaultLocale;
};

/**
 * Installs `vue-i18n` using SSR-safe locale resolution and shared runtime config.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const runtimeConfig = useRuntimeConfig();
  const i18nConfig = runtimeConfig.public.i18n;
  const supportedLocales = parseSupportedLocales(i18nConfig.supportedLocales);
  const defaultLocale =
    resolveFromCandidates([i18nConfig.defaultLocale], supportedLocales) ?? DEFAULT_LOCALE;
  const fallbackLocale =
    resolveFromCandidates([i18nConfig.fallbackLocale], supportedLocales) ?? defaultLocale;
  const localeCookie = useCookie<AvailableLocale>(i18nConfig.localeCookieKey, {
    sameSite: "lax",
    path: "/",
    default: () => defaultLocale,
  });
  const acceptLanguageHeader = import.meta.server
    ? useRequestHeaders(["accept-language"])["accept-language"]
    : undefined;
  const browserLocale = import.meta.client ? navigator.language : undefined;
  const initialLocale = resolveInitialLocale({
    cookieLocale: localeCookie.value,
    acceptLanguageHeader,
    browserLocale,
    supportedLocales,
    defaultLocale,
  });

  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: initialLocale,
    fallbackLocale,
    messages: I18N_MESSAGE_CATALOG,
    missingWarn: false,
    fallbackWarn: false,
  });

  nuxtApp.vueApp.use(i18n);

  useHead(() => ({
    htmlAttrs: {
      lang: i18n.global.locale.value,
    },
  }));

  watch(
    () => i18n.global.locale.value,
    (nextLocale) => {
      localeCookie.value = nextLocale;
    },
    { immediate: true },
  );
});
