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
 */
export const UI_GRID_CLASS_BY_TOKEN: Record<UiGridToken, string> = {
  single: "grid grid-cols-1 gap-4",
  twoColumn: "grid grid-cols-1 gap-4 md:grid-cols-2",
  twoColumnSm: "grid grid-cols-1 gap-4 sm:grid-cols-2",
  twoColumnSmGap2: "grid grid-cols-1 gap-2 sm:grid-cols-2",
  twoColumnMdGap3: "grid grid-cols-1 gap-3 md:grid-cols-2",
  twoColumnMdGap6: "grid grid-cols-1 gap-6 md:grid-cols-2",
  twoToFour: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4",
  twoToFourLg: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4",
  twoColumnXl: "grid grid-cols-1 gap-6 xl:grid-cols-2",
  twoColumnXlGap4: "grid grid-cols-1 gap-4 xl:grid-cols-2",
  twoColumnWide: "grid grid-cols-1 gap-6 lg:grid-cols-2",
  threeColumnWide: "grid grid-cols-1 gap-3 lg:grid-cols-3",
  threeColumnLg: "grid grid-cols-1 gap-6 lg:grid-cols-3",
  threeColumnLgGap4: "grid grid-cols-1 gap-4 lg:grid-cols-3",
  threeColumnLgFromMd: "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
  threeColumnMd: "grid grid-cols-1 gap-4 md:grid-cols-3",
  threeColumnMdGap6: "grid grid-cols-1 gap-6 md:grid-cols-3",
  threeColumn: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3",
  threeColumnResponsive: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
  threeColumnXlGap6: "grid grid-cols-1 gap-6 xl:grid-cols-3",
  fourColumnLg: "grid grid-cols-1 gap-3 lg:grid-cols-4",
  fourColumnLgGap4: "grid grid-cols-1 gap-4 lg:grid-cols-4",
  fourColumn: "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4",
  fourColumnFromTwo: "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4",
  bento: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  /** Sidebar + content: first column should use `lg:w-64 shrink-0`, second `min-w-0 flex-1`. */
  sidebar: "flex flex-col gap-6 lg:flex-row lg:items-start",
  split: "grid grid-cols-1 gap-6 lg:grid-cols-2",
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

/** Workspace navigator max-width at xl breakpoint. */
export const WORKSPACE_NAV_MAX_WIDTH_XL_CLASS = "xl:max-w-4xl";

/** Hero page title responsive sizing. */
export const HERO_TITLE_RESPONSIVE_CLASS = "sm:text-5xl";

/** Responsive padding tokens (breakpoint-prefixed; feature components must import these). */
export const RESPONSIVE_PADDING_MD_P6_CLASS = "md:p-6";
export const RESPONSIVE_PADDING_LG_P8_CLASS = "lg:p-8";
export const RESPONSIVE_PADDING_SM_PX6_CLASS = "sm:px-6";

/** Responsive width tokens. */
export const RESPONSIVE_WIDTH_LG_W80_CLASS = "lg:w-80";
/** Full-width control on mobile; intrinsic width from `sm` up (CTA rows). */
export const RESPONSIVE_WIDTH_SM_AUTO_CLASS = "sm:w-auto";
/** Stack actions vertically on mobile; row from `sm` up. */
export const RESPONSIVE_FLEX_COL_SM_ROW_CLASS = "flex flex-col sm:flex-row";

/** Responsive typography tokens. */
export const RESPONSIVE_TEXT_MD_3XL_CLASS = "md:text-3xl";
export const RESPONSIVE_TEXT_XL_4XL_CLASS = "xl:text-4xl";

/** Dashboard welcome banner title responsive scale. */
export const DASHBOARD_WELCOME_TITLE_RESPONSIVE_CLASS = "md:text-3xl xl:text-4xl";

/** Chat panel horizontal padding at sm breakpoint. */
export const CHAT_PANEL_PADDING_SM_PX6_CLASS = "sm:px-6";

/** API docs endpoint navigator aside width at lg breakpoint. */
export const API_DOCS_NAV_ASIDE_LG_CLASS = "lg:sticky lg:top-6 lg:w-80 lg:shrink-0";

/** Dashboard onboarding card body padding at lg breakpoint. */
export const DASHBOARD_ONBOARDING_BODY_LG_P8_CLASS = "lg:p-8";

/** Brand settings card body padding (compact mobile, comfortable md+). */
export const BRAND_CARD_BODY_RESPONSIVE_CLASS = "card-body p-4 md:p-6";

/**
 * Dual-surface data lists: card stack below lg, dense table from lg up.
 * Wide zebra tables must pair both tokens (validate:ui-pagination-tables).
 */
export const VISIBILITY_SHOW_BELOW_LG_CLASS = "lg:hidden";
export const VISIBILITY_HIDE_BELOW_LG_CLASS = "hidden lg:block";
