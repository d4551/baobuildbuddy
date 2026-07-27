const NUM_1000 = 1_000;
const NUM_1200 = 1_200;
const NUM_1800 = 1_800;
const NUM_2000 = 2_000;
const NUM_2500 = 2_500;
const NUM_30000 = 30_000;

/**
 * Portfolio / cover-letter / AI-chat demo surfaces (complexity split).
 */
import type { Page } from "playwright";
import { API_ENDPOINTS } from "../packages/shared/src/constants/endpoints";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import {
  CLIENT_BASE,
  fillFieldOrEditor,
  RE_SEND_SUBMIT,
  SERVER_BASE,
  shot,
  wait,
} from "./browser-record-product-demo-shared";
import { pollUntil } from "./utils/async-control";
import { writeOutput } from "./utils/cli-output";

const RE_ADD_PROJECT = /Add Project|Add Mapping|Add/i;
const RE_TITLE = /title/i;
const RE_DESCRIPTION_BIO = /description|bio/i;
const RE_TECHNOLOGY = /technolog/i;
const RE_ADD_TECHNOLOGY = /add technology|add/i;
const RE_SAVE_CREATE_PROJECT = /Save|Create|Add Project/i;
const RE_OPEN_COVER_LETTER_DIALOG = /Open cover-letter generation dialog/i;
const RE_SUBMIT_COVER_LETTER = /^Generate cover letter$/i;
const RE_COMPANY = /company/i;
const RE_POSITION_ROLE = /position|role/i;
const RE_JOB_DESCRIPTION = /job description|description/i;
const RE_CHAT_BUSY = /Generating a response|Generating response/i;

const COVER_LETTER_TIMEOUT_MS = 900_000;
const CHAT_REPLY_TIMEOUT_MS = 900_000;

const countCoverLettersViaApi = async (): Promise<number> => {
  const response = await fetch(new URL(API_ENDPOINTS.coverLetters, SERVER_BASE).toString(), {
    signal: AbortSignal.timeout(NUM_30000),
  });
  if (!response.ok) {
    throw new Error(`GET ${API_ENDPOINTS.coverLetters} → ${String(response.status)}`);
  }
  const body: unknown = await response.json();
  return Array.isArray(body) ? body.length : 0;
};

/**
 * Generation is a live model call; screenshotting on the shared `wait()` helper
 * captures the spinner rather than the result, and never fails when nothing lands.
 */
const waitForCoverLetterPersisted = async (before: number): Promise<void> => {
  const created = await pollUntil({
    probe: async () => ((await countCoverLettersViaApi()) > before ? true : null),
    intervalMs: NUM_2000,
    timeoutMs: COVER_LETTER_TIMEOUT_MS,
    sleep: (milliseconds) => Bun.sleep(milliseconds),
  });
  if (!created) {
    throw new Error(
      `Cover letter generation persisted nothing (still ${String(before)} after submit).`,
    );
  }
  await writeOutput(`cover letter persisted (count ${String(before)} → ${String(before + 1)})`);
};

export const demoPortfolio = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.portfolio}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, NUM_1800);
  await shot(page, "07-portfolio-empty-or-list");
  const add = page.getByRole("button", { name: RE_ADD_PROJECT }).first();
  await settle(add.click({ timeout: 8_000 }));
  await wait(page, NUM_1000);
  await settle(
    page
      .getByLabel(RE_TITLE)
      .or(page.locator('input[name*="title" i]'))
      .first()
      .fill("Combat Sandbox Prototype"),
  );
  await settle(
    fillFieldOrEditor(
      page,
      page.getByLabel(RE_DESCRIPTION_BIO).or(page.locator("textarea")).first(),
      "Encounter pacing lab for co-op readability — Unreal + TypeScript tooling, featured on portfolio.",
    ),
  );
  const tech = page
    .getByLabel(RE_TECHNOLOGY)
    .or(page.locator('input[placeholder*="tech" i]'))
    .first();
  if ((await tech.count()) > 0) {
    await settle(tech.fill("Unreal Engine"));
    await settle(page.getByRole("button", { name: RE_ADD_TECHNOLOGY }).first().click());
  }
  await settle(
    page.getByRole("button", { name: RE_SAVE_CREATE_PROJECT }).last().click({ timeout: 8_000 }),
  );
  await wait(page, NUM_2500);
  await shot(page, "08-portfolio-project-added");
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.portfolioPreview}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, NUM_2000);
  await shot(page, "09-portfolio-preview-styled");
};

export const demoCoverLetter = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.coverLetter}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, NUM_1800);
  await shot(page, "10-cover-letter-hub");
  // The page header only renders its Generate button once the catalog has loaded
  // (the empty state owns the action until then), so target the affordance both
  // states share by aria-label. Matching on visible text instead resolves to the
  // dialog's own disabled submit whenever the list is still in flight.
  const lettersBefore = await countCoverLettersViaApi();
  const openDialog = page.getByRole("button", { name: RE_OPEN_COVER_LETTER_DIALOG }).first();
  await openDialog.waitFor({ state: "visible", timeout: NUM_30000 });
  await openDialog.click({ timeout: 10_000 });
  await wait(page, NUM_1200);
  await page.getByLabel(RE_COMPANY).first().fill("Hitmarker Studios");
  await page.getByLabel(RE_POSITION_ROLE).first().fill("Gameplay Programmer");
  const jobDesc = page.getByLabel(RE_JOB_DESCRIPTION).first();
  if ((await jobDesc.count()) > 0) {
    await fillFieldOrEditor(
      page,
      jobDesc,
      "Looking for a gameplay programmer to own combat systems, work with design, and ship live updates.",
    );
  }
  await page
    .getByRole("button", { name: RE_SUBMIT_COVER_LETTER })
    .last()
    .click({ timeout: 10_000 });
  await waitForCoverLetterPersisted(lettersBefore);
  await shot(page, "11-cover-letter-generated");
  const card = page.locator("main a.card, main .card a, main a[href*='cover-letter']").first();
  if ((await card.count()) > 0) {
    await card.click();
    await wait(page, NUM_2000);
    await shot(page, "12-cover-letter-detail-styled");
  }
};

export const demoAiChat = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.aiChat}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, NUM_2000);
  await shot(page, "13-ai-chat");
  await page
    .locator("main textarea")
    .first()
    .fill(
      "Help me prepare a 60-second pitch for a gameplay programmer role focused on combat systems.",
    );
  await page.locator("button", { hasText: RE_SEND_SUBMIT }).first().click({ timeout: 8_000 });
  // Capture the reply, not the spinner: the chat streams, so poll the busy
  // status away before screenshotting rather than relying on `wait()`, which
  // resolves as soon as the document is loaded.
  const busyStatus = page.getByText(RE_CHAT_BUSY).first();
  await pollUntil({
    probe: async () => ((await busyStatus.count()) === 0 ? true : null),
    intervalMs: NUM_2000,
    timeoutMs: CHAT_REPLY_TIMEOUT_MS,
    sleep: (milliseconds) => Bun.sleep(milliseconds),
  });
  await shot(page, "14-ai-chat-response");
};
