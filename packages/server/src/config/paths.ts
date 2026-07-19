import { existsSync, mkdirSync } from "node:fs";
import { arch, homedir, platform, release } from "node:os";
import { dirname, resolve } from "node:path";
import { DEFAULT_DB_PATH_RELATIVE } from "@bao/shared/constants/paths";
import {
  buildAutomationProcessEnv as buildAutomationProcessEnvFromShared,
  defaultPlaywrightBrowsersPathForPlatform,
  resolvePlaywrightHostPlatformOverride,
} from "@bao/shared/utils/playwright-browsers-path";
import { config } from "./env";
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

/**
 * Resolved DB path for this process (honors `DB_PATH` via env config).
 * Screenshot artifacts share the same parent directory as the active DB file.
 */
export const defaultDatabasePath = resolveDatabasePath(config.dbPath);

/**
 * Absolute path for browser automation screenshot assets.
 */
const DATABASE_DIR = dirname(defaultDatabasePath);
export const AUTOMATION_SCREENSHOT_DIR = resolve(DATABASE_DIR, "automation", "screenshots");
mkdirSync(AUTOMATION_SCREENSHOT_DIR, { recursive: true });

/**
 * Read optional non-empty path from Bun.env first, then process.env.
 * Lives here (not env.ts) so desktop/runtime overrides stay outside the MAS hardban path.
 */
const readOptionalEnvPath = (
  bunValue: string | undefined,
  processValue: string | undefined,
): string | null => {
  const candidate = bunValue ?? processValue;
  const trimmed = candidate?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

const readScraperDirOverride = (): string | null =>
  readOptionalEnvPath(Bun.env.BAO_SCRAPER_DIR, process.env.BAO_SCRAPER_DIR);

/**
 * Path to packages/scraper (Bun/TypeScript automation runtime).
 * Resolved from current working directory with fallback candidates so tooling runs
 * reliably even when drizzle-kit executes the config in CJS mode.
 *
 * Optional BAO_SCRAPER_DIR override is read via Bun.env/process.env above.
 */
const resolveScraperDir = (): string =>
  resolveScraperDirectory(process.cwd(), readScraperDirOverride());

/**
 * Optional external script-runner override for packaged desktop runtimes.
 */
export const readAutomationScriptRunnerConfig = (): AutomationScriptRunnerConfig => ({
  executablePath: readOptionalEnvPath(
    Bun.env.BAO_SCRIPT_RUNNER_PATH,
    process.env.BAO_SCRIPT_RUNNER_PATH,
  ),
  entrypointPath: readOptionalEnvPath(
    Bun.env.BAO_SCRIPT_RUNNER_ENTRYPOINT_PATH,
    process.env.BAO_SCRIPT_RUNNER_ENTRYPOINT_PATH,
  ),
});

/**
 * Absolute path to the shared scraper package used by automation services.
 */
export const SCRAPER_DIR = resolveScraperDir();

/**
 * Child-process env for RPA scripts. Rewrites incomplete agent-sandbox
 * Playwright browser caches and injects PLAYWRIGHT_HOST_PLATFORM_OVERRIDE.
 */
export const buildAutomationProcessEnv = (
  baseEnv: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv =>
  buildAutomationProcessEnvFromShared(
    baseEnv,
    {
      pathExists: existsSync,
      hostDefaultPath: defaultPlaywrightBrowsersPathForPlatform(process.platform, HOME_DIRECTORY),
    },
    resolvePlaywrightHostPlatformOverride(platform(), arch(), release()),
  );
