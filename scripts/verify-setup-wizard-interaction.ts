#!/usr/bin/env bun
/**
 * Playwright interaction proof for the setup wizard.
 *
 * Drives the wizard with real keystrokes (page.type) and real clicks
 * (page.click) — the same DOM events a human produces. Verifies Vue
 * reactivity binds the typed name and advances steps on click.
 *
 * Run: bun run scripts/verify-setup-wizard-interaction.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const CLIENT_BASE = "http://127.0.0.1:3001";
const PROOF_DIR = join(scriptDir, "..", "docs", "ssot-ledger", "setup-wizard-proof");
mkdirSync(PROOF_DIR, { recursive: true });
const NAV_TIMEOUT_MS = 30_000;
const SELECTOR_TIMEOUT_MS = 10_000;
const TYPE_DELAY_MS = 30;
const STEP2_INDICATOR_SELECTOR = "li.step:nth-child(2).step-primary";
const STEP3_INDICATOR_SELECTOR = "li.step:nth-child(3).step-primary";
const results: string[] = [];
const record = (msg: string): void => {
  results.push(msg);
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors: string[] = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

await page.goto(`${CLIENT_BASE}/setup`, {
  waitUntil: "domcontentloaded",
  timeout: NAV_TIMEOUT_MS,
});
// Web-first wait: button presence proves Vue hydrated and attached listeners
await page.waitForSelector("button.btn", { timeout: SELECTOR_TIMEOUT_MS });

const step1Heading = await page.textContent("h2");
record(`step1-heading: ${step1Heading ?? "null"}`);

// Real keystroke typing — dispatches keydown/keypress/input/keyup per char
await page.click("input.input");
await page.type("input.input", "Brandon", { delay: TYPE_DELAY_MS });
const nameValue = await page.inputValue("input.input");
record(`name-value-after-type: ${nameValue}`);

// Real click — dispatches mousedown/mouseup/click
const buttonCount = await page.locator("button.btn").count();
record(`button-count: ${String(buttonCount)}`);
const buttonText = await page.textContent("button.btn");
record(`button-text: ${buttonText ?? "null"}`);
await page.click("button.btn");
// Web-first wait: step 2 indicator proves the step advanced
await page.waitForSelector(STEP2_INDICATOR_SELECTOR, { timeout: SELECTOR_TIMEOUT_MS });

const step2Heading = await page.textContent("h2");
record(`step2-heading: ${step2Heading ?? "null"}`);
const step2Active = await page.locator("li.step.step-primary").count();
record(`step-primary-count: ${String(step2Active)}`);

await page.screenshot({ path: join(PROOF_DIR, "step2.png"), fullPage: true });
record(`screenshot-step2: ${join(PROOF_DIR, "step2.png")}`);

// Advance to step 3 — click the forward button on step 2
const step2ButtonCount = await page.locator("button.btn").count();
record(`step2-button-count: ${String(step2ButtonCount)}`);
const lastButtonText = await page.locator("button.btn").last().textContent();
record(`step2-last-button-text: ${lastButtonText ?? "null"}`);
await page.locator("button.btn").last().click();
// Web-first wait: step 3 indicator proves the step advanced
await page.waitForSelector(STEP3_INDICATOR_SELECTOR, { timeout: SELECTOR_TIMEOUT_MS });

const step3Heading = await page.textContent("h2");
record(`step3-heading: ${step3Heading ?? "null"}`);
const step3Active = await page.locator("li.step.step-primary").count();
record(`step3-primary-count: ${String(step3Active)}`);

await page.screenshot({ path: join(PROOF_DIR, "step3.png"), fullPage: true });
record(`screenshot-step3: ${join(PROOF_DIR, "step3.png")}`);

// Complete the wizard — click the final action button on step 3
const step3ButtonCount = await page.locator("button.btn").count();
record(`step3-button-count: ${String(step3ButtonCount)}`);
const completeButtonText = await page.locator("button.btn").last().textContent();
record(`step3-last-button-text: ${completeButtonText ?? "null"}`);
await page.locator("button.btn").last().click();

const finalUrl = page.url();
record(`final-url: ${finalUrl}`);
const finalHeading = await page.textContent("h1").then(
  (text) => text ?? "null",
  () => "null",
);
record(`final-h1: ${finalHeading}`);

await page.screenshot({ path: join(PROOF_DIR, "complete.png"), fullPage: true });
record(`screenshot-complete: ${join(PROOF_DIR, "complete.png")}`);

record(`console-errors: ${String(consoleErrors.length)}`);
for (const err of consoleErrors) {
  record(`  console-error: ${err}`);
}

await browser.close();

const output = results.join("\n");
writeFileSync(join(PROOF_DIR, "results.txt"), output);

if (consoleErrors.length > 0) {
  throw new Error(
    `Setup wizard interaction proof failed: ${consoleErrors.length} console error(s)`,
  );
}
