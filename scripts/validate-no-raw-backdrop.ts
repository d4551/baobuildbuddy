import { isUiSsotAuthority } from "./ui-ssot-authority";
import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Ban hand-rolled glass/backdrop outside main.css glass token SSOT (brutalise UI013).
 */

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue", ".ts", ".css"]);
const rawBackdropPattern =
  /(?:-webkit-)?backdrop-filter\s*:|\bbackdrop-(?:blur|brightness|saturate|contrast)(?:-\[[^\]]+\]|-(?:sm|md|lg|xl|2xl|3xl|none))?\b/gu;

export const collectRawBackdropViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isUiSsotAuthority(filePath)) {
    return [];
  }
  const violations: ValidationViolation[] = [];
  rawBackdropPattern.lastIndex = 0;
  for (const match of content.matchAll(rawBackdropPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Raw backdrop/glass utility "${match[0]}" is forbidden. Use glass-* SSOT classes from constants/layout + main.css.`,
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
    collectRawBackdropViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Raw backdrop validation failed:",
    await collectViolations(),
    "Raw backdrop validation passed.",
  );
}
