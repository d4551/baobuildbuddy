/**
 * Primary CTA SSOT enforcement:
 * 1. Ban literal `btn-primary` inside quoted strings in Vue SFCs (use PRIMARY_ACTION_CLASS / PRIMARY_BUTTON_VARIANT_CLASS).
 * 2. Ban density shrink on primary CTAs (`btn-primary` + `btn-sm`/`btn-xs`).
 */
import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue"]);

const CLASS_ATTR_PATTERN = /\b:?class\s*=\s*["']([^"']+)["']/gu;
const QUOTED_STRING_PATTERN = /(["'`])(?:(?!\1)[^\\]|\\.)*\1/gu;
const PRIMARY_SHRINK_PATTERN = /\bbtn-primary\b/u;
const DENSITY_SHRINK_PATTERN = /\bbtn-(?:sm|xs)\b/u;
const HTML_COMMENT_PATTERN = /<!--[\s\S]*?-->/gu;
const BLOCK_COMMENT_PATTERN = /\/\*[\s\S]*?\*\//gu;
const LINE_COMMENT_PATTERN = /\/\/[^\n\r]*/gu;

const stripComments = (content: string): string =>
  content
    .replace(HTML_COMMENT_PATTERN, "")
    .replace(BLOCK_COMMENT_PATTERN, "")
    .replace(LINE_COMMENT_PATTERN, "");

export const collectPrimaryActionDensityViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  const commentStripped = stripComments(content);

  for (const match of commentStripped.matchAll(QUOTED_STRING_PATTERN)) {
    const quoted = match[0] ?? "";
    if (PRIMARY_SHRINK_PATTERN.test(quoted)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `literal btn-primary in quoted string (${quoted}); use PRIMARY_ACTION_CLASS or PRIMARY_BUTTON_VARIANT_CLASS`,
      });
    }
  }

  for (const match of commentStripped.matchAll(CLASS_ATTR_PATTERN)) {
    const classValue = match[1] ?? "";
    if (PRIMARY_SHRINK_PATTERN.test(classValue) && DENSITY_SHRINK_PATTERN.test(classValue)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `primary CTA shrunk with btn-sm/btn-xs ("${classValue}"); use PRIMARY_ACTION_CLASS`,
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
    collectPrimaryActionDensityViolations(entry.filePath, entry.content),
  );
  await reportViolations(
    "Primary action density validation failed:",
    violations,
    "Primary action density validation passed.",
  );
};

if (import.meta.main) {
  await main();
}
