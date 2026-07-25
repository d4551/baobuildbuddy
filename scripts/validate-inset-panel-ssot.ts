const NUM_80 = 80;

/**
 * Ban raw inset panel / nested surface literals in Vue surfaces.
 * Use INSET_PANEL_CLASS / INSET_PANEL_MUTED_CLASS / INSET_LIST_CLASS / FIELDSET_PANEL_CLASS.
 *
 * Product SSOT is TS/CSS tokens (STACK-CONTRACT) — not .bao archives.
 */
import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue", ".ts"]);

const ALLOW_PATH_MARKERS = [
  "packages/client/constants/layout-shell.ts",
  "packages/client/constants/layout.ts",
  "packages/client/constants/layout-chrome.ts",
  "packages/client/constants/layout-tokens.ts",
  "packages/client/constants/ui-layout.ts",
  "packages/client/constants/chat.ts",
] as const;

/** Full inset panel chrome (solid nest inside glass). */
const BANNED_INSET_PANEL =
  /(["'`])(?:(?!\1)[^\\]|\\.)*rounded-box\s+border\s+border-base-300\s+bg-base-(?:100|200)(?:(?!\1)[^\\]|\\.)*\1/gu;

/** daisyUI list + inset chrome. */
const BANNED_INSET_LIST =
  /(["'`])(?:(?!\1)[^\\]|\\.)*list\s+rounded-box\s+border\s+border-base-300\s+bg-base-100(?:(?!\1)[^\\]|\\.)*\1/gu;

/** Fieldset panel chrome. */
const BANNED_FIELDSET_PANEL =
  /(["'`])(?:(?!\1)[^\\]|\\.)*fieldset(?:(?!\1)[^\\]|\\.)*rounded-box\s+border\s+border-base-300\s+bg-base-100(?:(?!\1)[^\\]|\\.)*\1/gu;

const HTML_COMMENT_PATTERN = /<!--[\s\S]*?-->/gu;
const BLOCK_COMMENT_PATTERN = /\/\*[\s\S]*?\*\//gu;
const LINE_COMMENT_PATTERN = /\/\/[^\n\r]*/gu;

const stripComments = (content: string): string =>
  content
    .replace(HTML_COMMENT_PATTERN, "")
    .replace(BLOCK_COMMENT_PATTERN, "")
    .replace(LINE_COMMENT_PATTERN, "");

const isAllowlisted = (filePath: string): boolean =>
  ALLOW_PATH_MARKERS.some((marker) => filePath.endsWith(marker) || filePath.includes(marker));

const MAX_MATCH_CHARS = 220;

export const collectInsetPanelSsotViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isAllowlisted(filePath)) {
    return [];
  }
  const violations: ValidationViolation[] = [];
  const stripped = stripComments(content);

  const pushMatches = (pattern: RegExp, message: string): void => {
    pattern.lastIndex = 0;
    for (const match of stripped.matchAll(pattern)) {
      const quoted = match[0] ?? "";
      if (quoted.length > MAX_MATCH_CHARS) {
        continue;
      }
      if (
        quoted.includes("INSET_PANEL") ||
        quoted.includes("INSET_LIST") ||
        quoted.includes("FIELDSET_PANEL")
      ) {
        continue;
      }
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `${message} (${quoted.slice(0, NUM_80)}…)`,
      });
    }
  };

  pushMatches(
    BANNED_INSET_PANEL,
    "raw inset panel literal; use INSET_PANEL_CLASS or INSET_PANEL_MUTED_CLASS",
  );
  pushMatches(BANNED_INSET_LIST, "raw inset list literal; use INSET_LIST_CLASS");
  pushMatches(BANNED_FIELDSET_PANEL, "raw fieldset panel literal; use FIELDSET_PANEL_CLASS");

  return violations;
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const entries = await collectProjectFileEntries({
    scanRoots: [...scanRoots],
    allowedExtensions: [...sourceExtensions],
  });
  return entries.flatMap((entry) =>
    collectInsetPanelSsotViolationsForContent(entry.filePath, entry.content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Inset panel SSOT validation failed:",
    await collectViolations(),
    "Inset panel SSOT validation passed.",
  );
}
