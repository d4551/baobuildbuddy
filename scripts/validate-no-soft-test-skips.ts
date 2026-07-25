/**
 * Ban soft test skips and LDL “continue when missing” patterns in capability tests.
 */
import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const SKIP_CALL_PATTERN = /\b(?:test|it|describe)\.(?:skip|todo|only)\s*\(/u;
const XIT_PATTERN = /\bx(?:it|describe)\s*\(/u;
const SOFT_MISSING_TAGS_CONTINUE = /if\s*\(\s*!operation\.tags\s*\)\s*\{\s*continue\s*;\s*\}/u;
const HONEST_STT_HARDCODED_BLOCKED = /stt:\s*\{\s*status:\s*["']BLOCKED["']/u;

export const collectSoftTestSkipViolations = (
  files: Array<{ filePath: string; content: string }>,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  for (const file of files) {
    // Meta-test that asserts the skip detector may contain the forbidden token as data.
    if (file.filePath.endsWith("validate-no-soft-test-skips.test.ts")) {
      continue;
    }
    if (SKIP_CALL_PATTERN.test(file.content) || XIT_PATTERN.test(file.content)) {
      violations.push({
        filePath: file.filePath,
        line: 1,
        message:
          "Forbidden test.skip / describe.skip / xit — delete or fix the test (no soft skips).",
      });
    }
    if (
      file.filePath.includes("openapi-tags.test.ts") &&
      SOFT_MISSING_TAGS_CONTINUE.test(file.content)
    ) {
      violations.push({
        filePath: file.filePath,
        line: 1,
        message: "OpenAPI test soft-skips missing tags — fail-closed instead.",
      });
    }
    if (
      file.filePath.includes("browser-honest-capabilities-proof.ts") &&
      HONEST_STT_HARDCODED_BLOCKED.test(file.content)
    ) {
      violations.push({
        filePath: file.filePath,
        line: 1,
        message:
          "Honest capabilities hardcodes STT BLOCKED — probe Whisper/local STT fail-closed instead.",
      });
    }
  }
  return violations;
};

const main = async (): Promise<void> => {
  const files = await collectProjectFileEntries({
    scanRoots: ["packages", "scripts"],
    allowedExtensions: new Set([".ts", ".tsx"]),
  });
  await reportViolations(
    "Soft test skip validation failed:",
    collectSoftTestSkipViolations(files),
    "Soft test skip validation passed.",
  );
};

if (import.meta.main) {
  await main();
}
