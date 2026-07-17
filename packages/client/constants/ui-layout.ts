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
  | "twoColumnSm"
  | "twoColumnMdGap6"
  | "twoToFour"
  | "twoToFourLg"
  | "twoColumnXl"
  | "twoColumnWide"
  | "threeColumnWide"
  | "threeColumnLg"
  | "threeColumnLgGap4"
  | "threeColumnMd"
  | "threeColumnMdGap6"
  | "threeColumn"
  | "threeColumnResponsive"
  | "fourColumnLg"
  | "fourColumnLgGap4"
  | "fourColumn"
  /** Dashboard-style bento: uniform gap-6, up to four columns on xl */
  | "bento"
  | "sidebar"
  | "split"
  /** AI chat main + sidebar split at xl. */
  | "chatSplit";

/**
 * Canonical class map for reusable grid layouts.
 */
export const UI_GRID_CLASS_BY_TOKEN: Record<UiGridToken, string> = {
  single: "grid grid-cols-1 gap-4",
  twoColumn: "grid grid-cols-1 gap-4 md:grid-cols-2",
  twoColumnSm: "grid grid-cols-1 gap-4 sm:grid-cols-2",
  twoColumnMdGap6: "grid grid-cols-1 gap-6 md:grid-cols-2",
  twoToFour: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4",
  twoToFourLg: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4",
  twoColumnXl: "grid grid-cols-1 gap-6 xl:grid-cols-2",
  twoColumnWide: "grid grid-cols-1 gap-6 lg:grid-cols-2",
  threeColumnWide: "grid grid-cols-1 gap-3 lg:grid-cols-3",
  threeColumnLg: "grid grid-cols-1 gap-6 lg:grid-cols-3",
  threeColumnLgGap4: "grid grid-cols-1 gap-4 lg:grid-cols-3",
  threeColumnMd: "grid grid-cols-1 gap-4 md:grid-cols-3",
  threeColumnMdGap6: "grid grid-cols-1 gap-6 md:grid-cols-3",
  threeColumn: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3",
  threeColumnResponsive: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
  fourColumnLg: "grid grid-cols-1 gap-3 lg:grid-cols-4",
  fourColumnLgGap4: "grid grid-cols-1 gap-4 lg:grid-cols-4",
  fourColumn: "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4",
  bento: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  /** Sidebar + content: first column should use `lg:w-64 shrink-0`, second `min-w-0 flex-1`. */
  sidebar: "flex flex-col gap-6 lg:flex-row lg:items-start",
  split: "grid grid-cols-1 gap-6 lg:grid-cols-2",
  chatSplit: "grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]",
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
