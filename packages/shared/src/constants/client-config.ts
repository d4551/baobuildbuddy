import { DEFAULT_BRAND_SETTINGS } from "./branding";

/**
 * Default brand tagline shown in app-shell and metadata surfaces.
 */
export const APP_BRAND_TAGLINE = DEFAULT_BRAND_SETTINGS.content.tagline;
/**
 * Default product description used for SEO and embed metadata.
 */
export const DEFAULT_APP_DESCRIPTION = DEFAULT_BRAND_SETTINGS.content.defaultDescription;
export const DEFAULT_QUERY_RETRY_COUNT = 1;
export const DEFAULT_QUERY_STALE_TIME_MS = 60_000;
export const QUERY_REFETCH_ON_FOCUS_DISABLED = "false";
export const DEFAULT_I18N_LOCALE_COOKIE_KEY = "bao-locale";
export const NUXT_COMPATIBILITY_DATE = "2025-01-01";
export const VITE_BUILD_TARGET = "baseline-widely-available";
export const DECIMAL_RADIX = 10;
export const LOCALE_CHUNK_NAME_PREFIX = "locale-";
export const LOCALE_FILE_EXTENSION = ".ts";
export const LOCALES_DIRECTORY_SEGMENT = "/locales/";
export const MODULE_PATH_SEPARATOR = "/";
export const NODE_MODULES_PATH_SEGMENT = "/node_modules/";
export const PNPM_PATH_SEGMENT = ".pnpm/";
export const WINDOWS_PATH_SEPARATOR = "\\";
