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

/**
 * daisyUI form controls ship below the touch floor at every size: a bare `toggle`
 * measures 40×24 in all of xs…xl, and the input is not wrapped in a larger label hit
 * area. This rule only covered `btn-xs`/`btn-sm`, so six 24px-tall portal toggles
 * shipped in Settings while the gate stayed green. Consume the SSOT token instead.
 */
const BARE_FORM_CONTROL_PATTERN = /\b(toggle|checkbox|radio)(?:-(?:xs|sm|md|lg|xl))?\b/u;
const FORM_CONTROL_TOKEN_PATTERN = /\b(?:TOGGLE_CONTROL_CLASS|CHECKBOX_CONTROL_CLASS)\b/u;

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
    if (
      BARE_FORM_CONTROL_PATTERN.test(classValue) &&
      !TOUCH_FLOOR_PATTERN.test(classValue) &&
      !FORM_CONTROL_TOKEN_PATTERN.test(classValue)
    ) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `daisyUI form control below the 44px touch floor ("${classValue}"); bind TOGGLE_CONTROL_CLASS / CHECKBOX_CONTROL_CLASS or add TOUCH_TARGET_MIN_CLASS`,
      });
      continue;
    }
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
