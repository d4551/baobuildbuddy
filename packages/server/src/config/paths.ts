import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { DEFAULT_DB_PATH_RELATIVE } from "@bao/shared/constants/paths";
import {
  buildAutomationProcessEnv as buildAutomationProcessEnvFromShared,
  defaultPlaywrightBrowsersPathForPlatform,
} from "@bao/shared/utils/playwright-browsers-path";
import { resolveScraperDirectory } from "./scraper-dir-resolve";

type AutomationScriptRunnerConfig = {
  executablePath: string | null;
  entrypointPath: string | null;
};

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
const resolveScraperDir = (): string =>
  resolveScraperDirectory(process.cwd(), process.env.BAO_SCRAPER_DIR);

export const readAutomationScriptRunnerConfig = (): AutomationScriptRunnerConfig => {
  const executablePath = process.env.BAO_SCRIPT_RUNNER_PATH?.trim();
  const entrypointPath = process.env.BAO_SCRIPT_RUNNER_ENTRYPOINT_PATH?.trim();

  return {
    executablePath: executablePath && executablePath.length > 0 ? executablePath : null,
    entrypointPath: entrypointPath && entrypointPath.length > 0 ? entrypointPath : null,
  };
};

/**
 * Absolute path to the shared scraper package used by automation services.
 */
export const SCRAPER_DIR = resolveScraperDir();

/**
 * Child-process env for RPA scripts. Rewrites incomplete agent-sandbox
 * Playwright browser caches to the host default cache when present.
 */
export const buildAutomationProcessEnv = (
  baseEnv: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv =>
  buildAutomationProcessEnvFromShared(baseEnv, {
    pathExists: existsSync,
    hostDefaultPath: defaultPlaywrightBrowsersPathForPlatform(process.platform, homedir()),
  });
