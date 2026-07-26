import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * The workspace splits test ownership by filename:
 *
 * - `*.spec.ts` under packages/client is vitest-owned and gets the happy-dom
 *   environment from packages/client/vitest.config.ts.
 * - `*.test.ts` is bun:test-owned and runs with no DOM.
 *
 * Root `bun test` skips the client spec glob (see bunfig.toml) because it cannot
 * supply happy-dom. That exclusion is only safe while the naming split holds: a
 * client test that imports from `vitest` but is named `*.test.ts` would be
 * collected by bun with no DOM and fail on the environment instead of on real
 * behaviour, and a `*.spec.ts` importing `bun:test` would be skipped by bun and
 * ignored by vitest — silently never running at all.
 */

const scanRoots = ["packages"] as const;
const sourceExtensions = new Set([".ts"]);

const VITEST_IMPORT_PATTERN = /\bfrom\s+["']vitest["']/u;
const BUN_TEST_IMPORT_PATTERN = /\bfrom\s+["']bun:test["']/u;

const isTestFile = (filePath: string): boolean =>
  filePath.endsWith(".test.ts") || filePath.endsWith(".spec.ts");

export const collectDomTestRunnerViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (!isTestFile(filePath)) {
    return [];
  }

  const violations: ValidationViolation[] = [];
  const importsVitest = VITEST_IMPORT_PATTERN.test(content);
  const importsBunTest = BUN_TEST_IMPORT_PATTERN.test(content);

  if (importsVitest && filePath.endsWith(".test.ts")) {
    violations.push({
      filePath,
      line: 1,
      message:
        'Vitest test must be named "*.spec.ts". Root `bun test` collects "*.test.ts" without the happy-dom environment, so this file would fail on a missing DOM instead of on real behaviour.',
    });
  }

  if (importsBunTest && filePath.endsWith(".spec.ts")) {
    violations.push({
      filePath,
      line: 1,
      message:
        'bun:test test must be named "*.test.ts". Root `bun test` skips the client "*.spec.ts" glob and vitest does not provide `bun:test`, so this file would never run in either runner.',
    });
  }

  if (importsVitest && importsBunTest) {
    violations.push({
      filePath,
      line: 1,
      message:
        "Test imports both `vitest` and `bun:test`. Pick one runner so the file has exactly one owner.",
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
    collectDomTestRunnerViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "DOM test runner ownership validation failed:",
    await collectViolations(),
    "DOM test runner ownership validation passed.",
  );
}
