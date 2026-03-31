import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const bannedPattern = /\b(?:shim|polyfill|compat(?:ibility)?|wrapper|adapter)\b/giu;
const disabledPolyfillPattern = /\bpolyfill\s*:\s*false\b/u;

const isDisabledPolyfillConfiguration = (content: string, matchIndex: number): boolean => {
  const surroundingSnippet = content.slice(
    Math.max(0, matchIndex - 16),
    Math.min(content.length, matchIndex + 24),
  );
  return disabledPolyfillPattern.test(surroundingSnippet);
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots: ["packages", "scripts"],
    allowedExtensions: new Set([".ts", ".tsx", ".vue", ".md", ".rs"]),
  });

  return files.flatMap(({ filePath, content }) => {
    const violations: ValidationViolation[] = [];
    bannedPattern.lastIndex = 0;
    for (const match of content.matchAll(bannedPattern)) {
      const value = match[0] ?? "";
      const matchIndex = match.index ?? 0;
      if (filePath.endsWith("scripts/validate-no-fallback-shims.ts")) {
        continue;
      }
      if (
        value.toLowerCase() === "polyfill" &&
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
  });
};

if (import.meta.main) {
  await reportViolations(
    "Fallback term validation failed:",
    await collectViolations(),
    "Fallback term validation passed.",
  );
}
