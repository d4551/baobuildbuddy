/**
 * Regression locks against LDL false-greens in headed capability proofs.
 * Asserts fail-closed contracts in source (not "OK" theater).
 */
import { describe, expect, test } from "bun:test";

const TTS_TAUTOLOGY_PATTERN = /synth\.speaking\s*\|\|\s*voices\.length\s*>=\s*0/;
const SWALLOWED_LOADSTATE_PATTERN = /waitForLoadState\([\s\S]*?\)\.then\(\s*\(\)\s*=>\s*undefined/;

const readScript = async (name: string): Promise<string> =>
  Bun.file(new URL(`./${name}`, import.meta.url)).text();

describe("browser-proof-rpa-live honesty", () => {
  test("requires run-count delta and fails closed when job-apply fails", async () => {
    const source = await readScript("browser-proof-rpa-live.ts");
    expect(source.includes("afterCount > beforeCount")).toBe(true);
    expect(source.includes("afterCount > 0 ||")).toBe(false);
    expect(source.includes("ok: true")).toBe(false);
    expect(source.includes("jobApplyOk")).toBe(true);
    expect(source.includes("browser-proof-rpa-live FAIL")).toBe(true);
  });
});

describe("browser-honest-capabilities-proof honesty", () => {
  test("TTS timeout is not a voices.length tautology; scrape requires enabled Run", async () => {
    const source = await readScript("browser-honest-capabilities-proof.ts");
    // Ban the tautology expression (comments may mention it).
    expect(TTS_TAUTOLOGY_PATTERN.test(source)).toBe(false);
    expect(source.includes("finish(synth.speaking)")).toBe(true);
    expect(source.includes("No enabled scraper Run button")).toBe(true);
    expect(source.includes("portalToggle.click")).toBe(true);
    // wait() must not swallow readiness failures with empty catch handlers
    expect(SWALLOWED_LOADSTATE_PATTERN.test(source)).toBe(false);
  });
});

describe("browser smoke/burndown secondary route coverage", () => {
  test("smoke + burndown include secondary APP_ROUTES", async () => {
    const smoke = await readScript("browser-visual-smoke.ts");
    const burndown = await readScript("browser-interaction-burndown.ts");
    for (const token of [
      "resumeBuild",
      "resumePreview",
      "portfolioPreview",
      "interviewHistory",
      "interviewSession",
      "skillsPathways",
      "studiosAnalytics",
    ] as const) {
      expect(smoke.includes(token)).toBe(true);
      expect(burndown.includes(token)).toBe(true);
    }
  });
});

describe("browser-record-visual-proof-helpers honesty", () => {
  test("theme proof waits for data-theme change; waitForPageReady is fail-closed", async () => {
    const source = await readScript("browser-record-visual-proof-helpers.ts");
    expect(source.includes("waitForFunction")).toBe(true);
    expect(source.includes("Theme missing before flip")).toBe(true);
    expect(source.includes("__vue_app__")).toBe(true);
    expect(SWALLOWED_LOADSTATE_PATTERN.test(source)).toBe(false);
    expect(source.includes('waitForLoadState("networkidle"')).toBe(false);
  });
});
