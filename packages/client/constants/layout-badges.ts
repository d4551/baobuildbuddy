/**
 * Badge class tokens (daisyUI 5 soft/ghost/semantic + density).
 * Surfaces must import via ~/constants/layout — not raw badge-* strings.
 */

/** Soft semantic badges (chat context chips / low-fill status). */
export const BADGE_SOFT_INFO_CLASS = "badge badge-soft badge-info";
export const BADGE_SOFT_PRIMARY_CLASS = "badge badge-soft badge-primary";
export const BADGE_SOFT_INFO_XS_CLASS = "badge badge-soft badge-info badge-xs";
export const BADGE_SOFT_PRIMARY_XS_CLASS = "badge badge-soft badge-primary badge-xs";
export const BADGE_SOFT_SM_CLASS = "badge badge-soft badge-sm";
export const BADGE_SOFT_WARNING_CLASS = "badge badge-warning badge-soft";
export const BADGE_SOFT_WARNING_SM_CLASS = "badge badge-warning badge-soft badge-sm";
export const BADGE_SOFT_NEUTRAL_CLASS = "badge badge-neutral badge-soft";
export const BADGE_SOFT_SUCCESS_CLASS = "badge badge-success badge-soft";

/** Ghost badges (low emphasis chips / meta). */
export const BADGE_GHOST_CLASS = "badge badge-ghost";
export const BADGE_GHOST_SM_CLASS = "badge badge-ghost badge-sm";
export const BADGE_GHOST_XS_CLASS = "badge badge-ghost badge-xs";

/** Semantic status badges. */
export const BADGE_SUCCESS_SM_CLASS = "badge badge-success badge-sm";
export const BADGE_SUCCESS_CLASS = "badge badge-success";
export const BADGE_ERROR_SM_CLASS = "badge badge-error badge-sm";
export const BADGE_ERROR_CLASS = "badge badge-error";
export const BADGE_SOFT_ERROR_CLASS = "badge badge-error badge-soft";
export const BADGE_WARNING_SM_CLASS = "badge badge-warning badge-sm";
export const BADGE_WARNING_CLASS = "badge badge-warning";
export const BADGE_WARNING_XS_CLASS = "badge badge-warning badge-xs";
export const BADGE_INFO_SM_CLASS = "badge badge-info badge-sm";
export const BADGE_INFO_CLASS = "badge badge-info";
export const BADGE_INFO_OUTLINE_CLASS = "badge badge-info badge-outline";
export const BADGE_PRIMARY_SM_CLASS = "badge badge-primary badge-sm";
export const BADGE_PRIMARY_CLASS = "badge badge-primary";
export const BADGE_PRIMARY_OUTLINE_CLASS = "badge badge-primary badge-outline";
export const BADGE_PRIMARY_LG_CLASS = "badge badge-lg badge-primary";
export const BADGE_PRIMARY_XS_CLASS = "badge badge-primary badge-xs";
export const BADGE_OUTLINE_SM_CLASS = "badge badge-sm badge-outline";
export const BADGE_OUTLINE_CLASS = "badge badge-outline";
export const BADGE_OUTLINE_XS_CLASS = "badge badge-outline badge-xs";
export const BADGE_SM_CLASS = "badge badge-sm";
export const BADGE_LG_CLASS = "badge badge-lg";
export const BADGE_XS_CLASS = "badge badge-xs";
export const BADGE_NEUTRAL_SM_CLASS = "badge badge-neutral badge-sm";
export const BADGE_NEUTRAL_CLASS = "badge badge-neutral";
export const BADGE_SECONDARY_CLASS = "badge badge-secondary";
export const BADGE_ACCENT_CLASS = "badge badge-accent";
export const BADGE_ACCENT_SM_CLASS = "badge badge-accent badge-sm";
export const BADGE_OUTLINE_MUTED_CLASS = "badge badge-outline border-current/20 text-current/80";
export const BADGE_ACCENT_LG_CLASS = "badge badge-accent badge-lg border-0";
export const BADGE_SECONDARY_OUTLINE_CLASS = "badge badge-secondary badge-outline";

/**
 * daisyUI badge color variants (daisyUI 5). The base `badge` class stays
 * static on the element; these tokens supply the semantic color only.
 * No per-page `'badge-success'` / `'badge-error'` literals in :class.
 */
export const BADGE_VARIANT_CLASS = {
  primary: "badge-primary",
  success: "badge-success",
  warning: "badge-warning",
  error: "badge-error",
  ghost: "badge-ghost",
} as const;

export type BadgeVariant = keyof typeof BADGE_VARIANT_CLASS;
