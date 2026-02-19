import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";

/**
 * Shared filesystem path utilities for server runtime and tooling configuration.
 */
const HOME_DIRECTORY = homedir();
const TILDE_PREFIX = /^~(?=$|[\\/])/;
const DEFAULT_DB_FILE = ".bao/bao.db";

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
  const fallbackPath = resolve(HOME_DIRECTORY, DEFAULT_DB_FILE);
  const dbPath = rawPath ? expandHomeDirectory(rawPath) : fallbackPath;
  const resolvedPath = resolve(dbPath);

  const dbDir = dirname(resolvedPath);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  return resolvedPath;
}

export const defaultDatabasePath = resolveDatabasePath();
