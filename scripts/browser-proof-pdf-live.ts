/**
 * Fail-closed headed proof: open/edit resume + Export PDF via UI clicks only.
 * No resume API injection.
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Download, type Page } from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import { writeError, writeOutput } from "./utils/cli-output";
import { assertRealPdfFile } from "./utils/live-pdf-assert";

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

const wait = async (page: Page, ms: number): Promise<void> => {
  await page.waitForTimeout(ms);
};

const saveDownload = async (download: Download, name: string): Promise<string> => {
  const target = join(OUT, "downloads", name);
  await download.saveAs(target);
  return target;
};

const dismissCreateDialogIfOpen = async (page: Page): Promise<void> => {
  const cancel = page.getByRole("button", { name: RE_CANCEL_CREATE }).first();
  if ((await cancel.count()) > 0 && (await cancel.isVisible())) {
    await cancel.click();
    await wait(page, 500);
  }
};

const ensureResumeViaUi = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resume}`, {
    waitUntil: "networkidle",
    timeout: 60_000,
  });
  await wait(page, 1_500);
  await dismissCreateDialogIfOpen(page);

  const editButton = page.getByRole("button", { name: RE_EDIT_ARIA }).first();
  if ((await editButton.count()) > 0 && (await editButton.isVisible())) {
    await editButton.click();
    await wait(page, 1_200);
    await page.screenshot({ path: join(OUT, "stills", "00-edit-existing.png") });
    return;
  }

  await page.getByRole("button", { name: RE_CREATE_ARIA }).click();
  await wait(page, 800);
  const nameInput = page.getByLabel(RE_FULL_NAME).first();
  if ((await nameInput.count()) > 0) {
    await nameInput.click();
    await nameInput.fill("");
    await nameInput.pressSequentially("Bao UI Proof", { delay: 20 });
  }
  await page.getByRole("button", { name: RE_CREATE_SUBMIT }).click();
  await wait(page, 1_500);
  const saveButton = page.getByRole("button", { name: RE_SAVE }).first();
  if ((await saveButton.count()) > 0 && (await saveButton.isVisible())) {
    await saveButton.click();
    await wait(page, 1_500);
  }
  await page.screenshot({ path: join(OUT, "stills", "00-created-via-ui.png") });
};

const exportPdfViaUi = async (page: Page): Promise<string> => {
  await page.getByRole("button", { name: RE_EXPORT }).first().click();
  await wait(page, 500);
  const downloadPromise = page.waitForEvent("download", { timeout: 45_000 });
  await page.getByRole("menuitem", { name: RE_EXPORT_PDF }).first().click();
  const downloadResult = await settle(downloadPromise);
  if (downloadResult.status === "rejected") {
    await page.screenshot({ path: join(OUT, "stills", "pdf-failed.png") });
    throw new Error(`PDF download failed: ${downloadResult.reason.message}`);
  }
  return saveDownload(downloadResult.value, "resume-ui.pdf");
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

  // Cover letter: generate via dialog (type company/position) then Export PDF.
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.coverLetter}`, {
    waitUntil: "networkidle",
    timeout: 60_000,
  });
  await wait(page, 1_500);
  const existingCover = page.getByRole("button", { name: RE_EDIT_COVER }).first();
  if ((await existingCover.count()) > 0 && (await existingCover.isVisible())) {
    await existingCover.click();
    await wait(page, 1_500);
  } else {
    await page.getByRole("button", { name: RE_OPEN_COVER_GENERATE }).click();
    await wait(page, 800);
    const company = page.getByLabel(RE_TARGET_COMPANY);
    await company.click();
    await company.fill("");
    await company.pressSequentially("Riot Games", { delay: 20 });
    const position = page.getByLabel(RE_TARGET_POSITION);
    await position.click();
    await position.fill("");
    await position.pressSequentially("Gameplay Engineer", { delay: 20 });
    await page.getByRole("button", { name: RE_COVER_GENERATE }).click();
    // Live Ollama generation — allow long wait, then land on detail.
    await page.waitForURL(COVER_LETTER_DETAIL_URL_PATTERN, { timeout: 180_000 });
    await wait(page, 1_500);
  }
  await page.screenshot({ path: join(OUT, "stills", "02-cover-letter-detail.png") });
  await page.getByRole("button", { name: RE_EXPORT }).first().click();
  await wait(page, 500);
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

  await browser.close();

  if (!resumeAssertion.ok || !coverLetterPdf.ok) {
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
      },
      null,
      2,
    )}\n`,
  );
  await writeOutput(`browser-proof-pdf-live OK (UI) → ${OUT}`);
};

const runResult = await settle(main());
if (runResult.status === "rejected") {
  await writeError(runResult.reason.message);
  process.exit(1);
}
