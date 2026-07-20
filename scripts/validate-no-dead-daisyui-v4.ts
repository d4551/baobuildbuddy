import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Ban daisyUI v4 class names removed/renamed in v5 (brutalise UI005).
 */

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue", ".ts", ".css"]);

const deadDaisyUiV4Pattern =
  /\b(?:btn-group|input-group|form-control|tabs-bordered|tabs-lifted|tabs-boxed|card-bordered|input-bordered|select-bordered|textarea-bordered|btn-bordered)\b/gu;

export const collectDeadDaisyUiV4ViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  deadDaisyUiV4Pattern.lastIndex = 0;
  for (const match of content.matchAll(deadDaisyUiV4Pattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Dead daisyUI v4 class "${match[0]}" is forbidden. Use daisyUI v5 contracts (join/fieldset/tabs / default borders).`,
    });
  }
  return violations;
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots: [...scanRoots],
    allowedExtensions: sourceExtensions,
  });
  return files.flatMap(({ filePath, content }) =>
    collectDeadDaisyUiV4ViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Dead daisyUI v4 class validation failed:",
    await collectViolations(),
    "Dead daisyUI v4 class validation passed.",
  );
}
