import { describe, expect, test } from "bun:test";
import {
  buildAutomationProcessEnv,
  isPollutedPlaywrightBrowsersPath,
} from "@bao/shared/utils/playwright-browsers-path";

describe("scraper uses shared playwright browsers path SSOT", () => {
  test("pollution helpers remain importable for runtime consumers", () => {
    expect(
      isPollutedPlaywrightBrowsersPath("/var/folders/x/cursor-sandbox-cache/abc/playwright"),
    ).toBe(true);
    const polluted = "/tmp/cursor-sandbox-cache/playwright-missing";
    const env = buildAutomationProcessEnv({
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: polluted,
    });
    expect(env.PLAYWRIGHT_BROWSERS_PATH).not.toBe(polluted);
  });
});
