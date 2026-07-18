import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CURSOR_SANDBOX_BROWSER_CACHE_MARKER = "cursor-sandbox-cache";

const defaultPlaywrightBrowsersPath = (): string => {
  if (process.platform === "darwin") {
    return join(homedir(), "Library/Caches/ms-playwright");
  }
  return join(homedir(), ".cache/ms-playwright");
};

/**
 * Returns true when PLAYWRIGHT_BROWSERS_PATH points at an incomplete or
 * agent-sandbox cache that cannot launch Chromium headless shell.
 */
export const isPollutedPlaywrightBrowsersPath = (browsersPath: string): boolean => {
  if (browsersPath.includes(CURSOR_SANDBOX_BROWSER_CACHE_MARKER)) {
    return true;
  }
  return !existsSync(browsersPath);
};

/**
 * Sanitizes process.env.PLAYWRIGHT_BROWSERS_PATH before Playwright resolves
 * its registry. Prefer unsetting a polluted path so Playwright uses the
 * host default cache; if that cache exists, pin it explicitly.
 */
export const sanitizePlaywrightBrowsersPathEnv = (): void => {
  const configured = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!configured || !isPollutedPlaywrightBrowsersPath(configured)) {
    return;
  }

  const hostDefault = defaultPlaywrightBrowsersPath();
  if (existsSync(hostDefault)) {
    process.env.PLAYWRIGHT_BROWSERS_PATH = hostDefault;
    return;
  }

  delete process.env.PLAYWRIGHT_BROWSERS_PATH;
};

/**
 * Builds a child-process env with a non-polluted Playwright browsers path.
 */
export const buildAutomationProcessEnv = (
  baseEnv: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv => {
  const env = { ...baseEnv };
  const configured = env.PLAYWRIGHT_BROWSERS_PATH;
  if (!configured || !isPollutedPlaywrightBrowsersPath(configured)) {
    return env;
  }

  const hostDefault = defaultPlaywrightBrowsersPath();
  if (existsSync(hostDefault)) {
    env.PLAYWRIGHT_BROWSERS_PATH = hostDefault;
    return env;
  }

  delete env.PLAYWRIGHT_BROWSERS_PATH;
  return env;
};
