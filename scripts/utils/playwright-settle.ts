/**
 * Playwright settle helpers that avoid waitForTimeout / networkidle
 * (both banned under nursery Playwright rules).
 */
import type { Page } from "playwright";

/**
 * Soft-settle: wait for body visibility then DOMContentLoaded, ignoring timeouts.
 * Replaces page.waitForTimeout(ms) in proof/record scripts.
 */
export const settlePage = async (page: Page, timeoutMs: number): Promise<void> => {
  await page
    .locator("body")
    .waitFor({ state: "visible", timeout: timeoutMs })
    .then(
      () => undefined,
      () => undefined,
    );
  await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).then(
    () => undefined,
    () => undefined,
  );
};
