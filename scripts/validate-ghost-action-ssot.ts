/**
 * Ban raw daisyUI `btn-ghost` / `btn-link` literals in Vue surfaces.
 * Tertiary CTAs must use GHOST_ACTION_* / LINK_ACTION_* tokens.
 */
import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue"]);

const ALLOW_PATH_MARKERS = [
  "packages/client/constants/layout-tokens.ts",
  "packages/client/constants/layout.ts",
  "packages/client/constants/layout-shell.ts",
] as const;

const QUOTED_GHOST_OR_LINK_PATTERN =
  /(["'`])(?:(?!\1)[^\\]|\\.)*(?:btn-ghost|btn-link)(?:(?!\1)[^\\]|\\.)*\1/gu;
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

export const collectGhostActionSsotViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isAllowlisted(filePath)) {
    return [];
  }
  const violations: ValidationViolation[] = [];
  const stripped = stripComments(content);
  for (const match of stripped.matchAll(QUOTED_GHOST_OR_LINK_PATTERN)) {
    const quoted = match[0] ?? "";
    if (quoted.includes("GHOST_ACTION") || quoted.includes("LINK_ACTION")) {
      continue;
    }
    // Drawer sidebar uses is-drawer-close:btn-square composition — still flag bare ghost
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `raw btn-ghost/btn-link literal (${quoted}); use GHOST_ACTION_* or LINK_ACTION_* tokens`,
    });
  }
  return violations;
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const entries = await collectProjectFileEntries({
    scanRoots: [...scanRoots],
    allowedExtensions: [...sourceExtensions],
  });
  return entries.flatMap((entry) =>
    collectGhostActionSsotViolationsForContent(entry.filePath, entry.content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Ghost action SSOT validation failed:",
    await collectViolations(),
    "Ghost action SSOT validation passed.",
  );
}
