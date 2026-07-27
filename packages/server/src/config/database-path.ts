import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { DEFAULT_DB_PATH_RELATIVE } from "@bao/shared/constants/paths";

/**
 * Database path resolution, kept free of any Bun-only API.
 *
 * `drizzle.config.ts` needs this to locate the database, but drizzle-kit loads its config
 * outside the Bun runtime. Reaching it through `config/paths` dragged in that module's
 * `Bun.env` reads and its `config/env` import, so `drizzle-kit generate` failed with
 * `Bun is not defined` and no schema change could be turned into a migration. This module
 * is the single owner of the resolution and imports nothing that assumes a runtime.
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
