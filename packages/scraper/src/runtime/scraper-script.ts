import { scraperScriptEnvelopeSchema } from "@bao/shared/schemas/automation-scripts.schema";
import { DEFAULT_AUTOMATION_SETTINGS } from "@bao/shared/types/settings-defaults";
import { formatAutomationBrowserLaunchFailureMessage } from "@bao/shared/utils/automation-browser-launch-failure";
import { settle } from "@bao/shared/utils/promise";
import type { PortalJobExtractor } from "../providers/provider-types";
import { closeAutomationBrowser, launchAutomationBrowser } from "./browser";
import { automationRuntimeConfig } from "./config";
import { parseScriptInput, writeJsonResult } from "./io";

/**
 * Executes a scraper-style script using the shared Bun/Playwright runtime.
 *
 * @param extractor Portal-specific page extraction function.
 * @returns Process exit code.
 */
export const runPortalScraperScript = async (extractor: PortalJobExtractor): Promise<number> => {
  const inputResult = await parseScriptInput(scraperScriptEnvelopeSchema);
  if (!inputResult.ok) {
    process.stderr.write(`${inputResult.message}\n`);
    return 1;
  }

  const launchResult = await launchAutomationBrowser(DEFAULT_AUTOMATION_SETTINGS);
  if (!launchResult.ok) {
    process.stderr.write(
      `${formatAutomationBrowserLaunchFailureMessage(launchResult.failure)} ${launchResult.failure.causeMessage}\n`,
    );
    return 1;
  }

  const session = launchResult.session;
  const navigationResult = await settle(
    session.page.goto(inputResult.value.sourceUrl, {
      waitUntil: "networkidle",
      timeout: automationRuntimeConfig.navigationTimeoutMs,
    }),
  );
  if (navigationResult.status === "rejected") {
    await closeAutomationBrowser(session);
    process.stderr.write("Unable to load scraper source URL.\n");
    return 1;
  }

  await settle(session.page.waitForTimeout(automationRuntimeConfig.pageSettleDelayMs));

  const rowsResult = await settle(extractor(session.page, inputResult.value.sourceUrl));
  await closeAutomationBrowser(session);

  if (rowsResult.status === "rejected") {
    process.stderr.write("Unable to extract normalized scraper rows.\n");
    return 1;
  }

  writeJsonResult(rowsResult.value);
  return 0;
};
