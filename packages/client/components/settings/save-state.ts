import {
  BADGE_ERROR_SM_CLASS,
  BADGE_GHOST_SM_CLASS,
  BADGE_SUCCESS_SM_CLASS,
} from "~/constants/layout-badges";

export type SaveState = "idle" | "saving" | "success" | "error";

export function getSaveStateLabelKey(value: SaveState): string | null {
  if (value === "saving") return "settings.saveState.saving";
  if (value === "success") return "settings.saveState.success";
  if (value === "error") return "settings.saveState.error";
  return null;
}

export function getSaveStateBadgeClass(value: SaveState): string {
  if (value === "success") return BADGE_SUCCESS_SM_CLASS;
  if (value === "error") return BADGE_ERROR_SM_CLASS;
  return BADGE_GHOST_SM_CLASS;
}
