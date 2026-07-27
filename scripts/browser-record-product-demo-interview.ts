const NUM_12 = 12;
const NUM_1000 = 1_000;
const NUM_120000 = 120_000;
const NUM_1500 = 1_500;
const NUM_2000 = 2_000;
const NUM_250 = 250;
const NUM_40 = 40;
const NUM_45000 = 45_000;
const NUM_800 = 800;

/**
 * Interview demo steps (complexity split).
 */
import type { Page } from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import {
  CLIENT_BASE,
  RE_OPEN_STUDIO_SELECTOR,
  RE_RIOT_GAMES,
  RE_START_INTERVIEW_SESSION,
  RE_STUDIO_DRILL,
  RE_SUBMIT_RESPONSE,
  RE_VOICE_MODE,
  shot,
  wait,
  waitForEnabled,
} from "./browser-record-product-demo-shared";
import { pollUntil } from "./utils/async-control";

const openInterviewConfig = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.interview}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, NUM_2000);
  await shot(page, "15-interview-hub");
  const studio = page.locator("button", { hasText: RE_STUDIO_DRILL }).first();
  await studio.click({ timeout: 10_000 });
  await wait(page, NUM_1500);
  await shot(page, "16-interview-config");
};

const configureStudioAndVoice = async (page: Page): Promise<void> => {
  const studioToggle = page.getByRole("button", { name: RE_OPEN_STUDIO_SELECTOR }).first();
  await studioToggle.waitFor({ state: "visible", timeout: 10_000 });
  await studioToggle.click({ timeout: 8_000 });
  const studioOption = page
    .getByRole("option", { name: RE_RIOT_GAMES })
    .or(page.getByRole("option").nth(1))
    .first();
  await studioOption.waitFor({ state: "visible", timeout: 10_000 });
  await studioOption.click({ timeout: 8_000 });
  await wait(page, NUM_800);
  const voiceToggle = page.getByLabel(RE_VOICE_MODE).first();
  if ((await voiceToggle.count()) > 0) {
    await settle(voiceToggle.check());
  }
};

const INTERVIEW_ANSWER =
  "In my last role I owned encounter pacing for a co-op combat sandbox. I partnered with design to define readability goals, shipped iteration tooling that cut balance cycles by half, and validated changes with playtests before live deploy.";

/**
 * Natural-conversation sessions generate one question at a time, and
 * `InterviewChat` clears `currentResponse` whenever the composer is disabled.
 * Typing before the composer is ready therefore loses the answer and leaves
 * "Submit & Next" disabled, so wait for each gate on a real clock — the shared
 * `wait()` helper only bounds a load-state check and returns immediately.
 */
const startAndAnswerInterview = async (page: Page): Promise<void> => {
  const start = page.getByRole("button", { name: RE_START_INTERVIEW_SESSION }).first();
  await start.waitFor({ state: "visible", timeout: 10_000 });
  await waitForEnabled(page, start, NUM_40, NUM_250);
  if (await start.isDisabled()) return;
  await start.click({ timeout: 8_000 });
  await shot(page, "17-interview-session");

  const response = page.locator("textarea:visible").first();
  await response.waitFor({ state: "visible", timeout: NUM_120000 });
  const composerReady = await pollUntil({
    probe: async () => ((await response.isDisabled()) ? null : true),
    intervalMs: NUM_1000,
    timeoutMs: NUM_120000,
    sleep: (milliseconds) => Bun.sleep(milliseconds),
  });
  if (!composerReady) {
    throw new Error("Interview composer stayed disabled — no question was ready to answer.");
  }

  if ((await response.inputValue()).trim().length < NUM_12) {
    await response.fill(INTERVIEW_ANSWER);
  }
  const submit = page.locator("button", { hasText: RE_SUBMIT_RESPONSE }).first();
  const submitReady = await pollUntil({
    probe: async () => ((await submit.isDisabled()) ? null : true),
    intervalMs: NUM_1000,
    timeoutMs: NUM_45000,
    sleep: (milliseconds) => Bun.sleep(milliseconds),
  });
  if (!submitReady) {
    await shot(page, "18-interview-submit-blocked");
    throw new Error("Interview submit stayed disabled after typing an answer.");
  }
  await submit.click({ timeout: 8_000 });
  await Bun.sleep(NUM_45000);
  await shot(page, "18-interview-feedback");
};

export const demoInterview = async (page: Page): Promise<void> => {
  await openInterviewConfig(page);
  await configureStudioAndVoice(page);
  await startAndAnswerInterview(page);
};
