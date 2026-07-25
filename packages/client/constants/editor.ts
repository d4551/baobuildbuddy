import { INSET_PANEL_CLASS } from "~/constants/layout";
/**
 * Editor UX SSOT — heights, debounce, modes (CM6 AppCodeEditor + TipTap blocks).
 */

export const EDITOR_MODES = ["json", "css", "markdown", "plain", "blocks"] as const;
export type EditorMode = (typeof EDITOR_MODES)[number];

/** Debounce for autosave drafts (ms). */
export const EDITOR_AUTOSAVE_DEBOUNCE_MS = 1_200;

/** Default min-height for JSON power editors. */
export const EDITOR_MIN_HEIGHT_CLASS = "min-h-64";

/** Taller writing surface for cover letters. */
export const EDITOR_WRITING_MIN_HEIGHT_CLASS = "min-h-80";

/** CM6 host shell — border/radius from daisyUI, no local CSS files. */
export const EDITOR_HOST_CLASS = `${INSET_PANEL_CLASS} w-full overflow-hidden text-base-content`;

/** Prose editors must not use monospace (document metaphor). */
export const EDITOR_PROSE_MODES: readonly EditorMode[] = ["markdown", "plain", "blocks"];

/** Power modes get Vim + minimap by default. */
export const EDITOR_POWER_MODES: readonly EditorMode[] = ["json", "css", "markdown"];
