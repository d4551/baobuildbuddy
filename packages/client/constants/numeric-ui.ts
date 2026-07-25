/**
 * Named numeric UI constants — Biome `noMagicNumbers` SSOT for client surfaces.
 */

export const PERCENT_MAX = 100;

/** Max stagger index for entrance motion lists (0–11). */
export const UI_STAGGER_INDEX_MAX = 11;

/** Common LoadingSkeleton line counts. */
export const LOADING_SKELETON_LINES = {
  compact: 3,
  short: 4,
  medium: 5,
  long: 6,
  form: 8,
} as const;

/** Chip / tag preview caps. */
export const UI_CHIP_PREVIEW_LIMIT = 6;

/** Secondary chip overflow threshold. */
export const UI_CHIP_OVERFLOW_THRESHOLD = 3;

/** Navbar scroll elevation threshold (px). */
export const NAVBAR_SCROLL_ELEVATION_PX = 8;

/** Automation live-event timeline window. */
export const AUTOMATION_LIVE_EVENT_WINDOW = 12;

/** Base-36 id seed slice bounds. */
export const BASE36_ID_RADIX = 36;
export const BASE36_ID_SLICE_START = 2;
export const BASE36_ID_SLICE_END = 10;
