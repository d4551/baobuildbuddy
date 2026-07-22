const NUM_1200 = 1_200;
const NUM_15000 = 15_000;
const NUM_1800 = 1_800;
const NUM_20 = 20;
const NUM_200 = 200;
const NUM_2000 = 2_000;
const NUM_250 = 250;
const NUM_400 = 400;
const NUM_600 = 600;
/**
 * Resume guided-build demo steps (complexity split).
 */
import type { Page } from "playwright";
import { API_ENDPOINTS } from "../packages/shared/src/constants/endpoints";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import {
  CLIENT_BASE,
  RE_EDIT,
  RE_EXPORT,
  RE_GENERATE_QUESTIONS,
  RE_NEXT,
  RE_PDF,
  RE_QUESTION_PROGRESS,
  RE_SYNTHESIZE_RESUME,
  shot,
  wait,
  waitForEnabled,
} from "./browser-record-product-demo-shared";
import { writeOutput } from "./utils/cli-output";

const completeResumeQuestionSteps = async (page: Page, step = 0): Promise<void> => {
  if (step >= 10) return;
  const visibleAnswer = page.locator("textarea:visible").first();
  if ((await visibleAnswer.count()) === 0) return;
  await visibleAnswer.fill(
    `Alex Rivera, Gameplay Programmer — shipped combat pacing on a live co-op title. Answer ${String(step + 1)}.`,
  );
  await wait(page, NUM_400);
  const synthesize = page
    .locator("button", { hasText: RE_SYNTHESIZE_RESUME })
    .filter({ hasNot: page.locator("[disabled]") })
    .first();
  if ((await synthesize.count()) > 0 && !(await synthesize.isDisabled())) {
    await synthesize.click({ timeout: 10_000 });
    return;
  }
  const next = page.locator("button", { hasText: RE_NEXT }).first();
  if ((await next.count()) === 0) return;
  await waitForEnabled(page, next, NUM_20, NUM_200);
  if (await next.isDisabled()) return;
  await next.click();
  await wait(page, NUM_600);
  return completeResumeQuestionSteps(page, step + 1);
};

const fillResumeTargetForm = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resumeBuild}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, NUM_1800);
  await shot(page, "02-resume-build-target");
  await page.getByLabel("Target role", { exact: true }).fill("Gameplay Programmer");
  const experience = page.getByLabel("Experience level", { exact: true });
  if ((await experience.count()) > 0) {
    await settle(experience.selectOption("Mid"));
  }
  const studio = page.getByLabel("Studio selection", { exact: true });
  if ((await studio.count()) > 0) {
    await settle(studio.selectOption("epic-games"));
  }
};

const runGenerateQuestions = async (page: Page): Promise<void> => {
  const generate = page.locator("button", { hasText: RE_GENERATE_QUESTIONS }).first();
  await generate.waitFor({ state: "visible", timeout: 10_000 });
  await waitForEnabled(page, generate, NUM_20, NUM_250);
  let sawGenerateRequest = false;
  const onGenerateRequest = (request: { url: () => string; method: () => string }): void => {
    if (
      request.url().includes(API_ENDPOINTS.resumeFromQuestionsGenerate) &&
      request.method() === "POST"
    ) {
      sawGenerateRequest = true;
    }
  };
  page.on("request", onGenerateRequest);
  const generateStarted = Date.now();
  const generateResponse = page.waitForResponse(
    (response) =>
      response.url().includes(API_ENDPOINTS.resumeFromQuestionsGenerate) &&
      response.request().method() === "POST",
    { timeout: 300_000 },
  );
  await generate.click({ timeout: 10_000 });
  await writeOutput("clicked Generate Questions; waiting for AI question UI");
  const generateResult = await settle(generateResponse);
  page.off("request", onGenerateRequest);
  if (generateResult.status === "rejected") {
    await shot(page, "03-resume-questions-timeout");
    throw new Error(
      sawGenerateRequest
        ? "Resume guided build: generate request never completed."
        : "Resume guided build: generate request never fired.",
    );
  }
  await writeOutput(
    `resume generate HTTP ${String(generateResult.value.status())} in ${String(Date.now() - generateStarted)}ms`,
  );
};

const finishResumePreviewExport = async (page: Page): Promise<void> => {
  await wait(page, NUM_15000);
  const lateSynth = page.locator("button", { hasText: RE_SYNTHESIZE_RESUME }).first();
  if ((await lateSynth.count()) > 0 && !(await lateSynth.isDisabled())) {
    await settle(lateSynth.click({ timeout: 10_000 }));
    await wait(page, NUM_15000);
  }
  await shot(page, "04-resume-synthesized");
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resumePreview}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, NUM_2000);
  await shot(page, "05-resume-preview-styled");
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resume}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, NUM_1800);
  const edit = page.getByRole("button", { name: RE_EDIT }).first();
  if ((await edit.count()) > 0) {
    await edit.click();
    await wait(page, NUM_1200);
  }
  const exportBtn = page.getByRole("button", { name: RE_EXPORT }).first();
  if ((await exportBtn.count()) === 0) return;
  await exportBtn.click();
  await wait(page, NUM_400);
  const downloadPromise = page.waitForEvent("download", { timeout: 45_000 });
  await page
    .getByRole("menuitem", { name: RE_PDF })
    .or(page.getByRole("button", { name: RE_PDF }))
    .first()
    .click();
  await settle(downloadPromise);
};

export const demoResumeGuidedBuild = async (page: Page): Promise<boolean> => {
  await fillResumeTargetForm(page);
  await runGenerateQuestions(page);
  await page.getByText(RE_QUESTION_PROGRESS).first().waitFor({ state: "visible", timeout: 30_000 });
  await page.locator("textarea:visible").first().waitFor({ state: "visible", timeout: 15_000 });
  await shot(page, "03-resume-questions");
  await completeResumeQuestionSteps(page);
  await finishResumePreviewExport(page);
  return true;
};
