const NUM_1000 = 1_000;
const NUM_1200 = 1_200;
const NUM_1800 = 1_800;
const NUM_2000 = 2_000;
const NUM_2500 = 2_500;
const NUM_45000 = 45_000;
/**
 * Portfolio / cover-letter / AI-chat demo surfaces (complexity split).
 */
import type { Page } from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import { CLIENT_BASE, RE_SEND_SUBMIT, shot, wait } from "./browser-record-product-demo-shared";

const RE_ADD_PROJECT = /Add Project|Add Mapping|Add/i;
const RE_TITLE = /title/i;
const RE_DESCRIPTION_BIO = /description|bio/i;
const RE_TECHNOLOGY = /technolog/i;
const RE_ADD_TECHNOLOGY = /add technology|add/i;
const RE_SAVE_CREATE_PROJECT = /Save|Create|Add Project/i;
const RE_GENERATE_COVER_LETTER = /Generate Cover Letter|Generate/i;
const RE_COMPANY = /company/i;
const RE_POSITION_ROLE = /position|role/i;
const RE_JOB_DESCRIPTION = /job description|description/i;
const RE_GENERATE_CREATE_SUBMIT = /Generate|Create|Submit/i;

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
    page
      .getByLabel(RE_DESCRIPTION_BIO)
      .or(page.locator("textarea"))
      .first()
      .fill(
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
  await page
    .locator("button", { hasText: RE_GENERATE_COVER_LETTER })
    .first()
    .click({ timeout: 10_000 });
  await wait(page, NUM_1200);
  await page.getByLabel(RE_COMPANY).first().fill("Hitmarker Studios");
  await page.getByLabel(RE_POSITION_ROLE).first().fill("Gameplay Programmer");
  const jobDesc = page.getByLabel(RE_JOB_DESCRIPTION).first();
  if ((await jobDesc.count()) > 0) {
    await jobDesc.fill(
      "Looking for a gameplay programmer to own combat systems, work with design, and ship live updates.",
    );
  }
  await page
    .locator("button", { hasText: RE_GENERATE_CREATE_SUBMIT })
    .last()
    .click({ timeout: 10_000 });
  await wait(page, NUM_45000);
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
  await wait(page, NUM_45000);
  await shot(page, "14-ai-chat-response");
};
