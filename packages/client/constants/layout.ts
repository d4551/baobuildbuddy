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

/**
 * Centered auth / onboarding shell (semantic surfaces only).
 */
export const AUTH_SHELL_OUTER_CLASS = "flex min-h-screen items-center justify-center bg-base-200 px-4";

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

/**
 * Centered empty-state column (playbook: hero / empty vertical rhythm).
 */
export const EMPTY_STATE_STACK_CLASS =
  "flex flex-col items-center justify-center py-12 text-center gap-4";

