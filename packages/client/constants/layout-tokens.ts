/**
 * Extended layout SSOT design tokens (constants + validators; not `.bao` archives).
 *
 * Automatically re-exported by `~/constants/layout` — consume from that file
 * (do not import this module directly).
 *
 * Split from layout.ts to keep each source file under the 400-line monolith limit
 * while maintaining a single public import path for all token consumers.
 *
 * Action button tokens are defined in layout-tokens-actions / layout-action-soft
 * and aliased here so the facade surface stays complete.
 */

import { SOFT_ACTION_CLASS as _SOFT_ACTION_CLASS } from "./layout-action-soft";
import {
  OUTLINE_ACTION_CLASS as _OUTLINE_ACTION_CLASS,
  PRIMARY_ACTION_CLASS as _PRIMARY_ACTION_CLASS,
  PRIMARY_BUTTON_VARIANT_CLASS as _PRIMARY_BUTTON_VARIANT_CLASS,
} from "./layout-tokens-actions";

/** Common vertical stack spacing. */
export const STACK_SPACE_Y_TOKEN_CLASS = {
  stack1: "space-y-1",
  stack2: "space-y-2",
  stack3: "space-y-3",
  stack4: "space-y-4",
  stack5: "space-y-5",
  stack6: "space-y-6",
  stack8: "space-y-8",
} as const;
export type StackSpaceYToken = keyof typeof STACK_SPACE_Y_TOKEN_CLASS;

/**
 * Pointer-events tokens for clickable-card overlays.
 * Overlay stays clickable; content shell passes events through; interactive
 * controls (buttons/links/inputs) re-enable hit testing.
 */
export const POINTER_EVENTS_TOKEN_CLASS = {
  none: "pointer-events-none",
  auto: "pointer-events-auto",
} as const;
export type PointerEventsToken = keyof typeof POINTER_EVENTS_TOKEN_CLASS;

/** Common flex gap tokens. */
export const FLEX_GAP_TOKEN_CLASS = {
  gap0: "gap-0",
  gap1: "gap-1",
  gap2: "gap-2",
  gap3: "gap-3",
  gap4: "gap-4",
  gap5: "gap-5",
  gap6: "gap-6",
} as const;
export type FlexGapToken = keyof typeof FLEX_GAP_TOKEN_CLASS;

/** Common margin tokens. */
export const MARGIN_TOKEN_CLASS = {
  ml1: "ml-1",
  ml2: "ml-2",
  mr1: "me-1",
  mr2: "mr-2",
  mt0: "mt-0",
  mtHalf: "mt-0.5",
  mt05: "mt-0.5",
  mt1: "mt-1",
  mt2: "mt-2",
  mt3: "mt-3",
  mt4: "mt-4",
  mt5: "mt-5",
  mt6: "mt-6",
  mt24: "mt-24",
  mb1: "mb-1",
  mb2: "mb-2",
  mb3: "mb-3",
  mb4: "mb-4",
  mb6: "mb-6",
  mb8: "mb-8",
} as const;
export type MarginToken = keyof typeof MARGIN_TOKEN_CLASS;

/** Scroll-margin tokens (anchor offset under sticky chrome). */
export const SCROLL_MARGIN_TOKEN_CLASS = {
  scrollMt24: "scroll-mt-24",
} as const;
export type ScrollMarginToken = keyof typeof SCROLL_MARGIN_TOKEN_CLASS;

/** Max-height tokens for scrollable panels. */
export const MAX_HEIGHT_TOKEN_CLASS = {
  maxH0: "max-h-0",
  maxH72: "max-h-72",
  maxH96: "max-h-96",
  maxHScreen: "max-h-screen",
} as const;
export type MaxHeightToken = keyof typeof MAX_HEIGHT_TOKEN_CLASS;

/** Common width tokens. */
export const WIDTH_TOKEN_CLASS = {
  w3: "w-3",
  w4: "w-4",
  w5: "w-5",
  w6: "w-6",
  w8: "w-8",
  w10: "w-10",
  w12: "w-12",
  w14: "w-14",
  w16: "w-16",
  w20: "w-20",
  w40: "w-40",
} as const;
export type WidthToken = keyof typeof WIDTH_TOKEN_CLASS;

/** Common height tokens. */
export const HEIGHT_TOKEN_CLASS = {
  h3: "h-3",
  h4: "h-4",
  h5: "h-5",
  h6: "h-6",
  h8: "h-8",
  h10: "h-10",
  h12: "h-12",
  h14: "h-14",
  h16: "h-16",
  h48: "h-48",
  h72: "h-72",
  h96: "h-96",
} as const;
export type HeightToken = keyof typeof HEIGHT_TOKEN_CLASS;

/** Common padding tokens. */
export const PADDING_TOKEN_CLASS = {
  p0: "p-0",
  p1: "p-1",
  p2: "p-2",
  p3: "p-3",
  p4: "p-4",
  p5: "p-5",
  p6: "p-6",
  p8: "p-8",
  px0: "px-0",
  px3: "px-3",
  px4: "px-4",
  px5: "px-5",
  px6: "px-6",
  py0: "py-0",
  py1: "py-1",
  py2: "py-2",
  py3: "py-3",
  py4: "py-4",
  py5: "py-5",
  py8: "py-8",
  py12: "py-12",
  pb4: "pb-4",
  pr10: "pr-10",
  pr14: "pr-14",
  pt2: "pt-2",
  pt3: "pt-3",
  pt4: "pt-4",
} as const;
export type PaddingToken = keyof typeof PADDING_TOKEN_CLASS;

/** Typography scale tokens for body copy and headings. */
export const TYPOGRAPHY_SCALE_CLASS = {
  sm: "text-sm",
  xs: "text-xs",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  xl2: "text-2xl",
  xl3: "text-3xl",
  xl4: "text-4xl",
  xl5: "text-5xl",
  xl6: "text-6xl",
} as const;
export type TypographyScaleToken = keyof typeof TYPOGRAPHY_SCALE_CLASS;

/** Semantic font-weight tokens (single source for bold/medium/etc.). */
export const FONT_WEIGHT_TOKEN_CLASS = {
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold",
  normal: "font-normal",
} as const;
export type FontWeightToken = keyof typeof FONT_WEIGHT_TOKEN_CLASS;

/** Line-height tokens for body copy and headings outside glass surfaces. */
export const LEADING_TOKEN_CLASS = {
  tight: "leading-tight",
  snug: "leading-snug",
  normal: "leading-normal",
  relaxed: "leading-relaxed",
  loose: "leading-loose",
  leading5: "leading-5",
  leading6: "leading-6",
} as const;
export type LeadingToken = keyof typeof LEADING_TOKEN_CLASS;

/** Letter-spacing tokens for labels, badges, and uppercase copy. */
export const TRACKING_TOKEN_CLASS = {
  tighter: "tracking-tighter",
  tight: "tracking-tight",
  normal: "tracking-normal",
  wide: "tracking-wide",
  wider: "tracking-wider",
  widest: "tracking-widest",
} as const;
export type TrackingToken = keyof typeof TRACKING_TOKEN_CLASS;

/**
 * Glass card animation tokens. Consumed by UiGlassCard and CSS animations
 * in assets/css/main.css. Stagger index classes map to :nth-child-style
 * delay selectors.
 */
export const GLASS_CARD_HOVER_CLASS = "glass-card-hover";

export const GLASS_CARD_ENTER_CLASS = "glass-card-enter";

/** SVG stroke-width for decorative icons (24x24 viewBox). */
export const SVG_STROKE_WIDTH_DEFAULT = 2;

/**
 * Canonical shadow tokens. These map to the .glass-* surface system in
 * main.css. Inline `shadow-*` Tailwind utilities are forbidden outside
 * SSOT; consume these constants instead.
 */
export const SHADOW_TOKEN_CLASS = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
  inner: "shadow-inner",
  printNone: "print:shadow-none",
} as const;
export type ShadowToken = keyof typeof SHADOW_TOKEN_CLASS;

/**
 * Canonical radius tokens. Inline `rounded-*` Tailwind utilities are
 * forbidden outside SSOT; consume these constants instead.
 */
export const RADIUS_TOKEN_CLASS = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
  full: "rounded-full",
} as const;
export type RadiusToken = keyof typeof RADIUS_TOKEN_CLASS;

/** Common avatars / icon badges that need a circular surface. */
export const CIRCULAR_BADGE_CLASS = RADIUS_TOKEN_CLASS.full;

/**
 * Touch-safe daisyUI toggle.
 *
 * A bare `toggle` computes to 40×24 in every size variant, and the input is not
 * wrapped in a larger label hit area — so the real target was 24px tall, 20px under
 * the Apple HIG / WCAG 2.5.5 floor that `TOUCH_TARGET_MIN_CLASS` enforces everywhere
 * else. Measured in-browser at 44×80 with these utilities.
 */
export const TOGGLE_CONTROL_CLASS = "toggle toggle-primary h-11 min-h-11 w-20";

/** Square sibling of {@link TOGGLE_CONTROL_CLASS}; daisyUI checkboxes are equally undersized. */
export const CHECKBOX_CONTROL_CLASS = "checkbox checkbox-primary h-11 min-h-11 w-11";

/**
 * daisyUI 5 letter-avatar container. v4's bare `placeholder` modifier was renamed
 * to `avatar-placeholder`; the old name is dead CSS, so the grid/flex centering
 * never applies and the initial renders off-centre against the circle.
 */
export const AVATAR_PLACEHOLDER_CLASS = "avatar avatar-placeholder";

/** Form/panel helper widths. */
export const FORM_WIDTH_10_CLASS = "w-10";
export const FORM_WIDTH_16_CLASS = "w-16";
export const FORM_WIDTH_20_CLASS = "w-20";
export const FORM_WIDTH_28_CLASS = "w-28";
export const FORM_WIDTH_32_CLASS = "w-32";

/** Content height tokens. */
export const CONTENT_H_28_CLASS = "h-28";
export const CONTENT_H_40_CLASS = "h-40";
export const CONTENT_H_48_CLASS = "h-48";
export const CONTENT_H_64_CLASS = "h-64";
export const CONTENT_H_72_CLASS = "h-72";

/** Min-height extended tokens. */
export const MIN_H_36_CLASS = "min-h-36";
export const MIN_H_60_CLASS = "min-h-60";
export const MIN_H_80_CLASS = "min-h-80";

/**
 * Apple HIG / WCAG touch-target floor (44×44 CSS px).
 * Use on primary interactive chrome (dock items, critical icon buttons).
 */
/** Floor + fixed height so daisyUI menu/btn padding cannot shrink below 44px. */
export const TOUCH_TARGET_MIN_CLASS = "box-border h-11 min-h-11 min-w-11 py-0";

/** daisyUI primary color variant (segmented controls, selected ghost/outline buttons). */
export const PRIMARY_BUTTON_VARIANT_CLASS = _PRIMARY_BUTTON_VARIANT_CLASS;

/**
 * Primary actionable CTA — daisyUI primary + touch floor.
 * Ban pairing `btn-primary` with `btn-sm`/`btn-xs` (validate:primary-action-density).
 */
export const PRIMARY_ACTION_CLASS = _PRIMARY_ACTION_CLASS;

/**
 * Secondary / outline CTA — same touch floor as primary without competing for hero primary.
 * Use for quick-action grids and demoted hub cards when a page already owns PRIMARY_ACTION_CLASS.
 */
export const OUTLINE_ACTION_CLASS = _OUTLINE_ACTION_CLASS;

/** daisyUI soft variant + touch floor (prompt chips, demoted secondary). */
export const SOFT_ACTION_CLASS = _SOFT_ACTION_CLASS;

/** Outline variant token segment for composition (ban raw `btn-outline` in consumers). */
export const OUTLINE_BUTTON_VARIANT_CLASS = "btn-outline";

/** Soft variant token segment for composition (ban raw `btn-soft` in consumers). */
export const SOFT_BUTTON_VARIANT_CLASS = "btn-soft";

/** Per-item dock link: meets touch-target floor without forking dock chrome. */
export const SHELL_DOCK_ITEM_CLASS = "min-h-11 min-w-11";

/**
 * Section-rail tab label: visible + truncated @320 (scroll rail), full from sm+.
 * Prefer this over display:none — discoverability without mid-word clip.
 */
export const SECTION_RAIL_LABEL_CLASS =
  "max-w-20 shrink truncate text-xs font-medium sm:max-w-none sm:text-sm";

/** Scroll margin for in-page anchor targets (scroll-mt-24). */
export const SCROLL_MARGIN_TOP_24_CLASS = "scroll-mt-24";

/** Max-height tokens for scrollable panels. */
export const MAX_HEIGHT_72_CLASS = "max-h-72";
export const MAX_HEIGHT_96_CLASS = "max-h-96";

/** Print media padding reset. */
export const PRINT_PADDING_RESET_CLASS = "print:p-0";

/** Max-width extended tokens. */
export const MAX_W_2XL_CLASS = "max-w-2xl";
export const MAX_W_3XL_CLASS = "max-w-3xl";
export const MAX_W_40_CLASS = "max-w-40";
export const MAX_W_48_CLASS = "max-w-48";
export const MAX_W_64_CLASS = "max-w-64";
export const MAX_W_XS_CLASS = "max-w-xs";

/**
 * Canonical daisyUI stats shell variants. Every stats row must reference one —
 * no per-page `stats stats-*` class chains.
 */
export const STATS_SHELL_VARIANT_CLASS = {
  default: "stats stats-vertical w-full border border-base-300 bg-base-200 sm:stats-horizontal",
  lg: "stats stats-vertical w-full bg-base-200 lg:stats-horizontal",
  sm: "stats stats-vertical w-full bg-base-200 sm:stats-horizontal",
  surfaceLg: "stats stats-vertical w-full border border-base-300 bg-base-100 lg:stats-horizontal",
  xl: "stats stats-vertical w-full border border-base-300 bg-base-200 xl:stats-horizontal",
  vertical: "stats stats-vertical w-full bg-base-100",
  brandResponsive:
    "stats stats-vertical w-full border border-base-300 bg-base-100 sm:stats-horizontal xl:stats-vertical",
} as const;

export type StatsShellVariant = keyof typeof STATS_SHELL_VARIANT_CLASS;

/** Canonical daisyUI stats row shell (vertical @mobile → horizontal @sm). */
export const STATS_ROW_SHELL_CLASS = STATS_SHELL_VARIANT_CLASS.default;

/**
 * Canonical daisyUI progress bar color variants. Base `progress` stays static;
 * these tokens supply semantic color only.
 */
export const PROGRESS_BAR_VARIANT_CLASS = {
  primary: "progress-primary",
  success: "progress-success",
  warning: "progress-warning",
  error: "progress-error",
} as const;

export type ProgressBarVariant = keyof typeof PROGRESS_BAR_VARIANT_CLASS;

/**
 * Canonical daisyUI alert color variants. Base `alert` stays static;
 * these tokens supply semantic color only.
 */
export const ALERT_VARIANT_CLASS = {
  info: "alert-info",
  success: "alert-success",
  warning: "alert-warning",
  error: "alert-error",
} as const;

export type AlertVariant = keyof typeof ALERT_VARIANT_CLASS;
