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
 * Subtle glass material for sticky bars, nested lists, and soft panels (§3).
 * Consumers must bind this token — raw `glass-subtle` class literals are banned.
 */
export const SURFACE_GLASS_SUBTLE_CLASS = "glass-subtle";

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
 * Accent gradient feature panel (skills readiness, and any future hero metric
 * panel that must read as branded rather than as a neutral content card).
 *
 * This is deliberately not a `.glass-*` material: the gradient *is* the surface.
 * It lives here rather than as inline utilities on the consuming component so the
 * gradient direction and stops stay in one place, and so the card-surface gate can
 * tell a branded panel apart from a hand-rolled copy of `UiGlassCard`.
 */
export const SURFACE_ACCENT_GRADIENT_PANEL_CLASS =
  "card rounded-box border border-base-300 bg-linear-to-br from-primary to-secondary text-on-primary";

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

/**
 * Shared sidebar menu layout (no menu-sm — touch floor via TOUCH_TARGET_MIN_CLASS).
 *
 * Padding must collapse with the rail: the closed rail is `w-14` (56px), so the
 * open-state `p-4` (32px horizontal) leaves only 24px for a 44px minimum touch
 * target and every row overflows the rail. `p-1` keeps 48px of usable width and
 * also removes the stacked vertical padding that made the icon column ragged.
 */
export const SHELL_SIDEBAR_MENU_CLASS =
  "menu flex min-h-0 w-full flex-1 flex-col gap-1 p-4 is-drawer-close:p-1";

/** Skip link contract for keyboard navigation. */
export const SHELL_SKIP_LINK_CLASS =
  "sr-only btn btn-primary btn-sm focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50";

/**
 * Centered auth / onboarding shell (semantic surfaces only).
 *
 * Block padding is not cosmetic: `items-center` on a `min-h-screen` flex column
 * pins an over-tall card against both viewport edges once the card outgrows the
 * viewport (measured at 1280x600: card top 0, card bottom === scrollHeight).
 * The block padding keeps the same gutter on every edge at every height, so the
 * onboarding card never bleeds into the viewport boundary on short/landscape
 * viewports (WCAG 2.1 §1.4.10 reflow).
 */
export const AUTH_SHELL_OUTER_CLASS =
  "flex min-h-screen items-center justify-center bg-base-200 px-4 py-6 sm:py-10";

/**
 * Auth card sizing, passed to `UiGlassCard` as `extra-class` from
 * `layouts/auth-shell.vue`.
 *
 * The surface itself now comes from the primitive's `solid` variant — an opaque
 * content plane (design.md §4), not glass. Only the width contract lives here;
 * the card token, background, and elevation are the primitive's job.
 */
export const AUTH_CARD_SHELL_CLASS = "w-full max-w-md";

/**
 * Page header shell (title + description + optional actions row).
 */
export const PAGE_HEADER_OUTER_CLASS =
  "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4";

/** Primary page title (`h1` / `h2` in PageHeaderBlock) — compact @320, full from sm. */
export const PAGE_HEADER_TITLE_CLASS = "text-xl font-bold sm:text-2xl";

/** Default subtitle under the page title. */
export const PAGE_HEADER_DESCRIPTION_CLASS = "mt-1 text-sm text-muted sm:text-base";

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
export const PAGE_HERO_CONTENT_COMPACT_CLASS = `${PAGE_HERO_CONTENT_BASE_CLASS} gap-2 sm:gap-4`;

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
  "flex flex-col items-center justify-center gap-2 rounded-box border border-dashed border-base-300 bg-base-100 px-4 py-4 text-center sm:gap-3 sm:py-6";

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
  "sidebar-active-indicator box-border flex h-11 min-h-11 min-w-11 items-center gap-2 rounded-box px-2 py-0 transition-colors duration-[var(--motion-fast)] ease-[var(--ease-response)] is-drawer-close:tooltip is-drawer-close:tooltip-right is-drawer-close:justify-center is-drawer-close:px-0";

/**
 * Active-state classes for a sidebar item. `menu-active` stays for daisyUI's
 * semantic state contract; `theme-shell.css` repaints it as the designed primary pill
 * instead of daisyUI's opaque neutral slab.
 */
export const SHELL_SIDEBAR_ITEM_ACTIVE_CLASS = "menu-active font-medium";

/** Navbar dropdown (no menu-sm — keeps locale rows ≥44px). */
export const SHELL_NAVBAR_DROPDOWN_CLASS =
  "menu dropdown-content rounded-box z-50 mt-2 w-56 border border-base-300 bg-base-100 p-2 shadow-lg";

/** Dropdown menu width token (used by AppExportMenu and similar transient menus). */
export const DROPDOWN_MENU_WIDTH_CLASS = "w-40";

/** Stat card icon badge surface (accent container on glass-subtle). */
export const STAT_CARD_ICON_BADGE_CLASS = "rounded-box glass-subtle p-3";

/** Stat card body spacing (comfortable responsive padding). */
export const CARD_BODY_COMFORTABLE_CLASS = "card-body flex flex-col justify-between p-5 md:p-6";

/**
 * Card body that sits above a `UiGlassCard` link overlay.
 *
 * The overlay is absolutely positioned at `z-0`, so the body needs its own
 * stacking context to stay clickable. Bound as a token rather than written as a
 * literal so a component that renders only a card body — `JobSummaryCard`, whose
 * card surface lives on the parent — still satisfies the daisyUI contract gate,
 * which reads literal `card-body` usage per file.
 */
export const CARD_BODY_OVERLAY_CLASS = "card-body relative z-10";

/** Achievement badge icon container (circular accent surface). */
export const ACHIEVEMENT_ICON_BADGE_CLASS =
  "flex h-12 w-12 items-center justify-center rounded-full";

/** Quick-action FAB position + action minimum width. */
export const FAB_POSITION_CLASS = "left-6 bottom-24";

/**
 * Floating chat stack (above mobile dock). Viewport-bounded inset-x on small screens.
 *
 * `inset-x-4` on a `fixed` element already determines the width (the left and
 * right insets box the element), so no extra max-width calc is needed — a
 * viewport-minus-gutter calc only duplicated the insets with a hardcoded unit.
 */
export const SHELL_FLOATING_CHAT_STACK_CLASS =
  "fixed inset-x-4 bottom-24 z-40 flex flex-col items-end lg:inset-x-auto lg:bottom-6 lg:right-6 lg:max-w-none";
export const FAB_ACTION_MIN_WIDTH_CLASS = "min-w-52";

/** Inline CTA chevron icon size (small directional arrow). */
export const ICON_SIZE_CHEVRON_CLASS = "h-3 w-3";

/** Stat card title row spacing (label + value column above icon badge). */
export const STAT_CARD_TITLE_BLOCK_CLASS = "mb-1 text-sm font-medium text-muted";
export const STAT_CARD_VALUE_CLASS = "text-3xl font-bold";
export const STAT_CARD_HEADER_ROW_CLASS = "mb-4 flex items-start justify-between";
/**
 * Stat card CTA row (label + chevron).
 *
 * The semantic colour is baked in on purpose. Every stat-card CTA is the same
 * affordance — "open this workspace" — so it must read as one control across
 * the row. Callers previously passed each card's decorative `accentClass` here,
 * which rendered three peer CTAs as `text-primary`, `text-secondary`, and
 * `text-accent`: semantic roles used as decoration, so colour signalled nothing.
 * Card-level differentiation belongs on the icon badge, not the CTA.
 */
export const STAT_CARD_CTA_ROW_CLASS =
  "mt-auto flex items-center gap-1 text-xs font-semibold text-primary";

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
