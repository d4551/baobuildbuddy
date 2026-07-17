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
  "mx-auto w-full max-w-7xl space-y-6 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-8";

/** Root app drawer contract. */
export const SHELL_DRAWER_CLASS = "min-h-screen lg:drawer-open";

/** Drawer content container containing navbar, main, and toast host. */
export const SHELL_DRAWER_CONTENT_CLASS = "flex min-h-screen flex-col";

/** Drawer side container. */
export const SHELL_DRAWER_SIDE_CLASS = "z-20 is-drawer-close:overflow-visible";

/** Shared navbar classes for authenticated shell pages. */
export const SHELL_NAVBAR_CLASS = "sticky top-0 z-10 border-b border-base-300 bg-base-200";

/**
 * Glass surface for elevated cards/panels (fluid depth without palette literals).
 */
export const SURFACE_GLASS_CARD_CLASS =
  "card card-border card-glass shadow-sm transition-[box-shadow,transform,background-color] duration-200";

/**
 * Interactive glass card hover affordance (motion-safe).
 */
export const SURFACE_GLASS_CARD_INTERACTIVE_CLASS =
  "motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md";

/** Shared sidebar surface classes. */

export const SHELL_SIDEBAR_ASIDE_CLASS =
  "flex min-h-full flex-col items-start bg-base-200 transition-all duration-200 is-drawer-close:w-14 is-drawer-open:w-64";

/** Shared sidebar menu layout classes. */
export const SHELL_SIDEBAR_MENU_CLASS =
  "menu menu-sm flex min-h-0 w-full flex-1 flex-col gap-1 p-4";

/** Skip link contract for keyboard navigation. */
export const SHELL_SKIP_LINK_CLASS =
  "sr-only btn btn-primary btn-sm focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50";

/**
 * Centered auth / onboarding shell (semantic surfaces only).
 */
export const AUTH_SHELL_OUTER_CLASS =
  "flex min-h-screen items-center justify-center bg-base-200 px-4";

/**
 * Auth card surface — **must match** the static `class` on `layouts/auth-shell.vue`
 * (`validate:daisyui-contracts` only scans static attributes).
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
export const PAGE_HEADER_DESCRIPTION_CLASS = "mt-1 text-base-content/60";

/** Measured page subtitle used by hero headers that need a readable line length. */
export const PAGE_HEADER_DESCRIPTION_MEASURE_CLASS = "max-w-2xl text-base-content/70";

/** Measured centered prose block for portfolio/preview bios and similar copy. */
export const PROSE_MEASURE_CENTER_CLASS = "mx-auto max-w-2xl text-base-content/70";

/**
 * Shared hero surface for page-level headers that need elevated context.
 */
export const PAGE_HERO_SECTION_CLASS = "hero rounded-box border border-base-300 bg-base-200";

/** Aside width contract inside page hero headers. */
export const PAGE_HERO_ASIDE_CLASS = "w-full lg:max-w-2xl";

/**
 * Base hero content layout for page-level header surfaces.
 */
export const PAGE_HERO_CONTENT_BASE_CLASS =
  "hero-content w-full flex-col items-start lg:flex-row lg:items-center lg:justify-between";

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
 */
export const EMPTY_STATE_STACK_CLASS =
  "flex flex-col items-center justify-center gap-4 rounded-box border border-dashed border-base-300/70 bg-base-100/50 px-6 py-10 text-center backdrop-blur-sm";
