import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";
const NUM_16 = 16;

const bannedPattern =
  /\b(?:shims?|polyfills?|compat(?:ibility|ibilities)?|wrappers?|adapters?)\b/giu;
const disabledPolyfillPattern = /\bpolyfill\s*:\s*false\b/u;

const isDisabledPolyfillConfiguration = (content: string, matchIndex: number): boolean => {
  const surroundingSnippet = content.slice(
    Math.max(0, matchIndex - NUM_16),
    Math.min(content.length, matchIndex + 24),
  );
  return disabledPolyfillPattern.test(surroundingSnippet);
};

export const collectFallbackShimViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (filePath.endsWith(".test.ts") || filePath.endsWith(".spec.ts")) {
    return [];
  }
  const violations: ValidationViolation[] = [];
  bannedPattern.lastIndex = 0;
  for (const match of content.matchAll(bannedPattern)) {
    const value = match[0] ?? "";
    const matchIndex = match.index ?? 0;
    if (filePath.endsWith("scripts/validate-no-fallback-shims.ts")) {
      continue;
    }
    if (
      value.toLowerCase().startsWith("polyfill") &&
      isDisabledPolyfillConfiguration(content, matchIndex)
    ) {
      continue;
    }
    violations.push({
      filePath,
      line: getLineFromOffset(content, matchIndex),
      message: `Fallback term "${value}" is forbidden. Replace it with the concrete single-source implementation.`,
    });
  }
  return violations;
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots: ["packages", "scripts"],
    allowedExtensions: new Set([".ts", ".tsx", ".vue", ".md", ".rs"]),
  });

  return files.flatMap(({ filePath, content }) =>
    collectFallbackShimViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Fallback term validation failed:",
    await collectViolations(),
    "Fallback term validation passed.",
  );
}
