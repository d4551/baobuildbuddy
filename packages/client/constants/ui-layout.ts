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
  | "twoColumnSmGap2"
  | "twoColumnMdGap3"
  | "twoColumnMdGap6"
  | "twoToFour"
  | "twoToFourLg"
  | "twoColumnXl"
  | "twoColumnXlGap4"
  | "twoColumnWide"
  | "threeColumnWide"
  | "threeColumnLg"
  | "threeColumnLgGap4"
  | "threeColumnLgFromMd"
  | "threeColumnMd"
  | "threeColumnMdGap6"
  | "threeColumn"
  | "threeColumnResponsive"
  | "threeColumnXlGap6"
  | "fourColumnLg"
  | "fourColumnLgGap4"
  | "fourColumn"
  | "fourColumnFromTwo"
  /** Dashboard-style bento: uniform gap-6, up to four columns on xl */
  | "bento"
  | "sidebar"
  | "split"
  /** AI chat main + sidebar split at xl. */
  | "chatSplit"
  /** Settings AI providers: primary readiness + secondary routing columns. */
  | "providersSplit";

/**
 * Canonical class map for reusable grid layouts.
 * Fluid grids use auto-fit/auto-fill with minmax — no breakpoint coupling.
 */
export const UI_GRID_CLASS_BY_TOKEN: Record<UiGridToken, string> = {
  single: "grid grid-cols-1 gap-4",
  twoColumn: "grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]",
  twoColumnSm: "grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]",
  twoColumnSmGap2: "grid gap-2 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]",
  twoColumnMdGap3: "grid gap-3 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]",
  twoColumnMdGap6: "grid gap-6 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]",
  twoToFour: "grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]",
  twoToFourLg: "grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]",
  twoColumnXl: "grid gap-6 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]",
  twoColumnXlGap4: "grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]",
  twoColumnWide: "grid gap-6 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]",
  threeColumnWide: "grid gap-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]",
  threeColumnLg: "grid gap-6 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]",
  threeColumnLgGap4: "grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]",
  threeColumnLgFromMd: "grid gap-6 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]",
  threeColumnMd: "grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]",
  threeColumnMdGap6: "grid gap-6 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]",
  threeColumn: "grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]",
  threeColumnResponsive: "grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]",
  threeColumnXlGap6: "grid gap-6 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]",
  fourColumnLg: "grid gap-3 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]",
  fourColumnLgGap4: "grid gap-4 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]",
  fourColumn: "grid gap-3 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]",
  fourColumnFromTwo: "grid gap-4 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]",
  bento: "grid gap-6 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]",
  /** Sidebar + content: first column should use `lg:w-64 shrink-0`, second `min-w-0 flex-1`. */
  sidebar: "flex flex-col gap-6 lg:flex-row lg:items-start",
  split: "grid gap-6 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]",
  chatSplit: "grid min-h-0 flex-1 gap-4 xl:grid-split-chat",
  providersSplit: "grid gap-4 xl:grid-split-providers",
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

/** Hero page title responsive sizing. */
export const HERO_TITLE_RESPONSIVE_CLASS = "sm:text-5xl";

/** Responsive padding tokens (breakpoint-prefixed; feature components must import these). */
export const RESPONSIVE_PADDING_MD_P6_CLASS = "md:p-6";
export const RESPONSIVE_PADDING_LG_P8_CLASS = "lg:p-8";

/** Responsive width tokens. */
export const RESPONSIVE_WIDTH_LG_W80_CLASS = "lg:w-80";
/** Full-width control on mobile; intrinsic width from `sm` up (CTA rows). */
export const RESPONSIVE_WIDTH_SM_AUTO_CLASS = "sm:w-auto";
/** Stack actions vertically on mobile; row from `sm` up. */
export const RESPONSIVE_FLEX_COL_SM_ROW_CLASS = "flex flex-col sm:flex-row";

/** Responsive typography tokens. */
export const RESPONSIVE_TEXT_MD_3XL_CLASS = "md:text-3xl";

/** Chat panel horizontal padding at sm breakpoint. */
export const CHAT_PANEL_PADDING_SM_PX6_CLASS = "sm:px-6";

/**
 * Dual-surface data lists: card stack below lg, dense table from lg up.
 * Wide zebra tables must pair both tokens (validate:ui-pagination-tables).
 */
export const VISIBILITY_SHOW_BELOW_LG_CLASS = "lg:hidden";
export const VISIBILITY_HIDE_BELOW_LG_CLASS = "hidden lg:block";
/** Compact fold: hide vertical stats / secondary chrome below sm. */
export const VISIBILITY_HIDE_BELOW_SM_CLASS = "max-sm:hidden";
