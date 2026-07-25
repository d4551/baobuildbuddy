/**
 * Inset / nested surface tokens (part of layout SSOT).
 * Public API remains ~/constants/layout (via layout-public-extras).
 *
 * Product SSOT is TS/CSS tokens (STACK-CONTRACT) — not .bao archives.
 */

/** Full inset panel chrome (solid nest inside glass). */
export const INSET_PANEL_CLASS = "rounded-box border border-base-300 bg-base-100";

/** Muted inset panel (bg-base-200 nest). */
export const INSET_PANEL_MUTED_CLASS = "rounded-box border border-base-300 bg-base-200";

/** daisyUI list + inset chrome. */
export const INSET_LIST_CLASS = "list rounded-box border border-base-300 bg-base-100";

/** Fieldset panel chrome. */
export const FIELDSET_PANEL_CLASS = "fieldset rounded-box border border-base-300 bg-base-100 p-4";

/** Standard card body padding. */
export const CARD_BODY_CLASS = "card-body";

/** Compact card body padding. */
export const CARD_BODY_COMPACT_CLASS = "card-body p-4";
