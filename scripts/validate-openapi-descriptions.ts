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

const DETAIL_TAGS_ONLY_PATTERN = /detail:\s*\{\s*tags:\s*\[[^\]]+\]\s*,?\s*\}/gu;
const DETAIL_BLOCK_PATTERN = /detail:\s*\{([\s\S]*?)\}/gu;
const DESCRIPTION_KEY_PATTERN = /\bdescription\s*:/u;
const SOFT_SKIP_TAGS_PATTERN = /if\s*\(\s*!operation\.tags\s*\)\s*\{\s*continue\s*;\s*\}/u;
const NEWLINE_SPLIT_PATTERN = /\r?\n/u;
const WHITESPACE_COLLAPSE_PATTERN = /\s+/gu;

const lineAtIndex = (content: string, index: number): number =>
  content.slice(0, index).split(NEWLINE_SPLIT_PATTERN).length;

const collectSoftSkipViolations = (file: {
  filePath: string;
  content: string;
}): ValidationViolation[] => {
  if (!file.filePath.includes("openapi-tags.test.ts")) {
    return [];
  }
  if (!SOFT_SKIP_TAGS_PATTERN.test(file.content)) {
    return [];
  }
  return [
    {
      filePath: file.filePath,
      line: 1,
      message:
        "OpenAPI tag test soft-skips missing tags (`if (!operation.tags) continue`). Fail-closed: require tags + description.",
    },
  ];
};

const collectTagsOnlyViolations = (file: {
  filePath: string;
  content: string;
}): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  DETAIL_TAGS_ONLY_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null = DETAIL_TAGS_ONLY_PATTERN.exec(file.content);
  while (match) {
    violations.push({
      filePath: file.filePath,
      line: lineAtIndex(file.content, match.index),
      message: `Route detail missing description: ${match[0].replace(WHITESPACE_COLLAPSE_PATTERN, " ")}`,
    });
    match = DETAIL_TAGS_ONLY_PATTERN.exec(file.content);
  }
  return violations;
};

const collectMissingDescriptionViolations = (file: {
  filePath: string;
  content: string;
}): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  DETAIL_BLOCK_PATTERN.lastIndex = 0;
  let blockMatch: RegExpExecArray | null = DETAIL_BLOCK_PATTERN.exec(file.content);
  while (blockMatch) {
    const body = blockMatch[1] ?? "";
    if (body.includes("tags") && !DESCRIPTION_KEY_PATTERN.test(body)) {
      violations.push({
        filePath: file.filePath,
        line: lineAtIndex(file.content, blockMatch.index),
        message: "Route detail has tags but no description key.",
      });
    }
    blockMatch = DETAIL_BLOCK_PATTERN.exec(file.content);
  }
  return violations;
};

const shouldScanRouteFile = (filePath: string): boolean => {
  if (filePath.includes("openapi-detail.ts")) {
    return false;
  }
  if (!filePath.includes("/routes/") || !filePath.endsWith(".ts")) {
    return false;
  }
  return !filePath.includes(".test.ts");
};

export const collectOpenApiDescriptionViolations = (
  files: Array<{ filePath: string; content: string }>,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  for (const file of files) {
    violations.push(...collectSoftSkipViolations(file));
    if (!shouldScanRouteFile(file.filePath)) {
      continue;
    }
    violations.push(...collectTagsOnlyViolations(file));
    violations.push(...collectMissingDescriptionViolations(file));
  }
  return violations;
};

const main = async (): Promise<void> => {
  const files = await collectProjectFileEntries({
    scanRoots: ["packages/server/src"],
    allowedExtensions: new Set([".ts"]),
  });
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
