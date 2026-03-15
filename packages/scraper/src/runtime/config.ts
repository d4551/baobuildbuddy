import { DECIMAL_RADIX, DEFAULT_AUTOMATION_SETTINGS } from "@bao/shared";

const parsePositiveInt = (rawValue: string | undefined, fallbackValue: number): number => {
  if (!rawValue) {
    return fallbackValue;
  }

  const parsedValue = Number.parseInt(rawValue, DECIMAL_RADIX);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallbackValue;
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
};
