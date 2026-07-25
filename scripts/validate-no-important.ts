/**
 * Ban CSS !important in client sources (industry: solve specificity via SSOT tokens).
 */
import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const IMPORTANT_PATTERN = /!important\b/u;
const LINE_SPLIT_PATTERN = /\r?\n/u;

export const collectNoImportantViolations = (
  files: Array<{ filePath: string; content: string }>,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  for (const file of files) {
    const lines = file.content.split(LINE_SPLIT_PATTERN);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? "";
      if (IMPORTANT_PATTERN.test(line)) {
        violations.push({
          filePath: file.filePath,
          line: index + 1,
          message: "Forbidden !important — fix specificity via SSOT tokens/classes.",
        });
      }
    }
  }
  return violations;
};

const main = async (): Promise<void> => {
  const files = await collectProjectFileEntries({
    scanRoots: ["packages/client"],
    allowedExtensions: new Set([".vue", ".css", ".ts", ".tsx"]),
  });
  await reportViolations(
    "No !important validation failed:",
    collectNoImportantViolations(files),
    "No !important validation passed.",
  );
};

if (import.meta.main) {
  await main();
}
