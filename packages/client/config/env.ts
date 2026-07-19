/**
 * Centralized build-time environment configuration for `nuxt.config.ts`.
 *
 * # Why this file exists
 *
 * `nuxt.config.ts` is the canonical build-time configuration seam, so it MUST
 * read env vars at build time. Reading `process.env` inline in that file is
 * flagged by `uiux-standardizer` as a high-severity ban-violation (HB-001) and
 * also makes overrides, fallbacks, and type coercion harder to audit. This
 * module is the SOLE place where `process.env` is read for the Nuxt build
 * configuration: it concentrates every read into one typed seam.
 *
 * # Contract
 *
 * - Each env var is read exactly once and exposed as a `string | undefined`
 *   property on `clientEnv`.
 * - Empty-string env values are coerced to `undefined` here, so call sites can
 *   keep using `||` fallbacks without re-checking `length > 0`.
 * - Numeric/boolean coercion stays at the call site where fallback defaults
 *   (e.g. `DEFAULT_QUERY_STALE_TIME_MS`) are resolved.
 * - This module is build-time only. Importing it from runtime client code
 *   would inline `process.env` reads into the client bundle; runtime values
 *   belong in Nuxt `runtimeConfig` instead.
 */

/**
 * Canonical env var names consumed by `nuxt.config.ts`.
 *
 * Declared as a `const` map so the lookup keys are statically auditable and
 * cannot drift from the property names on `clientEnv`.
 */
const ENV_KEY = {
  apiBase: "NUXT_PUBLIC_API_BASE",
  apiProxy: "NUXT_PUBLIC_API_PROXY",
  serverPort: "SERVER_PORT",
  port: "PORT",
  clientPort: "CLIENT_PORT",
  nuxtClientPort: "NUXT_CLIENT_PORT",
  wsBase: "NUXT_PUBLIC_WS_BASE",
  appTitle: "NUXT_PUBLIC_APP_TITLE",
  appDescription: "NUXT_PUBLIC_APP_DESCRIPTION",
  queryStaleTimeMs: "NUXT_PUBLIC_QUERY_STALE_TIME_MS",
  queryRetryCount: "NUXT_PUBLIC_QUERY_RETRY_COUNT",
  queryRefetchOnFocus: "NUXT_PUBLIC_QUERY_REFETCH_ON_FOCUS",
  i18nDefaultLocale: "NUXT_PUBLIC_I18N_DEFAULT_LOCALE",
  i18nFallbackLocale: "NUXT_PUBLIC_I18N_FALLBACK_LOCALE",
  i18nLocaleCookieKey: "NUXT_PUBLIC_I18N_LOCALE_COOKIE_KEY",
  i18nSupportedLocales: "NUXT_PUBLIC_I18N_SUPPORTED_LOCALES",
} as const;

/**
 * Read a single env var, coercing empty strings to `undefined`.
 *
 * Empty-string coercion keeps `||` fallback semantics at call sites intact
 * without each caller having to repeat `value && value.length > 0`.
 */
const readEnv = (key: string): string | undefined => {
  const value = process.env[key];
  return value && value.length > 0 ? value : undefined;
};

/**
 * Build-time view of every env var the Nuxt config depends on.
 *
 * `serverPort` merges `SERVER_PORT || PORT` and `clientPort` merges
 * `CLIENT_PORT || NUXT_CLIENT_PORT` here so the consumer does not need to
 * know the fallback precedence.
 */
export const clientEnv = {
  apiBase: readEnv(ENV_KEY.apiBase),
  apiProxy: readEnv(ENV_KEY.apiProxy),
  serverPort: readEnv(ENV_KEY.serverPort) ?? readEnv(ENV_KEY.port),
  clientPort: readEnv(ENV_KEY.clientPort) ?? readEnv(ENV_KEY.nuxtClientPort),
  wsBase: readEnv(ENV_KEY.wsBase),
  appTitle: readEnv(ENV_KEY.appTitle),
  appDescription: readEnv(ENV_KEY.appDescription),
  queryStaleTimeMs: readEnv(ENV_KEY.queryStaleTimeMs),
  queryRetryCount: readEnv(ENV_KEY.queryRetryCount),
  queryRefetchOnFocus: readEnv(ENV_KEY.queryRefetchOnFocus),
  i18nDefaultLocale: readEnv(ENV_KEY.i18nDefaultLocale),
  i18nFallbackLocale: readEnv(ENV_KEY.i18nFallbackLocale),
  i18nLocaleCookieKey: readEnv(ENV_KEY.i18nLocaleCookieKey),
  i18nSupportedLocales: readEnv(ENV_KEY.i18nSupportedLocales),
} as const;

export type ClientEnv = typeof clientEnv;
