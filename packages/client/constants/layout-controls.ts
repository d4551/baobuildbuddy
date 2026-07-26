/**
 * Form-control tokens for daisyUI toggles and checkboxes.
 *
 * Split out of `layout-tokens.ts` to keep that module under the monolith ceiling.
 */

/**
 * daisyUI toggle at its native size.
 *
 * The control deliberately carries no sizing utilities. Two earlier attempts to hit the
 * Apple HIG / WCAG 2.5.5 44px floor on the input itself both regressed the theme, and
 * both were caught in the browser: stretching width/height turned the toggle into a grey
 * slab, and the `-lg` size modifiers are not in the compiled CSS, which rendered
 * checkboxes as oversized circles. The floor belongs on the row — see
 * {@link CONTROL_TARGET_ROW_CLASS} — because a `<label>` forwards clicks to the control
 * it wraps, so the row is the real target.
 */
export const TOGGLE_CONTROL_CLASS = "toggle toggle-primary";

/** Square sibling of {@link TOGGLE_CONTROL_CLASS}. */
export const CHECKBOX_CONTROL_CLASS = "checkbox checkbox-primary";

/**
 * Row that carries the 44px touch target for a toggle or checkbox.
 *
 * WCAG 2.5.5 and Apple HIG size the *target*, not the glyph, and a `<label>` forwards
 * its clicks to the control it wraps — so the row is the legitimate target. Bind this
 * on the `<label>` that encloses the control together with its text.
 */
export const CONTROL_TARGET_ROW_CLASS = "flex min-h-11 cursor-pointer items-center gap-3";
