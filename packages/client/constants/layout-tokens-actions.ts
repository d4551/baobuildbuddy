/**
 * Canonical daisyUI action button tokens.
 *
 * Automatically re-exported by `~/constants/layout` — consume from that file
 * (do not import this module directly).
 */

/** daisyUI primary color variant (segmented controls, selected ghost/outline buttons). */
export const PRIMARY_BUTTON_VARIANT_CLASS = "btn-primary";

/**
 * Primary actionable CTA — daisyUI primary + touch floor.
 * Ban pairing `btn-primary` with `btn-sm`/`btn-xs` (validate:primary-action-density).
 */
export const PRIMARY_ACTION_CLASS = `btn ${PRIMARY_BUTTON_VARIANT_CLASS} h-11 min-h-11`;

/**
 * Secondary / outline CTA — same touch floor as primary without competing for hero primary.
 * Use for quick-action grids and demoted hub cards when a page already owns PRIMARY_ACTION_CLASS.
 */
export const OUTLINE_ACTION_CLASS = "btn btn-outline h-11 min-h-11";

/**
 * Dense outline CTA for table rows / compact toolbars — still meets min touch height.
 * Prefer OUTLINE_ACTION_CLASS for page-level secondary actions.
 */
export const OUTLINE_ACTION_DENSE_CLASS = "btn btn-outline btn-sm min-h-11";

/** Outline control inside daisyUI join groups (filters, provider radios). */
export const OUTLINE_ACTION_JOIN_CLASS = "btn btn-outline join-item";

/** Destructive outline (cancel session, dangerous secondary). */
export const OUTLINE_ACTION_ERROR_CLASS = "btn btn-outline btn-error h-11 min-h-11";

/** Dense destructive outline for row/table actions. */
export const OUTLINE_ACTION_ERROR_DENSE_CLASS = "btn btn-outline btn-error btn-sm min-h-11";

/** Outline CTA that hides when printing (preview toolbars). */
export const OUTLINE_ACTION_PRINT_HIDDEN_CLASS = "btn btn-outline h-11 min-h-11 print:hidden";

/** Secondary-colored outline (brand preview swatches / demoted secondary CTAs). */
export const OUTLINE_ACTION_SECONDARY_CLASS = "btn btn-secondary btn-outline h-11 min-h-11";

/**
 * Ghost CTA — transparent chrome (cancel / dismiss / tertiary).
 * Always pair with touch floor; ban bare `btn btn-ghost` in surfaces.
 */
export const GHOST_ACTION_CLASS = "btn btn-ghost h-11 min-h-11";

/** Dense ghost for toolbars and list-row actions. */
export const GHOST_ACTION_DENSE_CLASS = "btn btn-ghost btn-sm min-h-11";

/** Circular dense ghost (icon-only remove/close in chips). */
export const GHOST_ACTION_CIRCLE_DENSE_CLASS = "btn btn-ghost btn-sm btn-circle min-h-11 min-w-11";

/** Square icon ghost (chat chrome, floating panel). */
export const GHOST_ACTION_SQUARE_CLASS = "btn btn-ghost btn-square min-h-11 min-w-11";

/** Ghost CTA hidden when printing. */
export const GHOST_ACTION_PRINT_HIDDEN_CLASS = "btn btn-ghost h-11 min-h-11 print:hidden";

/** Destructive dense ghost (remove mapping / dismiss with danger). */
export const GHOST_ACTION_ERROR_DENSE_CLASS = "btn btn-ghost btn-sm btn-error min-h-11";

/** Link-styled tertiary control (text button). */
export const LINK_ACTION_CLASS = "btn btn-link h-11 min-h-11";

/** Dense link action. */
export const LINK_ACTION_DENSE_CLASS = "btn btn-link btn-sm min-h-11";

/**
 * daisyUI button color variants (daisyUI 5). The base `btn` class stays
 * static on the element; these tokens supply the semantic color only.
 * No per-page `'btn-success'` / `'btn-error'` / `'btn-warning'` literals.
 */
export const BTN_VARIANT_CLASS = {
  success: "btn-success",
  warning: "btn-warning",
  error: "btn-error",
} as const;

export type BtnVariant = keyof typeof BTN_VARIANT_CLASS;

/** Success solid CTA — confirm/claim actions (challenge complete, save). */
export const SUCCESS_ACTION_CLASS = `btn ${BTN_VARIANT_CLASS.success} h-11 min-h-11`;

/** Error solid CTA — destructive confirm (delete, revoke, cancel run). */
export const ERROR_ACTION_CLASS = `btn ${BTN_VARIANT_CLASS.error} h-11 min-h-11`;
