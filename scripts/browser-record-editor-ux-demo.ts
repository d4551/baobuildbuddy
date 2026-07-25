/**
 * Authentic headed video: CM6 JSON lint + cover letter editor + resume PDF.
 * UI click/type only.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type Browser, type BrowserContext, chromium, type Page } from "playwright";
import { APP_ROUTE_BUILDERS, APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import {
  COUNT_FIVE_HUNDRED,
  MS_EIGHT_HUNDRED,
  MS_FOUR_HUNDRED,
  MS_ONE_AND_HALF_SECONDS,
  MS_ONE_TWO_HUNDRED,
  MS_SECOND,
  MS_SIX_HUNDRED,
} from "./constants/numeric-literals";
import { writeError, writeOutput } from "./utils/cli-output";
import { assertRealPdfFile } from "./utils/live-pdf-assert";
import { settlePage } from "./utils/playwright-settle";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const OUT = process.env.EDITOR_UX_OUT ?? "/opt/cursor/artifacts/live-capabilities/editor-ux";

const RE_EXPORT = /Export/i;
const RE_EXPORT_PDF = /Export PDF/i;
const RE_EDIT_RESUME = /Edit resume/i;
const RE_EDIT_COVER = /Edit cover letter/i;
const RE_FIND = /^Find$/i;
const RE_GREENHOUSE_SUMMARY = /Greenhouse|Advanced collections|boards/i;

const wait = settlePage;

const shot = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({ path: join(OUT, "stills", `${name}.png`), fullPage: false });
};

const proveJsonLintEditor = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTE_BUILDERS.settingsSection("jobIntelligence")}`, {
    waitUntil: "domcontentloaded",
  });
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  const advanced = page.locator("summary", { hasText: RE_GREENHOUSE_SUMMARY }).first();
  if ((await advanced.count()) > 0) {
    await advanced.click();
    await wait(page, MS_EIGHT_HUNDRED);
  }
  await shot(page, "01-settings-json-editor");
  const cmContent = page.locator(".cm-content").first();
  if ((await cmContent.count()) === 0) {
    throw new Error("AppCodeEditor (.cm-content) not mounted on Job Intelligence");
  }
  await cmContent.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.type("{ bad json ");
  await wait(page, MS_EIGHT_HUNDRED);
  await shot(page, "02-json-lint-error");
  await page.keyboard.press("Control+a");
  await page.keyboard.type("[]");
  await wait(page, MS_SIX_HUNDRED);
  await shot(page, "03-json-lint-fixed");
};

const proveCoverLetterEditor = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.coverLetter}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_ONE_TWO_HUNDRED);
  await page.getByRole("button", { name: RE_EDIT_COVER }).first().click();
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  await shot(page, "04-cover-editor-split");
  const findBtn = page.getByRole("button", { name: RE_FIND }).first();
  if ((await findBtn.count()) > 0) {
    await findBtn.click();
    await wait(page, COUNT_FIVE_HUNDRED);
    await shot(page, "05-cover-find-panel");
  }
  const coverCm = page.locator(".cm-content").first();
  await coverCm.click();
  await page.keyboard.type("\n\nIndustry editor proof line.");
  await wait(page, COUNT_FIVE_HUNDRED);
  await shot(page, "06-cover-edited-preview");
};

const proveResumePdfExport = async (page: Page) => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resume}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_SECOND);
  await page.getByRole("button", { name: RE_EDIT_RESUME }).first().click();
  await wait(page, MS_SECOND);
  await page.getByRole("button", { name: RE_EXPORT }).first().click();
  await wait(page, MS_FOUR_HUNDRED);
  const downloadPromise = page.waitForEvent("download", { timeout: 45_000 });
  await page.getByRole("menuitem", { name: RE_EXPORT_PDF }).first().click();
  const download = await settle(downloadPromise);
  if (download.status === "rejected") {
    throw new Error(`PDF failed: ${download.reason.message}`);
  }
  const pdfPath = join(OUT, "downloads", "editor-ux-resume.pdf");
  await download.value.saveAs(pdfPath);
  const pdf = await assertRealPdfFile(pdfPath);
  await shot(page, "07-resume-pdf");
  return pdf;
};

const finalizeEditorVideo = async (
  page: Page,
  context: BrowserContext,
  browser: Browser,
): Promise<string | null> => {
  const video = page.video();
  await context.close();
  await browser.close();
  if (!video) {
    return null;
  }
  const raw = await video.path();
  const videoPath = join(OUT, "editor-ux-demo.webm");
  await Bun.write(videoPath, Bun.file(raw));
  return videoPath;
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  await mkdir(join(OUT, "downloads"), { recursive: true });
  await mkdir(join(OUT, "raw"), { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    acceptDownloads: true,
    recordVideo: { dir: join(OUT, "raw"), size: { width: 1440, height: 900 } },
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await proveJsonLintEditor(page);
  await proveCoverLetterEditor(page);
  const pdf = await proveResumePdfExport(page);
  const videoPath = await finalizeEditorVideo(page, context, browser);

  if (!pdf.ok || !videoPath) {
    throw new Error("Editor UX proof incomplete");
  }

  await writeFile(
    join(OUT, "report.json"),
    `${JSON.stringify({ ok: true, pdf, videoPath, cmMounted: true }, null, 2)}\n`,
  );
  await writeOutput(`browser-record-editor-ux-demo OK video=${videoPath}`);
};

const runResult = await settle(main());
if (runResult.status === "rejected") {
  await writeError(runResult.reason.message);
  process.exit(1);
}
