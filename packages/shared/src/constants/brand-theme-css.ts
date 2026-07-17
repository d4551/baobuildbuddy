/**
 * Canonical CSS value patterns for brand theme palette fields.
 * Colors are oklch-only; radii/sizes use rem|px; depth/noise are unitless 0|1.
 */

/** oklch(L% C H) with optional alpha channel */
export const BRAND_THEME_COLOR_PATTERN =
  /^oklch\(\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?(?:\s*\/\s*(?:\d+(?:\.\d+)?%?|0?\.\d+))?\)$/u;

/** Length tokens used for radius, size, and border width */
export const BRAND_THEME_LENGTH_PATTERN = /^\d+(?:\.\d+)?(?:rem|px)$/u;

/** Unitless boolean-like flags (depth / noise) */
export const BRAND_THEME_UNITLESS_FLAG_PATTERN = /^[01]$/u;

/** TypeBox / JSON Schema string form of {@link BRAND_THEME_COLOR_PATTERN} */
export const BRAND_THEME_COLOR_PATTERN_SOURCE = BRAND_THEME_COLOR_PATTERN.source;

/** TypeBox / JSON Schema string form of {@link BRAND_THEME_LENGTH_PATTERN} */
export const BRAND_THEME_LENGTH_PATTERN_SOURCE = BRAND_THEME_LENGTH_PATTERN.source;

/** TypeBox / JSON Schema string form of {@link BRAND_THEME_UNITLESS_FLAG_PATTERN} */
export const BRAND_THEME_UNITLESS_FLAG_PATTERN_SOURCE = BRAND_THEME_UNITLESS_FLAG_PATTERN.source;
