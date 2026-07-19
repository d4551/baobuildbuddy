import type { AutomationBrowserLaunchFailureDetails } from "@bao/shared/schemas/error-envelope.schema";
import type { AutomationSettings } from "@bao/shared/types/settings-contracts";
import { DEFAULT_AUTOMATION_SETTINGS } from "@bao/shared/types/settings-defaults";
import { classifyAutomationBrowserLaunchFailure } from "@bao/shared/utils/automation-browser-launch-failure";
import { settle } from "@bao/shared/utils/promise";
import type { Browser, BrowserContext, Page } from "playwright";
import {
  automationRuntimeConfig,
  buildAutomationProcessEnv,
  sanitizePlaywrightBrowsersPathEnv,
} from "./config";

/**
 * Browser context bundle returned by Bun-based automation scripts.
 */
export interface AutomationBrowserSession {
  /** Chromium browser instance. */
  readonly browser: Browser;
  /** Browser context used for the current run. */
  readonly context: BrowserContext;
  /** Active page used for script execution. */
  readonly page: Page;
}

export type LaunchAutomationBrowserResult =
  | { readonly ok: true; readonly session: AutomationBrowserSession }
  | { readonly ok: false; readonly failure: AutomationBrowserLaunchFailureDetails };

const createContextOptions = () => ({
  locale: DEFAULT_AUTOMATION_SETTINGS.speech.locale,
});

const rejectLaunch = (
  reason: Error,
  stage: AutomationBrowserLaunchFailureDetails["stage"],
): LaunchAutomationBrowserResult => ({
  ok: false,
  failure: classifyAutomationBrowserLaunchFailure(
    reason,
    stage,
    buildAutomationProcessEnv().PLAYWRIGHT_BROWSERS_PATH,
  ),
});

/**
 * Launches a Playwright Chromium session using typed automation settings.
 *
 * @param settings Automation settings persisted by the server.
 * @returns Typed success session or classified launch failure (never silent null).
 */
export const launchAutomationBrowser = async (
  settings: AutomationSettings,
): Promise<LaunchAutomationBrowserResult> => {
  // Sanitize before dynamic import so Playwright registry resolution sees a
  // host-usable browsers path (agent sandboxes often inject a stale cache).
  sanitizePlaywrightBrowsersPathEnv();
  const { chromium } = await import("playwright");

  const browserResult = await settle(
    chromium.launch({
      headless: settings.headless,
    }),
  );
  if (browserResult.status === "rejected") {
    return rejectLaunch(browserResult.reason, "launch");
  }

  const browser = browserResult.value;
  const contextResult = await settle(browser.newContext(createContextOptions()));
  if (contextResult.status === "rejected") {
    await settle(browser.close());
    return rejectLaunch(contextResult.reason, "context");
  }

  const context = contextResult.value;
  const pageResult = await settle(context.newPage());
  if (pageResult.status === "rejected") {
    await settle(context.close());
    await settle(browser.close());
    return rejectLaunch(pageResult.reason, "page");
  }

  const page = pageResult.value;
  page.setDefaultTimeout(
    Math.max(settings.defaultTimeout * 1_000, automationRuntimeConfig.navigationTimeoutMs),
  );

  return {
    ok: true,
    session: {
      browser,
      context,
      page,
    },
  };
};

/**
 * Closes a browser session without using control-flow exceptions.
 *
 * @param session Browser session returned by `launchAutomationBrowser`.
 */
export const closeAutomationBrowser = async (
  session: AutomationBrowserSession | null,
): Promise<void> => {
  if (!session) {
    return;
  }

  await settle(session.context.close());
  await settle(session.browser.close());
};
