/**
 * Shared validation utilities for lint/audit scripts.
 * Single source of truth for file scanning and violation reporting.
 */

export const IGNORED_DIRECTORY_NAMES = new Set([
  "node_modules",
  ".git",
  ".nuxt",
  ".output",
  "dist",
  "dist-types",
  "coverage",
]);

export type ValidationViolation = {
  filePath: string;
  line: number;
  message: string;
};

export const DEFAULT_SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".vue",
  ".html",
  ".css",
]);
const LINE_BREAK_PATTERN = /\r?\n/u;

/**
 * Maps a character offset to a 1-based line number.
 */
export function getLineFromOffset(text: string, offset: number): number {
  if (offset <= 0) {
    return 1;
  }
  let line = 1;
  for (let index = 0; index < offset; index += 1) {
    if (text.charCodeAt(index) === 10) {
      line += 1;
    }
  }
  return line;
}

/**
 * Returns true if the path contains any ignored directory segment.
 */
export function shouldIgnorePath(
  pathValue: string,
  ignoredDirs: Set<string> = IGNORED_DIRECTORY_NAMES,
): boolean {
  return pathValue.split("/").some((segment) => ignoredDirs.has(segment));
}

export function hasAllowedExtension(
  pathValue: string,
  allowedExtensions: Set<string> = DEFAULT_SOURCE_EXTENSIONS,
): boolean {
  for (const extension of allowedExtensions) {
    if (pathValue.endsWith(extension)) {
      return true;
    }
  }
  return false;
}

export async function collectProjectFiles(options: {
  rootDir?: string;
  scanRoots: readonly string[];
  allowedExtensions?: Set<string>;
  ignoredDirs?: Set<string>;
}): Promise<string[]> {
  const rootDir = options.rootDir ?? process.cwd();
  const allowedExtensions = options.allowedExtensions ?? DEFAULT_SOURCE_EXTENSIONS;
  const ignoredDirs = options.ignoredDirs ?? IGNORED_DIRECTORY_NAMES;

  const fileGroups = await Promise.all(
    options.scanRoots.map(async (scanRoot) => {
      const glob = new Bun.Glob(`${scanRoot}/**/*`);
      return Array.fromAsync(glob.scan({ cwd: rootDir, onlyFiles: true }));
    }),
  );

  return fileGroups
    .flat()
    .map((filePath) => filePath.replace(/\\/gu, "/"))
    .filter(
      (filePath) =>
        !shouldIgnorePath(filePath, ignoredDirs) &&
        hasAllowedExtension(filePath, allowedExtensions),
    );
}

export async function collectProjectFileEntries(options: {
  rootDir?: string;
  scanRoots: readonly string[];
  allowedExtensions?: Set<string>;
  ignoredDirs?: Set<string>;
}): Promise<Array<{ filePath: string; content: string }>> {
  const files = await collectProjectFiles(options);
  return Promise.all(
    files.map(async (filePath) => ({
      filePath,
      content: await Bun.file(filePath).text(),
    })),
  );
}

export function countLines(text: string): number {
  return text.split(LINE_BREAK_PATTERN).length;
}

export function isPageVueFile(pathValue: string): boolean {
  return pathValue.startsWith("packages/client/pages/") && pathValue.endsWith(".vue");
}

export function isVueFile(pathValue: string): boolean {
  return pathValue.endsWith(".vue");
}

export async function reportViolations(
  heading: string,
  violations: ValidationViolation[],
  successMessage: string,
): Promise<void> {
  if (violations.length === 0) {
    await import("./cli-output").then(({ writeOutput }) => writeOutput(successMessage));
    return;
  }

  const { writeError } = await import("./cli-output");
  await writeError(heading);
  const lines = violations.map(
    (violation) => `- ${violation.filePath}:${violation.line} ${violation.message}`,
  );
  if (lines.length > 0) {
    await writeError(lines.join("\n"));
  }
  process.exit(1);
}
