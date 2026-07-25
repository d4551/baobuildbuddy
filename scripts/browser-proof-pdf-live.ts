/**
 * Fail-closed headed proof: open/edit resume + Export PDF via UI clicks only.
 * No resume API injection.
 */

import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Download, type Page } from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import {
  COUNT_FIVE_HUNDRED,
  MS_EIGHT_HUNDRED,
  MS_FOUR_HUNDRED,
  MS_ONE_AND_HALF_SECONDS,
  MS_ONE_TWO_HUNDRED,
  MS_SIX_HUNDRED,
  MS_TWO_SECONDS,
} from "./constants/numeric-literals";
import { writeError, writeOutput } from "./utils/cli-output";
import { PORTFOLIO_EXPORT_THEME_BY_TEMPLATE } from "../packages/shared/src/constants/export-document-theme";
import { assertPdfContainsRgbFill, assertRealPdfFile } from "./utils/live-pdf-assert";
import { settlePage } from "./utils/playwright-settle";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const OUT = process.env.PDF_PROOF_OUT ?? "/opt/cursor/artifacts/live-capabilities/pdf-live-ui";

const RE_EXPORT = /Export/i;
const RE_EXPORT_PDF = /Export PDF|^PDF$/i;
const RE_EDIT_ARIA = /Edit resume/i;
const RE_CREATE_ARIA = /^Create a new resume$/i;
const RE_CREATE_SUBMIT = /^Create resume$/i;
const RE_CANCEL_CREATE = /Cancel resume creation|Close create resume dialog/i;
const RE_FULL_NAME = /Full Name|Name/i;
const RE_SAVE = /^Save$/i;
const RE_OPEN_COVER_GENERATE = /Open cover-letter generation dialog/i;
const RE_COVER_GENERATE = /^Generate cover letter$/i;
const RE_TARGET_COMPANY = /Target company/i;
const RE_TARGET_POSITION = /Target position/i;
const RE_EDIT_COVER = /Edit cover letter/i;
const COVER_LETTER_DETAIL_URL_PATTERN = /\/cover-letter\/[^/]+/u;
const RE_OPEN_PROJECT = /Open project creation dialog/i;
const RE_PROJECT_TITLE = /Project title/i;
const RE_PROJECT_DESCRIPTION = /Project description/i;
const RE_TECH_INPUT = /Technology input/i;
const RE_ADD_TECH = /Add technology to project/i;
const RE_SAVE_PROJECT = /Save project changes/i;
const RE_CANCEL_PROJECT = /Cancel project changes|Close project modal/i;
const RE_EXPORT_PORTFOLIO = /Export portfolio/i;

const wait = settlePage;

const saveDownload = async (download: Download, name: string): Promise<string> => {
  const target = join(OUT, "downloads", name);
  await download.saveAs(target);
  return target;
};

const dismissCreateDialogIfOpen = async (page: Page): Promise<void> => {
  const cancel = page.getByRole("button", { name: RE_CANCEL_CREATE }).first();
  if ((await cancel.count()) > 0 && (await cancel.isVisible())) {
    await cancel.click();
    await wait(page, COUNT_FIVE_HUNDRED);
  }
};

const ensureResumeViaUi = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resume}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  await dismissCreateDialogIfOpen(page);

  const editButton = page.getByRole("button", { name: RE_EDIT_ARIA }).first();
  if ((await editButton.count()) > 0 && (await editButton.isVisible())) {
    await editButton.click();
    await wait(page, MS_ONE_TWO_HUNDRED);
    await page.screenshot({ path: join(OUT, "stills", "00-edit-existing.png") });
    return;
  }

  await page.getByRole("button", { name: RE_CREATE_ARIA }).click();
  await wait(page, MS_EIGHT_HUNDRED);
  const nameInput = page.getByLabel(RE_FULL_NAME).first();
  if ((await nameInput.count()) > 0) {
    await nameInput.click();
    await nameInput.fill("");
    await nameInput.pressSequentially("Bao UI Proof", { delay: 20 });
  }
  await page.getByRole("button", { name: RE_CREATE_SUBMIT }).click();
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  const saveButton = page.getByRole("button", { name: RE_SAVE }).first();
  if ((await saveButton.count()) > 0 && (await saveButton.isVisible())) {
    await saveButton.click();
    await wait(page, MS_ONE_AND_HALF_SECONDS);
  }
  await page.screenshot({ path: join(OUT, "stills", "00-created-via-ui.png") });
};

const exportPdfViaUi = async (page: Page): Promise<string> => {
  await page.getByRole("button", { name: RE_EXPORT }).first().click();
  await wait(page, COUNT_FIVE_HUNDRED);
  const downloadPromise = page.waitForEvent("download", { timeout: 45_000 });
  await page.getByRole("menuitem", { name: RE_EXPORT_PDF }).first().click();
  const downloadResult = await settle(downloadPromise);
  if (downloadResult.status === "rejected") {
    await page.screenshot({ path: join(OUT, "stills", "pdf-failed.png") });
    throw new Error(`PDF download failed: ${downloadResult.reason.message}`);
  }
  return saveDownload(downloadResult.value, "resume-ui.pdf");
};

const openOrGenerateCoverLetter = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.coverLetter}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  const existingCover = page.getByRole("button", { name: RE_EDIT_COVER }).first();
  if ((await existingCover.count()) > 0 && (await existingCover.isVisible())) {
    await existingCover.click();
    await wait(page, MS_ONE_AND_HALF_SECONDS);
    return;
  }
  await page.getByRole("button", { name: RE_OPEN_COVER_GENERATE }).click();
  await wait(page, MS_EIGHT_HUNDRED);
  const company = page.getByLabel(RE_TARGET_COMPANY);
  await company.click();
  await company.fill("");
  await company.pressSequentially("Riot Games", { delay: 20 });
  const position = page.getByLabel(RE_TARGET_POSITION);
  await position.click();
  await position.fill("");
  await position.pressSequentially("Gameplay Engineer", { delay: 20 });
  await page.getByRole("button", { name: RE_COVER_GENERATE }).click();
  await page.waitForURL(COVER_LETTER_DETAIL_URL_PATTERN, { timeout: 180_000 });
  await wait(page, MS_ONE_AND_HALF_SECONDS);
};

const proofCoverLetterPdf = async (page: Page) => {
  await openOrGenerateCoverLetter(page);
  await page.screenshot({ path: join(OUT, "stills", "02-cover-letter-detail.png") });
  await page.getByRole("button", { name: RE_EXPORT }).first().click();
  await wait(page, COUNT_FIVE_HUNDRED);
  const coverDownloadPromise = page.waitForEvent("download", { timeout: 45_000 });
  await page.getByRole("menuitem", { name: RE_EXPORT_PDF }).first().click();
  const coverDownload = await settle(coverDownloadPromise);
  if (coverDownload.status === "rejected") {
    await page.screenshot({ path: join(OUT, "stills", "cover-pdf-failed.png") });
    throw new Error(`Cover letter PDF download failed: ${coverDownload.reason.message}`);
  }
  const coverPath = await saveDownload(coverDownload.value, "cover-letter-ui.pdf");
  const coverLetterPdf = await assertRealPdfFile(coverPath);
  await page.screenshot({ path: join(OUT, "stills", "03-cover-letter-pdf-exported.png") });
  return coverLetterPdf;
};

const ensurePortfolioProject = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.portfolio}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, MS_ONE_TWO_HUNDRED);
  await settle(
    page.getByRole("button", { name: RE_CANCEL_PROJECT }).first().click({ timeout: 2_000 }),
  );
  await wait(page, MS_FOUR_HUNDRED);
  const exportPortfolio = page.getByRole("button", { name: RE_EXPORT_PORTFOLIO }).first();
  if ((await exportPortfolio.count()) > 0 && (await exportPortfolio.isVisible())) {
    return;
  }
  await page.getByRole("button", { name: RE_OPEN_PROJECT }).click();
  await wait(page, MS_SIX_HUNDRED);
  const title = page.getByLabel(RE_PROJECT_TITLE);
  await title.click();
  await title.fill("");
  await title.pressSequentially("Bao RPA Dungeon Demo", { delay: 15 });
  const description = page.getByLabel(RE_PROJECT_DESCRIPTION);
  await description.click();
  await description.fill("");
  await description.pressSequentially(
    "Shipped a multiplayer dungeon crawler prototype with networked combat and live ops tooling for game-industry hiring demos.",
    { delay: 5 },
  );
  const tech = page.getByLabel(RE_TECH_INPUT);
  await tech.click();
  await tech.fill("");
  await tech.pressSequentially("TypeScript", { delay: 15 });
  await page.getByRole("button", { name: RE_ADD_TECH }).click();
  await page.getByRole("button", { name: RE_SAVE_PROJECT }).click();
  await wait(page, MS_TWO_SECONDS);
};

const proofPortfolioPdf = async (page: Page) => {
  await ensurePortfolioProject(page);
  const templateSelect = page.getByLabel("Portfolio export template");
  await templateSelect.waitFor({ state: "visible", timeout: 30_000 });
  await templateSelect.selectOption("gaming");
  await wait(page, COUNT_FIVE_HUNDRED);
  await page.screenshot({ path: join(OUT, "stills", "04-portfolio-ready.png") });
  await page.getByRole("button", { name: RE_EXPORT_PORTFOLIO }).click();
  await wait(page, COUNT_FIVE_HUNDRED);
  const portfolioDownloadPromise = page.waitForEvent("download", { timeout: 45_000 });
  await page.getByRole("menuitem", { name: RE_EXPORT_PDF }).first().click();
  const portfolioDownload = await settle(portfolioDownloadPromise);
  if (portfolioDownload.status === "rejected") {
    await page.screenshot({ path: join(OUT, "stills", "portfolio-pdf-failed.png") });
    throw new Error(`Portfolio PDF download failed: ${portfolioDownload.reason.message}`);
  }
  const portfolioPath = await saveDownload(portfolioDownload.value, "portfolio-ui.pdf");
  const portfolioPdf = await assertRealPdfFile(portfolioPath);
  const paletteOk = await assertPdfContainsRgbFill(
    portfolioPath,
    PORTFOLIO_EXPORT_THEME_BY_TEMPLATE.gaming.primary,
    "portfolio-gaming-primary",
  );
  if (!paletteOk) {
    throw new Error("Portfolio gaming PDF missing SSOT primary fill");
  }
  await page.screenshot({ path: join(OUT, "stills", "05-portfolio-pdf-exported.png") });
  return portfolioPdf;
};

const writePdfReport = async (
  resumeAssertion: Awaited<ReturnType<typeof assertRealPdfFile>>,
  coverLetterPdf: Awaited<ReturnType<typeof assertRealPdfFile>>,
  portfolioPdf: Awaited<ReturnType<typeof assertRealPdfFile>>,
): Promise<void> => {
  if (!resumeAssertion.ok || !coverLetterPdf.ok || !portfolioPdf.ok) {
    process.exit(1);
  }
  await Bun.write(
    join(OUT, "report.json"),
    `${JSON.stringify(
      {
        ok: true,
        mode: "ui-click-type",
        resumePdf: resumeAssertion,
        coverLetterPdf,
        portfolioPdf,
      },
      null,
      2,
    )}\n`,
  );
  await writeOutput(`browser-proof-pdf-live OK (UI) → ${OUT}`);
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  await mkdir(join(OUT, "downloads"), { recursive: true });

  const browser = await chromium.launch({ headless: false, args: ["--disable-dev-shm-usage"] });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  await ensureResumeViaUi(page);
  const resumePath = await exportPdfViaUi(page);
  const resumeAssertion = await assertRealPdfFile(resumePath);
  await page.screenshot({ path: join(OUT, "stills", "01-resume-pdf-exported.png") });

  const coverLetterPdf = await proofCoverLetterPdf(page);
  const portfolioPdf = await proofPortfolioPdf(page);
  await browser.close();
  await writePdfReport(resumeAssertion, coverLetterPdf, portfolioPdf);
};

const runResult = await settle(main());
if (runResult.status === "rejected") {
  await writeError(runResult.reason.message);
  process.exit(1);
}
