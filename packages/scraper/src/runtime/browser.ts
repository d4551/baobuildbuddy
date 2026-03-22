import { type AutomationSettings, DEFAULT_AUTOMATION_SETTINGS, settle } from "@bao/shared";
import { type Browser, type BrowserContext, chromium, type Page } from "playwright";
import { automationRuntimeConfig } from "./config";

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

const createContextOptions = () => ({
  locale: DEFAULT_AUTOMATION_SETTINGS.speech.locale,
});

/**
 * Launches a Playwright Chromium session using typed automation settings.
 *
 * @param settings Automation settings persisted by the server.
 * @returns Browser session or `null` when launch fails.
 */
export const launchAutomationBrowser = async (
  settings: AutomationSettings,
): Promise<AutomationBrowserSession | null> => {
  const browserResult = await settle(
    chromium.launch({
      headless: settings.headless,
    }),
  );
  if (browserResult.status === "rejected") {
    return null;
  }

  const browser = browserResult.value;
  const contextResult = await settle(browser.newContext(createContextOptions()));
  if (contextResult.status === "rejected") {
    await settle(browser.close());
    return null;
  }

  const context = contextResult.value;
  const pageResult = await settle(context.newPage());
  if (pageResult.status === "rejected") {
    await settle(context.close());
    await settle(browser.close());
    return null;
  }

  const page = pageResult.value;
  page.setDefaultTimeout(
    Math.max(settings.defaultTimeout * 1_000, automationRuntimeConfig.navigationTimeoutMs),
  );

  return {
    browser,
    context,
    page,
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
