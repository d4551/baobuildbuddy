/**
 * Module-mock restoration gate.
 *
 * `mock.module(specifier, factory)` replaces a module for the **whole test
 * process**, not just the file that called it, and `mock.restore()` does not undo
 * it. A file that installs one and walks away silently rewires every test file
 * that runs after it: a stubbed logger turns later log assertions into assertions
 * against an empty stream, a stubbed `db/client` runs later suites against another
 * file's in-memory database. Both failure modes are green-passing, which is worse
 * than a red test.
 *
 * The gate: every specifier a test file mocks outside `afterAll` must be handed
 * back inside an `afterAll`, by re-mocking it with the real bindings captured
 * before the stub was installed.
 *
 * Restoration must re-mock, not `mock.restore()` — the latter only resets `mock()`
 * and `spyOn()` doubles.
 */
import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const TEST_FILE_SUFFIXES = [".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx"] as const;

/** Meta-test carries the forbidden shapes as fixture data. */
const EXEMPT_FILE_SUFFIX = "validate-test-module-mock-restoration.test.ts";

const MOCK_MODULE_PATTERN = /\bmock\s*\.\s*module\s*\(\s*(["'`])([^"'`]+)\1/gu;
const AFTER_ALL_PATTERN = /\bafterAll\s*\(/gu;

type Range = { start: number; end: number };

const isTestFilePath = (filePath: string): boolean =>
  TEST_FILE_SUFFIXES.some((suffix) => filePath.endsWith(suffix));

/**
 * Returns the source ranges covered by `afterAll(...)` calls.
 *
 * Scanning is paren-balanced from the call's opening paren, which is enough for
 * the shapes that appear in test files (a callback argument, possibly async, with
 * nested calls). Parens inside strings, template literals and comments are
 * skipped so a `")"` in a message cannot close the range early.
 */
export const collectAfterAllRanges = (content: string): Range[] => {
  const ranges: Range[] = [];
  AFTER_ALL_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(AFTER_ALL_PATTERN)) {
    const openIndex = (match.index ?? 0) + match[0].length - 1;
    const end = findMatchingParen(content, openIndex);
    if (end > openIndex) {
      ranges.push({ start: openIndex, end });
    }
  }
  return ranges;
};

const QUOTE_CHARACTERS = new Set(["'", '"', "`"]);

function skipQuoted(content: string, startIndex: number): number {
  const quote = content[startIndex];
  let index = startIndex + 1;
  while (index < content.length) {
    const character = content[index];
    if (character === "\\") {
      index += 2;
      continue;
    }
    if (character === quote) {
      return index + 1;
    }
    index += 1;
  }
  return content.length;
}

function skipComment(content: string, startIndex: number): number {
  if (content.startsWith("//", startIndex)) {
    const lineEnd = content.indexOf("\n", startIndex);
    return lineEnd === -1 ? content.length : lineEnd;
  }
  const blockEnd = content.indexOf("*/", startIndex + 2);
  return blockEnd === -1 ? content.length : blockEnd + 2;
}

function findMatchingParen(content: string, openIndex: number): number {
  let depth = 0;
  let index = openIndex;
  while (index < content.length) {
    const character = content[index];
    if (character !== undefined && QUOTE_CHARACTERS.has(character)) {
      index = skipQuoted(content, index);
      continue;
    }
    if (content.startsWith("//", index) || content.startsWith("/*", index)) {
      index = skipComment(content, index);
      continue;
    }
    if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
    index += 1;
  }
  return -1;
}

const isInsideAnyRange = (offset: number, ranges: readonly Range[]): boolean =>
  ranges.some((range) => offset > range.start && offset < range.end);

type ModuleMockSite = { specifier: string; offset: number };

/** Splits a file's `mock.module(...)` calls into installs and afterAll restorations. */
const collectModuleMockSites = (
  content: string,
): { installed: ModuleMockSite[]; restored: Set<string> } => {
  const afterAllRanges = collectAfterAllRanges(content);
  const restored = new Set<string>();
  const installed: ModuleMockSite[] = [];

  MOCK_MODULE_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(MOCK_MODULE_PATTERN)) {
    const offset = match.index ?? 0;
    const specifier = match[2] ?? "";
    if (isInsideAnyRange(offset, afterAllRanges)) {
      restored.add(specifier);
    } else {
      installed.push({ specifier, offset });
    }
  }
  return { installed, restored };
};

const collectViolationsForFile = (file: {
  filePath: string;
  content: string;
}): ValidationViolation[] => {
  const { installed, restored } = collectModuleMockSites(file.content);
  return installed
    .filter((site) => !restored.has(site.specifier))
    .map((site) => ({
      filePath: file.filePath,
      line: getLineFromOffset(file.content, site.offset),
      message: `mock.module("${site.specifier}") is never handed back — re-mock it with the real bindings inside afterAll (mock.restore() does not undo module mocks).`,
    }));
};

export const collectModuleMockRestorationViolations = (
  files: ReadonlyArray<{ filePath: string; content: string }>,
): ValidationViolation[] =>
  files
    .filter((file) => isTestFilePath(file.filePath) && !file.filePath.endsWith(EXEMPT_FILE_SUFFIX))
    .flatMap(collectViolationsForFile);

const main = async (): Promise<void> => {
  const files = await collectProjectFileEntries({
    scanRoots: ["packages", "scripts"],
    allowedExtensions: new Set([".ts", ".tsx"]),
  });
  await reportViolations(
    "Module-mock restoration validation failed:",
    collectModuleMockRestorationViolations(files),
    "Module-mock restoration validation passed.",
  );
};

if (import.meta.main) {
  await main();
}
