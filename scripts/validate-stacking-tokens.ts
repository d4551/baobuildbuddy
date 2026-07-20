import { isUiSsotAuthority } from "./ui-ssot-authority";
import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Ban raw z-index literals and arbitrary z-[N] utilities (brutalise UI019 / UI006 remainder).
 */

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue", ".ts", ".css"]);
const zIndexCssPattern = /z-index\s*:\s*-?\d+/gu;
const zArbitraryUtilityPattern = /\bz-\[\d+\]/gu;

export const collectStackingTokenViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isUiSsotAuthority(filePath)) {
    return [];
  }
  const violations: ValidationViolation[] = [];
  zIndexCssPattern.lastIndex = 0;
  for (const match of content.matchAll(zIndexCssPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Raw CSS "${match[0]}" is forbidden. Use Tailwind z-* scale or SSOT layer tokens in main.css.`,
    });
  }
  zArbitraryUtilityPattern.lastIndex = 0;
  for (const match of content.matchAll(zArbitraryUtilityPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Arbitrary stacking utility "${match[0]}" is forbidden. Use Tailwind z-* scale tokens.`,
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
    collectStackingTokenViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Stacking token validation failed:",
    await collectViolations(),
    "Stacking token validation passed.",
  );
}
