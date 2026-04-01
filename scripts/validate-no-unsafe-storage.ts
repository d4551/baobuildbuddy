import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const storagePattern =
  /\b(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\s*\(([^)]*)\)/gu;
const sensitiveKeyPattern = /\b(?:auth|token|api[-_ ]?key|bearer|password|secret)\b/iu;

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots: ["packages/client"],
    allowedExtensions: new Set([".ts", ".vue"]),
  });

  return files.flatMap(({ filePath, content }) => {
    const violations: ValidationViolation[] = [];
    storagePattern.lastIndex = 0;
    for (const match of content.matchAll(storagePattern)) {
      const argumentText = match[1] ?? "";
      if (!sensitiveKeyPattern.test(argumentText)) {
        continue;
      }
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message:
          "Sensitive auth or secret material must not be persisted in localStorage/sessionStorage.",
      });
    }
    return violations;
  });
};

if (import.meta.main) {
  await reportViolations(
    "Unsafe storage validation failed:",
    await collectViolations(),
    "Unsafe storage validation passed.",
  );
}
