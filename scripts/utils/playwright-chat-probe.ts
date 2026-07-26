/**
 * Canonical Playwright probe: scans chat bubbles for a nonce token.
 * pollUntil-ready — returns true on hit, null to keep polling.
 */
import type { Page } from "playwright";

export const createChatNonceProbe =
  (page: Page, bubbleLocator: string, nonce: string) =>
  async (): Promise<true | null> => {
    const bubbles = page.locator(bubbleLocator);
    const count = await bubbles.count();
    const texts = await Promise.all(
      Array.from({ length: count }, (_, index) => bubbles.nth(index).innerText()),
    );
    return texts.some((text) => text.trim().includes(nonce)) ? true : null;
  };
