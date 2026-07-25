/**
 * Fail-closed: route `detail` objects must include description (catches API Docs
 * "No description provided." debt). Also bans soft-skip patterns in openapi tests.
 */
import { readFile } from "node:fs/promises";
import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const DETAIL_TAGS_ONLY_PATTERN =
  /detail:\s*\{\s*tags:\s*\[[^\]]+\]\s*,?\s*\}/gu;
const DETAIL_BLOCK_PATTERN = /detail:\s*\{([\s\S]*?)\}/gu;
const DESCRIPTION_KEY_PATTERN = /\bdescription\s*:/u;
const SOFT_SKIP_TAGS_PATTERN =
  /if\s*\(\s*!operation\.tags\s*\)\s*\{\s*continue\s*;\s*\}/u;

export const collectOpenApiDescriptionViolations = (
  files: Array<{ filePath: string; content: string }>,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  for (const file of files) {
    if (file.filePath.includes("openapi-detail.ts")) {
      continue;
    }
    if (file.filePath.includes("openapi-tags.test.ts") && SOFT_SKIP_TAGS_PATTERN.test(file.content)) {
      violations.push({
        filePath: file.filePath,
        line: 1,
        message:
          "OpenAPI tag test soft-skips missing tags (`if (!operation.tags) continue`). Fail-closed: require tags + description.",
      });
    }
    if (!file.filePath.includes("/routes/") || !file.filePath.endsWith(".ts")) {
      continue;
    }
    if (file.filePath.includes(".test.ts")) {
      continue;
    }
    DETAIL_TAGS_ONLY_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null = DETAIL_TAGS_ONLY_PATTERN.exec(file.content);
    while (match) {
      const line = file.content.slice(0, match.index).split(/\r?\n/u).length;
      violations.push({
        filePath: file.filePath,
        line,
        message: `Route detail missing description: ${match[0].replace(/\s+/gu, " ")}`,
      });
      match = DETAIL_TAGS_ONLY_PATTERN.exec(file.content);
    }
    DETAIL_BLOCK_PATTERN.lastIndex = 0;
    let blockMatch: RegExpExecArray | null = DETAIL_BLOCK_PATTERN.exec(file.content);
    while (blockMatch) {
      const body = blockMatch[1] ?? "";
      if (body.includes("tags") && !DESCRIPTION_KEY_PATTERN.test(body)) {
        const line = file.content.slice(0, blockMatch.index).split(/\r?\n/u).length;
        violations.push({
          filePath: file.filePath,
          line,
          message: "Route detail has tags but no description key.",
        });
      }
      blockMatch = DETAIL_BLOCK_PATTERN.exec(file.content);
    }
  }
  return violations;
};

const main = async (): Promise<void> => {
  const files = await collectProjectFileEntries({
    scanRoots: ["packages/server/src"],
    allowedExtensions: new Set([".ts"]),
  });
  // Also include the openapi tags test soft-skip check via direct read if filtered out.
  const testPath = "packages/server/src/routes/openapi-tags.test.ts";
  const testContent = await readFile(testPath, "utf8");
  const withTest = [...files, { filePath: testPath, content: testContent }];
  await reportViolations(
    "OpenAPI description validation failed:",
    collectOpenApiDescriptionViolations(withTest),
    "OpenAPI description validation passed.",
  );
};

if (import.meta.main) {
  await main();
}
