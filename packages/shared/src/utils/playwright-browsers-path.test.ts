import { describe, expect, test } from "bun:test";
import {
  CURSOR_SANDBOX_BROWSER_CACHE_MARKER,
  buildAutomationProcessEnv,
  isPollutedPlaywrightBrowsersPath,
  resolvePlaywrightBrowsersPath,
} from "./playwright-browsers-path";

const SANDBOX_CACHE_PATH = `var/folders/x/${CURSOR_SANDBOX_BROWSER_CACHE_MARKER}/abc/playwright`;
const MISSING_CACHE_PATH = "tmp/bao_missing_playwright_cache_path";
const HOST_DEFAULT_PATH = "tmp/bao_host_ms_playwright";

const pathExists =
  (existing: ReadonlySet<string>) =>
  (browsersPath: string): boolean =>
    existing.has(browsersPath);

describe("playwright browsers path sanitization", () => {
  test("detects cursor-sandbox browser caches as polluted", () => {
    expect(isPollutedPlaywrightBrowsersPath(SANDBOX_CACHE_PATH, () => true)).toBe(true);
  });

  test("detects missing browser cache paths as polluted", () => {
    expect(isPollutedPlaywrightBrowsersPath(MISSING_CACHE_PATH, () => false)).toBe(true);
  });

  test("rewrites polluted browsers path when host cache exists", () => {
    const env = buildAutomationProcessEnv(
      {
        PLAYWRIGHT_BROWSERS_PATH: SANDBOX_CACHE_PATH,
      },
      {
        pathExists: pathExists(new Set([HOST_DEFAULT_PATH])),
        hostDefaultPath: HOST_DEFAULT_PATH,
      },
    );

    expect(env.PLAYWRIGHT_BROWSERS_PATH).toBe(HOST_DEFAULT_PATH);
  });

  test("unsets polluted browsers path when host cache is missing", () => {
    const resolution = resolvePlaywrightBrowsersPath(SANDBOX_CACHE_PATH, {
      pathExists: () => false,
      hostDefaultPath: HOST_DEFAULT_PATH,
    });
    expect(resolution).toEqual({ action: "unset" });
  });
});
