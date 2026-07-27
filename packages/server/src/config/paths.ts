import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { arch, homedir, platform, release } from "node:os";
import { dirname, resolve } from "node:path";
import { resolvePlaywrightChromiumExecutable } from "@bao/shared/utils/playwright-chromium-probe";
import {
  buildAutomationProcessEnv as buildAutomationProcessEnvFromShared,
  defaultPlaywrightBrowsersPathForPlatform,
  resolvePlaywrightHostPlatformOverride,
} from "@bao/shared/utils/playwright-browsers-path";
import { expandHomeDirectory, resolveDatabasePath } from "./database-path";
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

export { expandHomeDirectory, resolveDatabasePath };

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
 * Binds the shared pure helper to this process's env, filesystem, and platform.
 */
export const buildAutomationProcessEnvFromEnv = (
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

/**
 * Absolute path to the installed Playwright Chromium build, or null when no
 * browser is present. Reads the browser cache location from the automation
 * child-process env this module already resolves, so the RPA capability audit
 * never reports job-apply as configured without a browser to drive.
 */
export const resolveInstalledChromiumExecutable = (): string | null => {
  const automationEnv = buildAutomationProcessEnvFromEnv();
  const browsersPath =
    automationEnv.PLAYWRIGHT_BROWSERS_PATH ??
    defaultPlaywrightBrowsersPathForPlatform(platform(), HOME_DIRECTORY);

  return resolvePlaywrightChromiumExecutable(browsersPath, platform(), {
    pathExists: existsSync,
    readDir: (directoryPath) => readdirSync(directoryPath),
  });
};
