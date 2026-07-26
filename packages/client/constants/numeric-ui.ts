/**
 * Named numeric UI constants — Biome `noMagicNumbers` SSOT for client surfaces.
 * Prefer `@bao/shared/constants/http`, `numeric`, and `time` for cross-package values.
 */

import { PERCENT_MAX as SHARED_PERCENT_MAX } from "@bao/shared/constants/numeric";

/** Alias of the shared definition — the literal lives in `@bao/shared/constants/numeric`. */
export const PERCENT_MAX = SHARED_PERCENT_MAX;

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

/** Dashboard / jobs recommendation preview count. */
export const UI_RECOMMENDATION_PREVIEW_LIMIT = 4;

/** Setup wizard final step index (1-based). */
export const SETUP_WIZARD_FINAL_STEP = 3;

/** Resume summary minimum character length for quality hints. */
export const RESUME_SUMMARY_MIN_CHARS = 50;

/** Resume project/experience description minimum character length. */
export const RESUME_DESCRIPTION_MIN_CHARS = 20;

/** Resume editor autosave debounce (ms). */
export const RESUME_AUTOSAVE_DEBOUNCE_MS = 900;

/** Default skill-mapping confidence when API omits a value. */
export const SKILL_MAPPING_DEFAULT_CONFIDENCE = 50;

/** WAV header minimum byte length for TTS audio payloads. */
export const WAV_HEADER_MIN_BYTES = 44;

/** Theme cookie max-age in days. */
export const THEME_COOKIE_MAX_AGE_DAYS = 365;

/** Interview realtime socket open wait (ms). */
export const INTERVIEW_SOCKET_OPEN_WAIT_MS = 1_500;

/** Interview realtime ack deadline (ms). */
export const INTERVIEW_SOCKET_ACK_DEADLINE_MS = 20_000;

/** Interview realtime ack poll interval (ms). */
export const INTERVIEW_SOCKET_ACK_POLL_MS = 50;

/** Gamification XP → level divisor. */
export const GAMIFICATION_XP_LEVEL_DIVISOR = 100;

/** Streak day thresholds and multipliers. */
export const GAMIFICATION_STREAK_DAYS = {
  long: 30,
  medium: 14,
  short: 7,
  start: 3,
} as const;

export const GAMIFICATION_STREAK_MULTIPLIER = {
  long: 3,
  medium: 2,
  short: 1.5,
  start: 1.25,
  none: 1,
} as const;

/** IntersectionObserver default thresholds for scroll spy. */
export const SCROLL_SPY_THRESHOLD_NEAR = 0.1;
export const SCROLL_SPY_THRESHOLD_LOW = 0.3;
export const SCROLL_SPY_THRESHOLD_MID = 0.5;
export const SCROLL_SPY_THRESHOLD_HIGH = 0.8;
export const SCROLL_SPY_THRESHOLDS = [
  SCROLL_SPY_THRESHOLD_NEAR,
  SCROLL_SPY_THRESHOLD_LOW,
  SCROLL_SPY_THRESHOLD_MID,
  SCROLL_SPY_THRESHOLD_HIGH,
] as const;

/** Resume build progress checkpoints (percent). */
export const RESUME_BUILD_PROGRESS = {
  answeringBase: 25,
  answeringSpan: 50,
  generating: 50,
} as const;

/** Automation run stream progress fixture (tests). */
export const AUTOMATION_RUN_PROGRESS_FIXTURE = 67;

/** Flow-engine profile completeness epsilon for threshold tests. */
export const FLOW_PROFILE_COMPLETENESS_EPSILON = 0.01;
