/**
 * Width tokens used by shared page scaffolding components.
 */
export type UiWidthToken = "shell" | "narrow" | "content" | "wide";

/**
 * Canonical class map for page width tokens.
 */
export const UI_WIDTH_CLASS_BY_TOKEN: Record<UiWidthToken, string> = {
  shell: "w-full",
  narrow: "mx-auto w-full max-w-2xl",
  content: "mx-auto w-full max-w-7xl",
  wide: "mx-auto w-full max-w-screen-2xl",
};

/**
 * Spacing tokens used by scaffolded page sections.
 */
export type UiSpacingToken = "compact" | "comfortable" | "relaxed";

/**
 * Canonical class map for vertical spacing tokens.
 */
export const UI_SPACING_CLASS_BY_TOKEN: Record<UiSpacingToken, string> = {
  compact: "space-y-4",
  comfortable: "space-y-6",
  relaxed: "space-y-8",
};

/**
 * Grid tokens used by shared section grid primitives.
 */
export type UiGridToken =
  | "single"
  | "twoColumn"
  | "twoToFour"
  | "twoColumnXl"
  | "twoColumnWide"
  | "threeColumnWide"
  | "threeColumnLg"
  | "threeColumnMd"
  | "threeColumn"
  | "fourColumnLg"
  | "fourColumn"
  | "sidebar"
  | "split";

/**
 * Canonical class map for reusable grid layouts.
 */
export const UI_GRID_CLASS_BY_TOKEN: Record<UiGridToken, string> = {
  single: "grid grid-cols-1 gap-4",
  twoColumn: "grid grid-cols-1 gap-4 md:grid-cols-2",
  twoToFour: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4",
  twoColumnXl: "grid grid-cols-1 gap-6 xl:grid-cols-2",
  twoColumnWide: "grid grid-cols-1 gap-6 lg:grid-cols-2",
  threeColumnWide: "grid grid-cols-1 gap-3 lg:grid-cols-3",
  threeColumnLg: "grid grid-cols-1 gap-6 lg:grid-cols-3",
  threeColumnMd: "grid grid-cols-1 gap-4 md:grid-cols-3",
  threeColumn: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3",
  fourColumnLg: "grid grid-cols-1 gap-3 lg:grid-cols-4",
  fourColumn: "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4",
  sidebar: "grid grid-cols-1 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]",
  split: "grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]",
};

/**
 * Modal size tokens used by the shared modal frame component.
 */
export type UiModalSizeToken = "compact" | "standard" | "wide" | "full";

/**
 * Canonical class map for reusable modal width sizing.
 */
export const UI_MODAL_SIZE_CLASS_BY_TOKEN: Record<UiModalSizeToken, string> = {
  compact: "max-w-2xl",
  standard: "w-11/12 max-w-4xl",
  wide: "w-11/12 max-w-5xl",
  full: "w-11/12 max-w-screen-xl",
};
