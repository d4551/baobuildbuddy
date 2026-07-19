import { existsSync } from "node:fs";
import { arch, homedir, platform, release } from "node:os";
import { DECIMAL_RADIX } from "@bao/shared/constants/client-config";
import { DEFAULT_AUTOMATION_SETTINGS } from "@bao/shared/types/settings-defaults";
import {
  buildAutomationProcessEnv as buildAutomationProcessEnvFromShared,
  defaultPlaywrightBrowsersPathForPlatform,
  resolvePlaywrightBrowsersPath,
  resolvePlaywrightHostPlatformOverride,
  type PlaywrightBrowsersPathDeps,
} from "@bao/shared/utils/playwright-browsers-path";

const playwrightBrowsersPathDeps = (): PlaywrightBrowsersPathDeps => ({
  pathExists: existsSync,
  hostDefaultPath: defaultPlaywrightBrowsersPathForPlatform(process.platform, homedir()),
});

const resolveHostPlatformOverride = (): string | null =>
  resolvePlaywrightHostPlatformOverride(platform(), arch(), release());

/**
 * Sanitizes process.env Playwright browsers path and host-platform override
 * before Playwright resolves its registry. Prefer a host-usable cache over an
 * incomplete agent cache; avoid os.cpus() in agent sandboxes.
 */
export const sanitizePlaywrightBrowsersPathEnv = (): void => {
  const resolution = resolvePlaywrightBrowsersPath(
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    playwrightBrowsersPathDeps(),
  );
  if (resolution.action === "set") {
    process.env.PLAYWRIGHT_BROWSERS_PATH = resolution.value;
  } else if (resolution.action === "unset") {
    delete process.env.PLAYWRIGHT_BROWSERS_PATH;
  }

  const hostOverride = resolveHostPlatformOverride();
  if (hostOverride && !process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE) {
    process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE = hostOverride;
  }
};

/**
 * Builds a child-process env with a non-polluted Playwright browsers path
 * and PLAYWRIGHT_HOST_PLATFORM_OVERRIDE when missing.
 */
export const buildAutomationProcessEnv = (
  baseEnv: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv =>
  buildAutomationProcessEnvFromShared(
    baseEnv,
    playwrightBrowsersPathDeps(),
    resolveHostPlatformOverride(),
  );

const parsePositiveInt = (rawValue: string | undefined, defaultValue: number): number => {
  if (!rawValue) {
    return defaultValue;
  }

  const parsedValue = Number.parseInt(rawValue, DECIMAL_RADIX);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : defaultValue;
};

/**
 * Typed runtime configuration for Bun-based scraper and job-apply scripts.
 */
export interface AutomationRuntimeConfig {
  /** Default timeout applied to scraper navigation. */
  readonly navigationTimeoutMs: number;
  /** Small delay after navigation to allow lazy DOM hydration. */
  readonly pageSettleDelayMs: number;
  /** Delay after follow-up navigation in ATS flows. */
  readonly secondaryNavigationDelayMs: number;
  /** Delay after submit actions before verification runs. */
  readonly postSubmitDelayMs: number;
  /** Enables deterministic verification runs instead of live automation. */
  readonly enableAutomationVerify: boolean;
}

/**
 * Shared runtime defaults with environment overrides for automation scripts.
 */
export const automationRuntimeConfig: AutomationRuntimeConfig = {
  navigationTimeoutMs: parsePositiveInt(
    Bun.env.AUTOMATION_NAVIGATION_TIMEOUT_MS,
    DEFAULT_AUTOMATION_SETTINGS.defaultTimeout * 1_000,
  ),
  pageSettleDelayMs: parsePositiveInt(Bun.env.AUTOMATION_PAGE_SETTLE_DELAY_MS, 2_000),
  secondaryNavigationDelayMs: parsePositiveInt(
    Bun.env.AUTOMATION_SECONDARY_NAVIGATION_DELAY_MS,
    2_000,
  ),
  postSubmitDelayMs: parsePositiveInt(Bun.env.AUTOMATION_POST_SUBMIT_DELAY_MS, 3_000),
  get enableAutomationVerify(): boolean {
    return Bun.env.BAO_ENABLE_AUTOMATION_VERIFY === "true";
  },
};
