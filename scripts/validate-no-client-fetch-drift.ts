import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const fetchPattern = /\bfetch\s*\(/gu;

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots: [
      "packages/client/pages",
      "packages/client/components",
      "packages/client/composables",
    ],
    allowedExtensions: new Set([".vue", ".ts"]),
  });

  return files.flatMap(({ filePath, content }) => {
    const violations: ValidationViolation[] = [];
    fetchPattern.lastIndex = 0;
    for (const match of content.matchAll(fetchPattern)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message:
          "Direct client fetch calls are forbidden in pages and components. Route them through shared composables or API utilities.",
      });
    }
    return violations;
  });
};

if (import.meta.main) {
  await reportViolations(
    "Client fetch drift validation failed:",
    await collectViolations(),
    "Client fetch drift validation passed.",
  );
}
