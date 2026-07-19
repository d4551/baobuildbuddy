/**
 * Extended layout SSOT design tokens (constants + validators; not `.bao` archives).
 *
 * Automatically re-exported by `~/constants/layout` — consume from that file
 * (do not import this module directly).
 *
 * Split from layout.ts to keep each source file under the 400-line monolith limit
 * while maintaining a single public import path for all token consumers.
 */

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
  mr1: "mr-1",
  mr2: "mr-2",
  mt0: "mt-0",
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

/** Common width tokens. */
export const WIDTH_TOKEN_CLASS = {
  w3: "w-3",
  w4: "w-4",
  w5: "w-5",
  w6: "w-6",
  w8: "w-8",
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

/**
 * Glass card animation tokens. Consumed by UiGlassCard and CSS animations
 * in assets/css/main.css. Stagger index classes map to :nth-child-style
 * delay selectors.
 */
export const GLASS_CARD_HOVER_CLASS = "glass-card-hover";

export const GLASS_CARD_ENTER_CLASS = "glass-card-enter";

/** SVG stroke-width for decorative icons (24x24 viewBox). */
export const SVG_STROKE_WIDTH_DEFAULT = 2;
