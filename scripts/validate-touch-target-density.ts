const NUM_120 = 120;

/**
 * Ban bare `btn-xs` outside icon primitives — Apple HIG touch floor.
 * Pair interactive controls with TOUCH_TARGET_MIN_CLASS (or upgrade to btn-sm + touch).
 */
import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const scanRoots = ["packages/client/pages", "packages/client/components"] as const;
const sourceExtensions = new Set([".vue"]);

const CLASS_ATTR_PATTERN = /\b:?class\s*=\s*["']([^"']*)["']/gu;
const BTN_SHRINK_PATTERN = /\bbtn-(?:xs|sm)\b/u;
const TOUCH_FLOOR_PATTERN = /\bTOUCH_TARGET_MIN_CLASS\b/u;
const PRIMARY_ACTION_PATTERN = /\bPRIMARY_ACTION_CLASS\b/u;

const isIconPrimitive = (filePath: string): boolean =>
  filePath.startsWith("packages/client/components/icons/");

export const collectTouchTargetDensityViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isIconPrimitive(filePath)) {
    return [];
  }
  const violations: ValidationViolation[] = [];
  for (const match of content.matchAll(CLASS_ATTR_PATTERN)) {
    const classValue = match[1] ?? "";
    if (!BTN_SHRINK_PATTERN.test(classValue)) {
      continue;
    }
    // Same attribute must also reference TOUCH_TARGET_MIN_CLASS / PRIMARY_ACTION_CLASS nearby.
    const attrStart = match.index ?? 0;
    const windowStart = Math.max(0, attrStart - NUM_120);
    const windowEnd = Math.min(content.length, attrStart + (match[0]?.length ?? 0) + NUM_120);
    const nearby = content.slice(windowStart, windowEnd);
    if (TOUCH_FLOOR_PATTERN.test(nearby) || PRIMARY_ACTION_PATTERN.test(nearby)) {
      continue;
    }
    violations.push({
      filePath,
      line: getLineFromOffset(content, attrStart),
      message: `btn-xs/btn-sm without TOUCH_TARGET_MIN_CLASS ("${classValue}"); pair with TOUCH_TARGET_MIN_CLASS or PRIMARY_ACTION_CLASS`,
    });
  }
  return violations;
};

const main = async (): Promise<void> => {
  const entries = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions: sourceExtensions,
  });
  const violations = entries.flatMap((entry) =>
    collectTouchTargetDensityViolations(entry.filePath, entry.content),
  );
  await reportViolations(
    "Touch target density validation failed:",
    violations,
    "Touch target density validation passed.",
  );
};

if (import.meta.main) {
  await main();
}
