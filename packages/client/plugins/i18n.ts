import { DEFAULT_APP_LANGUAGE } from "@bao/shared";
import { createI18n } from "vue-i18n";
import { type AvailableLocale, I18N_MESSAGE_CATALOG } from "~/constants/i18n-catalog";

const DEFAULT_LOCALE: AvailableLocale = DEFAULT_APP_LANGUAGE;
const ACCEPT_LANGUAGE_SEPARATOR = ",";
const ACCEPT_LANGUAGE_WEIGHT_SEPARATOR = ";";
const ACCEPT_LANGUAGE_QUALITY_PREFIX = "q=";
const ACCEPT_LANGUAGE_VARIANT_SEPARATOR = "-";
const ACCEPT_LANGUAGE_DEFAULT_QUALITY = 1;
const ACCEPT_LANGUAGE_MIN_QUALITY = 0;
const ACCEPT_LANGUAGE_MAX_QUALITY = 1;

interface LocaleResolutionInput {
  readonly cookieLocale: string | null | undefined;
  readonly acceptLanguageHeader: string | undefined;
  readonly browserLocale: string | undefined;
  readonly supportedLocales: readonly AvailableLocale[];
  readonly defaultLocale: AvailableLocale;
}

interface WeightedLocaleCandidate {
  readonly locale: string;
  readonly quality: number;
  readonly order: number;
}

const normalizeLocaleCandidate = (value: string): string =>
  value.trim().toLowerCase().replaceAll("_", ACCEPT_LANGUAGE_VARIANT_SEPARATOR);

const isAvailableLocale = (value: string): value is AvailableLocale =>
  Object.hasOwn(I18N_MESSAGE_CATALOG, value);

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

  const weightedCandidates = value
    .split(ACCEPT_LANGUAGE_SEPARATOR)
    .map((entry, order): WeightedLocaleCandidate | null => {
      const segments = entry
        .split(ACCEPT_LANGUAGE_WEIGHT_SEPARATOR)
        .map((segment) => segment.trim())
        .filter((segment) => segment.length > 0);
      const [localeSegment, ...qualitySegments] = segments;
      if (!localeSegment) {
        return null;
      }

      const qualitySegment = qualitySegments.find((segment) =>
        segment.toLowerCase().startsWith(ACCEPT_LANGUAGE_QUALITY_PREFIX),
      );
      const parsedQualityValue = qualitySegment
        ? Number.parseFloat(qualitySegment.slice(ACCEPT_LANGUAGE_QUALITY_PREFIX.length))
        : ACCEPT_LANGUAGE_DEFAULT_QUALITY;
      const quality = Number.isFinite(parsedQualityValue)
        ? Math.min(
            ACCEPT_LANGUAGE_MAX_QUALITY,
            Math.max(ACCEPT_LANGUAGE_MIN_QUALITY, parsedQualityValue),
          )
        : ACCEPT_LANGUAGE_DEFAULT_QUALITY;

      return {
        locale: localeSegment,
        quality,
        order,
      };
    })
    .filter((candidate): candidate is WeightedLocaleCandidate => candidate !== null)
    .sort((left, right) => right.quality - left.quality || left.order - right.order);

  return weightedCandidates.map((candidate) => candidate.locale);
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
