export type SaveState = "idle" | "saving" | "success" | "error";

export function getSaveStateLabelKey(value: SaveState): string | null {
  if (value === "saving") return "settings.saveState.saving";
  if (value === "success") return "settings.saveState.success";
  if (value === "error") return "settings.saveState.error";
  return null;
}

export function getSaveStateBadgeClass(value: SaveState): string {
  if (value === "success") return "badge-success";
  if (value === "error") return "badge-error";
  return "badge-ghost";
}
