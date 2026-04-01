import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const styleBlockPattern = /<style\b/gu;

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots: ["packages/client"],
    allowedExtensions: new Set([".vue"]),
  });

  return files.flatMap(({ filePath, content }) => {
    const violations: ValidationViolation[] = [];
    styleBlockPattern.lastIndex = 0;
    for (const match of content.matchAll(styleBlockPattern)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: "Local Vue <style> blocks are forbidden. Use shared tokens or centralized CSS.",
      });
    }
    return violations;
  });
};

if (import.meta.main) {
  await reportViolations(
    "Local style validation failed:",
    await collectViolations(),
    "Local style validation passed.",
  );
}
