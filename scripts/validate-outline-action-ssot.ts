/**
 * Ban raw daisyUI `btn-outline` literals in Vue surfaces.
 * Secondary CTAs must use OUTLINE_ACTION_* tokens from layout SSOT.
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

const QUOTED_OUTLINE_PATTERN = /(["'`])(?:(?!\1)[^\\]|\\.)*btn-outline(?:(?!\1)[^\\]|\\.)*\1/gu;
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

export const collectOutlineActionSsotViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isAllowlisted(filePath)) {
    return [];
  }
  const violations: ValidationViolation[] = [];
  const stripped = stripComments(content);
  for (const match of stripped.matchAll(QUOTED_OUTLINE_PATTERN)) {
    const quoted = match[0] ?? "";
    if (quoted.includes("OUTLINE_ACTION")) {
      continue;
    }
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `raw btn-outline literal (${quoted}); use OUTLINE_ACTION_CLASS / DENSE / JOIN / ERROR / PRINT_HIDDEN`,
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
    collectOutlineActionSsotViolationsForContent(entry.filePath, entry.content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Outline action SSOT validation failed:",
    await collectViolations(),
    "Outline action SSOT validation passed.",
  );
}
