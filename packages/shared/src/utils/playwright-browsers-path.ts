import { join } from "node:path";

/** Marker injected by Cursor agent sandboxes into incomplete Playwright caches. */
export const CURSOR_SANDBOX_BROWSER_CACHE_MARKER = "cursor-sandbox-cache";

export type PlaywrightBrowsersPathDeps = {
  pathExists: (browsersPath: string) => boolean;
  hostDefaultPath: string;
};

/**
 * Host Playwright browser cache path for the given platform + home directory.
 */
export const defaultPlaywrightBrowsersPathForPlatform = (
  platform: NodeJS.Platform,
  homeDirectory: string,
): string => {
  if (platform === "darwin") {
    return join(homeDirectory, "Library/Caches/ms-playwright");
  }
  return join(homeDirectory, ".cache/ms-playwright");
};

/**
 * Returns true when PLAYWRIGHT_BROWSERS_PATH points at an incomplete or
 * agent-sandbox cache that cannot launch Chromium headless shell.
 */
export const isPollutedPlaywrightBrowsersPath = (
  browsersPath: string,
  pathExists: (browsersPath: string) => boolean,
): boolean => {
  if (browsersPath.includes(CURSOR_SANDBOX_BROWSER_CACHE_MARKER)) {
    return true;
  }
  return !pathExists(browsersPath);
};

export type PlaywrightBrowsersPathResolution =
  | { readonly action: "keep" }
  | { readonly action: "set"; readonly value: string }
  | { readonly action: "unset" };

/**
 * Resolves a configured Playwright browsers path to keep, rewrite, or unset.
 */
export const resolvePlaywrightBrowsersPath = (
  configured: string | undefined,
  deps: PlaywrightBrowsersPathDeps,
): PlaywrightBrowsersPathResolution => {
  if (!configured || !isPollutedPlaywrightBrowsersPath(configured, deps.pathExists)) {
    return { action: "keep" };
  }

  if (deps.pathExists(deps.hostDefaultPath)) {
    return { action: "set", value: deps.hostDefaultPath };
  }

  return { action: "unset" };
};

/**
 * Playwright reads `PLAYWRIGHT_HOST_PLATFORM_OVERRIDE` before calling `os.cpus()`.
 * Agent sandboxes often deny `os.cpus()`; derive the same mac host tag from
 * platform/arch/release without CPU model inspection.
 */
export const resolvePlaywrightHostPlatformOverride = (
  platformName: NodeJS.Platform,
  architecture: string,
  kernelRelease: string,
): string | null => {
  if (platformName !== "darwin") {
    return null;
  }

  const major = Number.parseInt(kernelRelease.split(".")[0] ?? "", 10);
  if (!Number.isFinite(major)) {
    return null;
  }

  const LAST_STABLE_MACOS_MAJOR_VERSION = 15;
  let macVersion = `mac${String(Math.min(major - 9, LAST_STABLE_MACOS_MAJOR_VERSION))}`;
  if (major < 18) {
    macVersion = "mac10.13";
  } else if (major === 18) {
    macVersion = "mac10.14";
  } else if (major === 19) {
    macVersion = "mac10.15";
  }

  return architecture === "arm64" ? `${macVersion}-arm64` : macVersion;
};

/**
 * Builds a child-process env with a non-polluted Playwright browsers path.
 * Callers supply `baseEnv` and filesystem deps; no direct process.env access.
 */
export const buildAutomationProcessEnv = (
  baseEnv: NodeJS.ProcessEnv,
  deps: PlaywrightBrowsersPathDeps,
  hostPlatformOverride: string | null = null,
): NodeJS.ProcessEnv => {
  const env = { ...baseEnv };
  const resolution = resolvePlaywrightBrowsersPath(env.PLAYWRIGHT_BROWSERS_PATH, deps);
  if (resolution.action === "set") {
    env.PLAYWRIGHT_BROWSERS_PATH = resolution.value;
  } else if (resolution.action === "unset") {
    delete env.PLAYWRIGHT_BROWSERS_PATH;
  }

  if (hostPlatformOverride && !env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE) {
    env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE = hostPlatformOverride;
  }

  return env;
};
