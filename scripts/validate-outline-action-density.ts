/**
 * Outline / soft CTA SSOT:
 * Ban literal `btn-outline` / `btn-soft` inside quoted strings in Vue SFCs.
 * Use OUTLINE_ACTION_CLASS / SOFT_ACTION_CLASS (or *_BUTTON_VARIANT_CLASS).
 */
import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue"]);

const QUOTED_STRING_PATTERN = /(["'`])(?:(?!\1)[^\\]|\\.)*\1/gu;
const OUTLINE_PATTERN = /\bbtn-outline\b/u;
const SOFT_PATTERN = /\bbtn-soft\b/u;
const HTML_COMMENT_PATTERN = /<!--[\s\S]*?-->/gu;
const BLOCK_COMMENT_PATTERN = /\/\*[\s\S]*?\*\//gu;
const LINE_COMMENT_PATTERN = /\/\/[^\n\r]*/gu;

const stripComments = (content: string): string =>
  content
    .replace(HTML_COMMENT_PATTERN, "")
    .replace(BLOCK_COMMENT_PATTERN, "")
    .replace(LINE_COMMENT_PATTERN, "");

export const collectOutlineActionDensityViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  const commentStripped = stripComments(content);

  for (const match of commentStripped.matchAll(QUOTED_STRING_PATTERN)) {
    const quoted = match[0] ?? "";
    if (OUTLINE_PATTERN.test(quoted)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `literal btn-outline in quoted string (${quoted}); use OUTLINE_ACTION_CLASS or OUTLINE_BUTTON_VARIANT_CLASS`,
      });
    }
    if (SOFT_PATTERN.test(quoted)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `literal btn-soft in quoted string (${quoted}); use SOFT_ACTION_CLASS or SOFT_BUTTON_VARIANT_CLASS`,
      });
    }
  }

  return violations;
};

const main = async (): Promise<void> => {
  const entries = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions: sourceExtensions,
  });
  const violations = entries.flatMap((entry) =>
    collectOutlineActionDensityViolations(entry.filePath, entry.content),
  );
  await reportViolations(
    "Outline/soft action density validation failed:",
    violations,
    "Outline/soft action density validation passed.",
  );
};

if (import.meta.main) {
  await main();
}
