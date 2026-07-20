/**
 * Media query used to detect desktop navigation behavior.
 */
export const LAYOUT_DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

/**
 * Stable DOM id for the application drawer toggle input.
 */
export const APP_DRAWER_ID = "app-drawer";

/**
 * Stable DOM id for the main content landmark target.
 */
export const APP_MAIN_CONTENT_ID = "main-content";

/**
 * Stable DOM id for the quick-actions floating menu.
 */
export const QUICK_ACTION_MENU_ID = "quick-actions-menu";

/**
 * Stable DOM id for the floating chat panel.
 */
export const FLOATING_CHAT_PANEL_ID = "floating-chat-panel";

/**
 * Toast host id (matches daisyUI toast placement contract).
 */
export const TOAST_CONTAINER_DOM_ID = "toast-container";

/**
 * Inner content rail inside `main#main-content` (max-w-7xl + spacing scale).
 * Includes bottom padding for shell chrome (dock / FAB) on small viewports.
 */
export const SHELL_MAIN_INNER_CLASS =
  "mx-auto w-full min-w-0 max-w-7xl space-y-6 overflow-x-clip px-4 py-6 pb-36 max-lg:pe-16 sm:px-6 lg:px-8 lg:pb-8";

/**
 * Fixed mobile primary dock chrome (daisyUI `dock` + glass-clear + safe-area).
 * Desktop: hidden via `lg:hidden` (sidebar owns primary nav).
 */
export const SHELL_DOCK_CLASS =
  "dock glass-clear fixed bottom-0 inset-x-0 z-30 border-t border-base-300 pb-[env(safe-area-inset-bottom)] lg:hidden";

/** Root app drawer contract. */
export const SHELL_DRAWER_CLASS = "min-h-screen lg:drawer-open";

/** Drawer content container containing navbar, main, and toast host. */
export const SHELL_DRAWER_CONTENT_CLASS = "flex min-h-screen min-w-0 flex-col overflow-x-clip";

/** Drawer side container. */
export const SHELL_DRAWER_SIDE_CLASS = "z-20 is-drawer-close:overflow-visible";

/** Shared navbar classes for authenticated shell pages. Persistent control layer (§5.1). */
export const SHELL_NAVBAR_CLASS =
  "glass-subtle sticky top-0 z-10 border-b border-base-300 transition-shadow duration-[var(--motion-standard)] ease-[var(--ease-response)]";

/**
 * Glass surface for elevated cards/panels (fluid depth without palette literals).
 * Strong material = card-glass-strong; Modal material = card-glass-modal.
 * All variants consume the `.glass-*` token system in `assets/css/main.css`.
 */
export const SURFACE_GLASS_CARD_CLASS = "card card-border card-glass glass-interactive";
export const SURFACE_GLASS_CARD_STRONG_CLASS =
  "card card-border card-glass-strong glass-interactive";
export const SURFACE_GLASS_CARD_MODAL_CLASS = "card card-border card-glass-modal glass-interactive";

/**
 * Glass-clear surface for media controls, decorative indicators, and floating
 * chips where the most transparent material is desired (§3).
 */
export const SURFACE_GLASS_CLEAR_CLASS = "glass-clear";

/**
 * Glass-solid surface for accessibility/performance fallback contexts where a
 * fully opaque panel is required (§3, §9.2).
 */
export const SURFACE_GLASS_SOLID_CLASS = "glass-solid";

/**
 * Selected state for glass cards in grids (jobs, providers, portfolio).
 */
export const SURFACE_GLASS_CARD_SELECTED_CLASS = "glass-selected";

/**
 * Disabled state for glass cards representing unavailable capabilities.
 */
export const SURFACE_GLASS_CARD_DISABLED_CLASS = "glass-disabled";

/**
 * Error state for glass cards carrying a surfaced failure.
 */
export const SURFACE_GLASS_CARD_ERROR_CLASS = "glass-error";

/** Shared sidebar surface classes. Floating drawer = glass candidate (§5.2).
 * Width transitions consume the motion token system (§7.2/§7.3). */
export const SHELL_SIDEBAR_ASIDE_CLASS =
  "glass-subtle flex min-h-full flex-col items-start transition-[width,box-shadow,border-color] duration-[var(--motion-standard)] ease-[var(--ease-response)] is-drawer-close:w-14 is-drawer-open:w-64 border-r border-base-300";

/** Shared sidebar menu layout (no menu-sm — touch floor via TOUCH_TARGET_MIN_CLASS). */
export const SHELL_SIDEBAR_MENU_CLASS =
  "menu flex min-h-0 w-full flex-1 flex-col gap-1 p-4";

/** Skip link contract for keyboard navigation. */
export const SHELL_SKIP_LINK_CLASS =
  "sr-only btn btn-primary btn-sm focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50";

/**
 * Centered auth / onboarding shell (semantic surfaces only).
 */
export const AUTH_SHELL_OUTER_CLASS =
  "flex min-h-screen items-center justify-center bg-base-200 px-4";

/**
 * Auth card surface — solid content-plane (not glass). Consumed by
 * `layouts/auth-shell.vue` via `:class="AUTH_CARD_SHELL_CLASS"`.
 * Recognized by `validate:daisyui-contracts` as a card-bearing SSOT constant.
 */
export const AUTH_CARD_SHELL_CLASS = "card w-full max-w-md bg-base-100 shadow-lg";

/**
 * Page header shell (title + description + optional actions row).
 */
export const PAGE_HEADER_OUTER_CLASS =
  "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4";

/** Primary page title (`h1` / `h2` in PageHeaderBlock). */
export const PAGE_HEADER_TITLE_CLASS = "text-2xl font-bold";

/** Default subtitle under the page title. */
export const PAGE_HEADER_DESCRIPTION_CLASS = "mt-1 text-muted";

/** Measured page subtitle used by hero headers that need a readable line length. */
export const PAGE_HEADER_DESCRIPTION_MEASURE_CLASS = "max-w-2xl text-secondary";

/** Measured centered prose block for portfolio/preview bios and similar copy. */
export const PROSE_MEASURE_CENTER_CLASS = "mx-auto max-w-2xl text-secondary";

/**
 * Shared hero surface for page-level headers that need elevated context.
 */
export const PAGE_HERO_SECTION_CLASS =
  "hero min-w-0 overflow-x-clip rounded-box border border-base-300 glass-subtle";

/** Aside width contract inside page hero headers. */
export const PAGE_HERO_ASIDE_CLASS = "w-full min-w-0 max-w-full lg:max-w-2xl";

/**
 * Base hero content layout for page-level header surfaces.
 */
export const PAGE_HERO_CONTENT_BASE_CLASS =
  "hero-content w-full min-w-0 max-w-full flex-col items-start lg:flex-row lg:items-center lg:justify-between";

/**
 * Compact hero spacing used when the header does not carry a large aside surface.
 */
export const PAGE_HERO_CONTENT_COMPACT_CLASS = `${PAGE_HERO_CONTENT_BASE_CLASS} gap-4`;

/**
 * Comfortable hero spacing used when the header includes larger contextual content.
 */
export const PAGE_HERO_CONTENT_COMFORTABLE_CLASS = `${PAGE_HERO_CONTENT_BASE_CLASS} gap-6`;

/**
 * Centered empty-state column (playbook: hero / empty vertical rhythm).
 * Empty states are content planes (design.md §4: keep content plane mostly solid),
 * not control layers — solid surface, no backdrop blur.
 */
export const EMPTY_STATE_STACK_CLASS =
  "flex flex-col items-center justify-center gap-4 rounded-box border border-dashed border-base-300 bg-base-100 px-6 py-8 pb-12 text-center";

/** Canonical icon size tokens. Consumed by any component that sizes an icon
 * inside a control, badge, or stat surface so icon dimensions stay SSOT.
 */
export const ICON_SIZE_CLASS = {
  xs: "h-3 w-3",
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  "3": "h-3 w-3",
  "4": "h-4 w-4",
  "5": "h-5 w-5",
  "6": "h-6 w-6",
  "8": "h-8 w-8",
  "10": "h-10 w-10",
  "12": "h-12 w-12",
  "14": "h-14 w-14",
  "16": "h-16 w-16",
  "20": "h-20 w-20",
} as const;

export type IconSizeToken = keyof typeof ICON_SIZE_CLASS;

/**
 * Canonical radial meter geometry. Consumed by UiRadialMeter so the SVG
 * radius, stroke width, and default size stay SSOT rather than baking
 * numeric literals into the primitive defaults.
 */
export const RADIAL_METER_GEOMETRY = {
  radius: 42,
  strokeWidth: 8,
  viewBoxSize: 100,
  defaultSizeClass: "h-24 w-24",
  readinessSizeClass: "h-28 w-28",
} as const;

/** Brand theme swatch preview strip (min-height + clip; not fixed h-). */
export const BRAND_SWATCH_SURFACE_CLASS = "min-h-20 overflow-hidden";

/**
 * Canonical stroke width for inline decorative SVG icons (24x24 viewBox).
 */
export const ICON_DECORATIVE_STROKE_WIDTH = 2;

/**
 * SVG dimension override constants (used when a specific icon needs a non-token dimension).
 * Prefer ICON_SIZE_CLASS for standard icon sizes; these are for SVG root attributes only.
 */
export const SVG_SIZE_13 = 13;
export const SVG_SIZE_24 = 24;

/**
 * Sidebar width contract at the lg breakpoint (matches the documented
 * `lg:w-64 shrink-0` contract in constants/ui-layout.ts sidebar token).
 */
export const SIDEBAR_WIDTH_LG_CLASS = "lg:w-64";

/** Sidebar item surface inside the floating drawer (WCAG 2.5.5 / AAA 44px target). */
export const SHELL_SIDEBAR_ITEM_CLASS =
  "flex min-h-11 min-w-11 items-center gap-2 rounded-box px-2 transition-colors duration-[var(--motion-fast)] ease-[var(--ease-response)] is-drawer-close:tooltip is-drawer-close:tooltip-right";

/** Navbar dropdown (no menu-sm — keeps locale rows ≥44px). */
export const SHELL_NAVBAR_DROPDOWN_CLASS =
  "menu dropdown-content rounded-box z-50 mt-2 w-56 border border-base-300 bg-base-100 p-2 shadow-lg";

/** Dropdown menu width token (used by AppExportMenu and similar transient menus). */
export const DROPDOWN_MENU_WIDTH_CLASS = "w-40";

/** Stat card icon badge surface (accent container on glass-subtle). */
export const STAT_CARD_ICON_BADGE_CLASS = "rounded-box glass-subtle p-3";

/** Stat card body spacing (comfortable responsive padding). */
export const CARD_BODY_COMFORTABLE_CLASS = "card-body flex flex-col justify-between p-5 md:p-6";

/** Achievement badge icon container (circular accent surface). */
export const ACHIEVEMENT_ICON_BADGE_CLASS =
  "flex h-12 w-12 items-center justify-center rounded-full";

/** Quick-action FAB position + action minimum width. */
export const FAB_POSITION_CLASS = "left-6 bottom-24";

/**
 * Floating chat stack (above mobile dock). Viewport-bounded inset-x on small screens.
 */
export const SHELL_FLOATING_CHAT_STACK_CLASS =
  "fixed inset-x-4 bottom-24 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end lg:inset-x-auto lg:bottom-6 lg:right-6 lg:max-w-none";
export const FAB_ACTION_MIN_WIDTH_CLASS = "min-w-52";

/** Inline CTA chevron icon size (small directional arrow). */
export const ICON_SIZE_CHEVRON_CLASS = "h-3 w-3";

/** Stat card title row spacing (label + value column above icon badge). */
export const STAT_CARD_TITLE_BLOCK_CLASS = "mb-1 text-sm font-medium text-muted";
export const STAT_CARD_VALUE_CLASS = "text-3xl font-bold";
export const STAT_CARD_HEADER_ROW_CLASS = "mb-4 flex items-start justify-between";
export const STAT_CARD_CTA_ROW_CLASS = "mt-auto flex items-center gap-1 text-xs font-semibold";

/** Jobs page search input icon size. */
export const ICON_SIZE_XS_ALT_CLASS = "h-4 w-4";

/** Common spacing tokens used across page layouts. */
export const SECTION_GAP_BOTTOM_CLASS = "mb-6";
export const ROW_GAP_SM_CLASS = "gap-3";
export const ROW_GAP_XS_CLASS = "gap-2";
export const STACK_SPACING_SM_CLASS = "mt-2";
export const TRUNCATE_BLOCK_CLASS = "min-w-0";

/** Typography scale tokens for card titles and supporting copy. */
export const CARD_TITLE_LG_CLASS = "card-title text-lg";
export const BODY_TEXT_SM_CLASS = "text-sm text-muted";
export const BODY_TEXT_XS_CLASS = "text-xs text-muted";

/** Full-width utility token (the only w-/h- primitive that composes fluid layout). */
export const FLUID_WIDTH_CLASS = "w-full";
export const FLUID_HEIGHT_CLASS = "h-full";

/** Truncation block primitive (min-w-0 to enable flexbox text truncation). */
export const TRUNCATE_FLEX_CHILD_CLASS = "min-w-0";

/**
 * Horizontal section-rail scroll tokens (settings / workspace navigators).
 * Keep snap + touch pan on the SSOT rail so mobile tabs feel Apple-HIG native.
 */
export const SCROLL_SNAP_X_MANDATORY_CLASS = "snap-x snap-mandatory";
export const SCROLL_SNAP_ALIGN_START_CLASS = "snap-start";
export const SCROLL_TOUCH_PAN_X_CLASS = "touch-pan-x";
export const SCROLL_SMOOTH_CLASS = "scroll-smooth";
export const SCROLL_PADDING_INLINE_3_CLASS = "scroll-px-3";
/** Icon-button label: visually hide below sm (SR keeps text). */
export const LABEL_HIDE_BELOW_SM_CLASS = "max-sm:sr-only";
export const MIN_HEIGHT_ZERO_CLASS = "min-h-0";
export const MIN_HEIGHT_DESCRIPTION_CLASS = "min-h-14";
export const MIN_WIDTH_FORM_COL_CLASS = "min-w-40";
export const MIN_WIDTH_SELECT_CLASS = "min-w-52";
export const MIN_HEIGHT_SCROLL_CLASS = "min-h-40";
export const MIN_HEIGHT_EDITOR_CLASS = "min-h-64";
export const MIN_HEIGHT_CHAT_CLASS = "min-h-24";
export const MIN_HEIGHT_CONTENT_CLASS = "min-h-28";
export const HEIGHT_48_CLASS = "min-h-48";
export const HEIGHT_96_CLASS = "h-96";
export const SIDEBAR_WIDE_WIDTH_CLASS = "w-80";
export const AUTH_CARD_MAX_WIDTH_CLASS = "max-w-md";
export const ERROR_PAGE_MAX_WIDTH_CLASS = "max-w-lg";

/** Re-export extended tokens from layout-tokens (public API stays ~/constants/layout). */
export {
  CIRCULAR_BADGE_CLASS,
  SECTION_RAIL_LABEL_CLASS,
  CONTENT_H_28_CLASS,
  CONTENT_H_40_CLASS,
  CONTENT_H_48_CLASS,
  CONTENT_H_64_CLASS,
  CONTENT_H_72_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  type FlexGapToken,
  FONT_WEIGHT_TOKEN_CLASS,
  FORM_WIDTH_10_CLASS,
  FORM_WIDTH_16_CLASS,
  FORM_WIDTH_20_CLASS,
  FORM_WIDTH_28_CLASS,
  FORM_WIDTH_32_CLASS,
  type FontWeightToken,
  GLASS_CARD_ENTER_CLASS,
  GLASS_CARD_HOVER_CLASS,
  HEIGHT_TOKEN_CLASS,
  type HeightToken,
  LEADING_TOKEN_CLASS,
  type LeadingToken,
  MARGIN_TOKEN_CLASS,
  MAX_HEIGHT_72_CLASS,
  MAX_HEIGHT_96_CLASS,
  MAX_HEIGHT_TOKEN_CLASS,
  MAX_W_2XL_CLASS,
  MAX_W_3XL_CLASS,
  MAX_W_40_CLASS,
  MAX_W_64_CLASS,
  MAX_W_XS_CLASS,
  type MarginToken,
  type MaxHeightToken,
  MIN_H_36_CLASS,
  MIN_H_60_CLASS,
  MIN_H_80_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  SHELL_DOCK_ITEM_CLASS,
  PADDING_TOKEN_CLASS,
  type PaddingToken,
  POINTER_EVENTS_TOKEN_CLASS,
  type PointerEventsToken,
  PRINT_PADDING_RESET_CLASS,
  RADIUS_TOKEN_CLASS,
  type RadiusToken,
  SCROLL_MARGIN_TOKEN_CLASS,
  SCROLL_MARGIN_TOP_24_CLASS,
  type ScrollMarginToken,
  SHADOW_TOKEN_CLASS,
  type ShadowToken,
  STACK_SPACE_Y_TOKEN_CLASS,
  type StackSpaceYToken,
  SVG_STROKE_WIDTH_DEFAULT,
  TRACKING_TOKEN_CLASS,
  type TrackingToken,
  TYPOGRAPHY_SCALE_CLASS,
  type TypographyScaleToken,
  WIDTH_TOKEN_CLASS,
  type WidthToken,
} from "./layout-tokens";
