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
