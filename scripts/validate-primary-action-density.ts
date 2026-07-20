/**
 * Ban density shrink on primary CTAs (`btn-primary` + `btn-sm`/`btn-xs`).
 * Use PRIMARY_ACTION_CLASS (or btn-primary + TOUCH_TARGET_MIN_CLASS) instead.
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
const PRIMARY_SHRINK_PATTERN = /\bbtn-primary\b/u;
const DENSITY_SHRINK_PATTERN = /\bbtn-(?:sm|xs)\b/u;

export const collectPrimaryActionDensityViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  for (const match of content.matchAll(CLASS_ATTR_PATTERN)) {
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
