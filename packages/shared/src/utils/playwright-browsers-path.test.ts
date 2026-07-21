import { describe, expect, test } from "bun:test";
import {
  buildAutomationProcessEnv,
  CURSOR_SANDBOX_BROWSER_CACHE_MARKER,
  isPollutedPlaywrightBrowsersPath,
  resolvePlaywrightBrowsersPath,
  resolvePlaywrightHostPlatformOverride,
} from "./playwright-browsers-path";

const SANDBOX_CACHE_PATH = `var/folders/x/${CURSOR_SANDBOX_BROWSER_CACHE_MARKER}/abc/playwright`;
const MISSING_CACHE_PATH = "tmp/bao_missing_playwright_cache_path";
const HOST_DEFAULT_PATH = "tmp/bao_host_ms_playwright";

const pathExists =
  (existing: ReadonlySet<string>) =>
  (browsersPath: string): boolean =>
    existing.has(browsersPath);

describe("playwright browsers path sanitization: detects cursor-sandbox browser caches as polluted", () => {
  test("detects cursor-sandbox browser caches as polluted", () => {
    expect(isPollutedPlaywrightBrowsersPath(SANDBOX_CACHE_PATH, () => true)).toBe(true);
  });
});

describe("playwright browsers path sanitization: detects missing browser cache paths as polluted", () => {
  test("detects missing browser cache paths as polluted", () => {
    expect(isPollutedPlaywrightBrowsersPath(MISSING_CACHE_PATH, () => false)).toBe(true);
  });
});

describe("playwright browsers path sanitization: rewrites polluted browsers path when host cache exists", () => {
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
});

describe("playwright browsers path sanitization: unsets polluted browsers path when host cache is missing", () => {
  test("unsets polluted browsers path when host cache is missing", () => {
    const resolution = resolvePlaywrightBrowsersPath(SANDBOX_CACHE_PATH, {
      pathExists: () => false,
      hostDefaultPath: HOST_DEFAULT_PATH,
    });
    expect(resolution).toEqual({ action: "unset" });
  });
});

describe("playwright browsers path sanitization: derives mac arm64 host platform without reading os.cpus", () => {
  test("derives mac arm64 host platform without reading os.cpus", () => {
    expect(resolvePlaywrightHostPlatformOverride("darwin", "arm64", "25.4.0")).toBe("mac15-arm64");
  });
});

describe("playwright browsers path sanitization: leaves non-mac platforms without a host override", () => {
  test("leaves non-mac platforms without a host override", () => {
    expect(resolvePlaywrightHostPlatformOverride("linux", "x64", "6.8.0")).toBeNull();
  });
});

describe("playwright browsers path sanitization: injects host platform override into automation child env", () => {
  test("injects host platform override into automation child env", () => {
    const env = buildAutomationProcessEnv(
      {},
      {
        pathExists: () => true,
        hostDefaultPath: HOST_DEFAULT_PATH,
      },
      "mac15-arm64",
    );
    expect(env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE).toBe("mac15-arm64");
  });
});

describe("playwright browsers path sanitization: preserves an existing host platform override", () => {
  test("preserves an existing host platform override", () => {
    const env = buildAutomationProcessEnv(
      {
        PLAYWRIGHT_HOST_PLATFORM_OVERRIDE: "mac14-arm64",
      },
      {
        pathExists: () => true,
        hostDefaultPath: HOST_DEFAULT_PATH,
      },
      "mac15-arm64",
    );
    expect(env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE).toBe("mac14-arm64");
  });
});

describe("playwright browsers path sanitization: rewrites polluted browsers path and injects host override together", () => {
  test("rewrites polluted browsers path and injects host override together", () => {
    const env = buildAutomationProcessEnv(
      {
        PLAYWRIGHT_BROWSERS_PATH: SANDBOX_CACHE_PATH,
      },
      {
        pathExists: pathExists(new Set([HOST_DEFAULT_PATH])),
        hostDefaultPath: HOST_DEFAULT_PATH,
      },
      "mac15-arm64",
    );
    expect(env.PLAYWRIGHT_BROWSERS_PATH).toBe(HOST_DEFAULT_PATH);
    expect(env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE).toBe("mac15-arm64");
  });
});

describe("playwright browsers path sanitization: skips host override injection when resolver returns null", () => {
  test("skips host override injection when resolver returns null", () => {
    const env = buildAutomationProcessEnv(
      {},
      {
        pathExists: () => true,
        hostDefaultPath: HOST_DEFAULT_PATH,
      },
      null,
    );
    expect(env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE).toBeUndefined();
  });
});
