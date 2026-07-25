import { isUiSsotAuthority } from "./ui-ssot-authority";
import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Ban physical CSS direction utilities in consumers (brutalise UI010).
 * SSOT authority may still define migration aliases until tokens are fully logical.
 */

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue", ".ts", ".css"]);
// Require a scale/position suffix for ml|mr|pl|pr|left|right so bare JS identifiers
// and natural-language substrings (e.g. French "pr" before accents) are not flagged.
// Complete utilities text-left|text-right|float-left|float-right match as wholes.
const physicalUtilityPattern =
  /(?:^|[\s"'`:])((?:(?:ml|mr|pl|pr|left|right)(?:-\[[^\]]+\]|-(?:auto|px|full|\d+(?:\.\d+)?))|(?:text|float)-(?:left|right)))\b/gu;
// Require a CSS-ish value after left/right so TS params (`left: Foo`) are not flagged.
const physicalCssPropertyPattern =
  /(?:^|[;{\s])((?:margin|padding)-(?:left|right)\s*:|(?:left|right)\s*:\s*(?:auto|inherit|initial|unset|0|-?\d|var\(|calc\(|['"])|text-align\s*:\s*(?:left|right))/giu;

export const collectLogicalCssViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isUiSsotAuthority(filePath)) {
    return [];
  }
  const violations: ValidationViolation[] = [];
  physicalUtilityPattern.lastIndex = 0;
  for (const match of content.matchAll(physicalUtilityPattern)) {
    const token = match[1] ?? match[0];
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Physical direction token "${token}" is forbidden. Use logical ms/me/ps/pe/text-start|end/inset-inline-*.`,
    });
  }
  physicalCssPropertyPattern.lastIndex = 0;
  for (const match of content.matchAll(physicalCssPropertyPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Physical CSS "${(match[1] ?? match[0]).trim()}" is forbidden. Use logical properties.`,
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
    collectLogicalCssViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Logical CSS validation failed:",
    await collectViolations(),
    "Logical CSS validation passed.",
  );
}
