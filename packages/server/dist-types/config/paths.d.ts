type AutomationScriptRunnerConfig = {
    executablePath: string | null;
    entrypointPath: string | null;
};
/**
 * Expand a path that starts with ~ to the current user home directory.
 */
export declare function expandHomeDirectory(pathValue: string): string;
/**
 * Resolve a DB path and ensure its parent directory exists.
 */
export declare function resolveDatabasePath(rawPath?: string): string;
/**
 * Resolved DB path for this process (honors `DB_PATH` via env config).
 * Screenshot artifacts share the same parent directory as the active DB file.
 */
export declare const defaultDatabasePath: string;
export declare const AUTOMATION_SCREENSHOT_DIR: string;
/**
 * Optional external script-runner override for packaged desktop runtimes.
 */
export declare const readAutomationScriptRunnerConfig: () => AutomationScriptRunnerConfig;
/**
 * Absolute path to the shared scraper package used by automation services.
 */
export declare const SCRAPER_DIR: string;
/**
 * Child-process env for RPA scripts. Rewrites incomplete agent-sandbox
 * Playwright browser caches and injects PLAYWRIGHT_HOST_PLATFORM_OVERRIDE.
 */
export declare const buildAutomationProcessEnv: (baseEnv?: NodeJS.ProcessEnv) => NodeJS.ProcessEnv;
export {};
