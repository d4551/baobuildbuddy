const NUM_12 = 12;
const NUM_1500 = 1_500;
const NUM_2000 = 2_000;
const NUM_250 = 250;
const NUM_3000 = 3_000;
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

const startAndAnswerInterview = async (page: Page): Promise<void> => {
  const start = page.getByRole("button", { name: RE_START_INTERVIEW_SESSION }).first();
  await start.waitFor({ state: "visible", timeout: 10_000 });
  await waitForEnabled(page, start, NUM_40, NUM_250);
  if (await start.isDisabled()) return;
  await start.click({ timeout: 8_000 });
  await wait(page, NUM_3000);
  await shot(page, "17-interview-session");
  const response = page.locator("textarea:visible").first();
  const current = (await response.inputValue()).trim();
  if (current.length < NUM_12) {
    await response.fill(
      "In my last role I owned encounter pacing for a co-op combat sandbox. I partnered with design to define readability goals, shipped iteration tooling that cut balance cycles by half, and validated changes with playtests before live deploy.",
    );
  }
  const submit = page.locator("button", { hasText: RE_SUBMIT_RESPONSE }).first();
  await submit.click({ timeout: 8_000 });
  await wait(page, NUM_45000);
  await shot(page, "18-interview-feedback");
};

export const demoInterview = async (page: Page): Promise<void> => {
  await openInterviewConfig(page);
  await configureStudioAndVoice(page);
  await startAndAnswerInterview(page);
};
