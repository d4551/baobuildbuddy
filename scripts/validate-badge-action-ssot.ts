/**
 * Ban raw daisyUI badge / soft-button literals in Vue surfaces.
 * Use BADGE_* / SOFT_ACTION / SECONDARY_ACTION / ACCENT_ACTION tokens.
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
  "packages/client/constants/layout-tokens.ts",
  "packages/client/constants/layout-tokens-actions.ts",
  "packages/client/constants/layout.ts",
  "packages/client/constants/layout-chrome.ts",
  "packages/client/constants/layout-shell.ts",
  "packages/client/constants/layout-badges.ts",
  "packages/client/constants/layout-action-soft.ts",
] as const;

/** Surface class attributes / arrays — not every TS status map fragment. */
const BANNED_QUOTED_PATTERN =
  /(["'`])(?:(?!\1)[^\\]|\\.)*(?:badge badge-|btn btn-soft|btn btn-secondary|btn btn-accent)(?:(?!\1)[^\\]|\\.)*\1/gu;
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

export const collectBadgeActionSsotViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isAllowlisted(filePath)) {
    return [];
  }
  const violations: ValidationViolation[] = [];
  const stripped = stripComments(content);
  for (const match of stripped.matchAll(BANNED_QUOTED_PATTERN)) {
    const quoted = match[0] ?? "";
    if (
      quoted.includes("BADGE_") ||
      quoted.includes("SOFT_ACTION") ||
      quoted.includes("SECONDARY_ACTION") ||
      quoted.includes("ACCENT_ACTION")
    ) {
      continue;
    }
    // Dynamic status class helpers assign semantic tokens — still flag raw badge strings.
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `raw badge/soft/secondary/accent literal (${quoted}); use BADGE_* / SOFT_ACTION / SECONDARY_ACTION / ACCENT_ACTION tokens`,
    });
  }
  return violations;
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const entries = await collectProjectFileEntries({
    scanRoots: [...scanRoots],
    allowedExtensions: new Set(sourceExtensions),
  });
  return entries.flatMap((entry) =>
    collectBadgeActionSsotViolationsForContent(entry.filePath, entry.content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Badge/soft action SSOT validation failed:",
    await collectViolations(),
    "Badge/soft action SSOT validation passed.",
  );
}
