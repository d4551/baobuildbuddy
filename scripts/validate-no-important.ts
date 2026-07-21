import { isUiSsotAuthority } from "./ui-ssot-authority";
import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Ban `!important` outside the CSS SSOT authority (brutalise UI009).
 */

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue", ".ts", ".css"]);
const importantPattern = /!important\b/gu;

export const collectImportantViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isUiSsotAuthority(filePath) && filePath.endsWith(".css")) {
    return [];
  }
  const violations: ValidationViolation[] = [];
  importantPattern.lastIndex = 0;
  for (const match of content.matchAll(importantPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message:
        "`!important` is forbidden outside assets/css/main.css SSOT. Fix specificity with tokens/cascade.",
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
    collectImportantViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "!important validation failed:",
    await collectViolations(),
    "!important validation passed.",
  );
}
