import { DEFAULT_DB_PATH_RELATIVE } from "@bao/shared";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";

/**
 * Shared filesystem path utilities for server runtime and tooling configuration.
 */
const HOME_DIRECTORY = homedir();
const TILDE_PREFIX = /^~(?=$|[\\/])/;

/**
 * Expand a path that starts with ~ to the current user home directory.
 */
export function expandHomeDirectory(pathValue: string): string {
  return pathValue.trim().replace(TILDE_PREFIX, HOME_DIRECTORY);
}

/**
 * Resolve a DB path and ensure its parent directory exists.
 */
export function resolveDatabasePath(rawPath?: string): string {
  const fallbackPath = resolve(HOME_DIRECTORY, DEFAULT_DB_PATH_RELATIVE);
  const dbPath = rawPath ? expandHomeDirectory(rawPath) : fallbackPath;
  const resolvedPath = resolve(dbPath);

  const dbDir = dirname(resolvedPath);
  mkdirSync(dbDir, { recursive: true });

  return resolvedPath;
}

export const defaultDatabasePath = resolveDatabasePath();

/**
 * Absolute path for browser automation screenshot assets.
 */
const DATABASE_DIR = dirname(defaultDatabasePath);
export const AUTOMATION_SCREENSHOT_DIR = resolve(DATABASE_DIR, "automation", "screenshots");
mkdirSync(AUTOMATION_SCREENSHOT_DIR, { recursive: true });

/**
 * Path to packages/scraper (Bun/TypeScript automation runtime).
 * Resolved from current working directory with fallback candidates so tooling runs
 * reliably even when drizzle-kit executes the config in CJS mode.
 */
const resolveScraperDir = (): string => {
  const configuredScraperDir = process.env.BAO_SCRAPER_DIR?.trim();
  if (configuredScraperDir && configuredScraperDir.length > 0) {
    return resolve(configuredScraperDir);
  }

  const cwd = process.cwd();
  const candidates = [
    resolve(cwd, "packages", "scraper"),
    resolve(cwd, "..", "packages", "scraper"),
    resolve(cwd, "..", "..", "packages", "scraper"),
    resolve(cwd, "..", "..", "..", "packages", "scraper"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
};

/**
 * Absolute path to the shared scraper package used by automation services.
 */
export const SCRAPER_DIR = resolveScraperDir();
