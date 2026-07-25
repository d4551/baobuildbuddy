/**
 * Headed video proof: mandatory live AI + themed PDF generation via UI click/type.
 * No API inject. Playwright recordVideo + stills.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Download, type Page } from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import {
  COUNT_THIRTY_SIX,
  COUNT_TWELVE,
  MS_EIGHT_HUNDRED,
  MS_FORTY_FIVE_SECONDS,
  MS_FOUR_HUNDRED,
  MS_ONE_AND_HALF_SECONDS,
  MS_ONE_TWO_HUNDRED,
  MS_SIX_HUNDRED,
} from "./constants/numeric-literals";
import { writeError, writeOutput } from "./utils/cli-output";
import { assertLiveInference } from "./utils/live-ai-probe";
import { assertRealPdfFile } from "./utils/live-pdf-assert";
import { settlePage } from "./utils/playwright-settle";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const OUT = process.env.AI_PDF_DEMO_OUT ?? "/opt/cursor/artifacts/live-capabilities/ai-pdf-video";
const MODEL = process.env.LOCAL_MODEL_NAME?.trim() || "llama3.2:1b";
const ENDPOINT =
  process.env.LOCAL_MODEL_ENDPOINT?.replace(/\/$/u, "") ?? "http://127.0.0.1:11434/v1";

const SEND_BUTTON_PATTERN = /send/iu;
const RE_EXPORT = /Export/i;
const RE_EXPORT_PDF = /Export PDF|^PDF$/i;
const RE_EDIT_RESUME = /Edit resume/i;
const RE_EDIT_COVER = /Edit cover letter/i;
const RE_EXPORT_PORTFOLIO = /Export portfolio/i;
const THEME_SWAP_LOCATOR = "label.swap.swap-rotate";

const wait = settlePage;

const shot = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({ path: join(OUT, "stills", `${name}.png`), fullPage: false });
};

const saveDownload = async (download: Download, name: string): Promise<string> => {
  const target = join(OUT, "downloads", name);
  await download.saveAs(target);
  return target;
};

const exportPdf = async (page: Page, filename: string): Promise<string> => {
  await page.getByRole("button", { name: RE_EXPORT }).first().click();
  await wait(page, MS_FOUR_HUNDRED);
  const downloadPromise = page.waitForEvent("download", { timeout: MS_FORTY_FIVE_SECONDS });
  await page.getByRole("menuitem", { name: RE_EXPORT_PDF }).first().click();
  const result = await settle(downloadPromise);
  if (result.status === "rejected") {
    throw new Error(`PDF download failed for ${filename}: ${result.reason.message}`);
  }
  return saveDownload(result.value, filename);
};

const tourAiChat = async (page: Page): Promise<string> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.aiChat}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_ONE_TWO_HUNDRED);
  await shot(page, "01-ai-chat");
  const nonce = `BAO_VID_${Date.now().toString(COUNT_THIRTY_SIX)}`;
  const composer = page.locator("textarea").first();
  await composer.click();
  await composer.fill("");
  await composer.pressSequentially(`Reply with ONLY this exact token and nothing else: ${nonce}`, {
    delay: COUNT_TWELVE,
  });
  await page.getByRole("button", { name: SEND_BUTTON_PATTERN }).first().click();
  await wait(page, MS_FORTY_FIVE_SECONDS);
  const chatText = await page.locator("main").innerText();
  if (!chatText.includes(nonce)) {
    throw new Error(`AI Chat video proof missing nonce ${nonce}`);
  }
  await shot(page, "02-ai-chat-nonce");
  return nonce;
};

const tourThemedPdfs = async (page: Page): Promise<Record<string, unknown>> => {
  await page.locator(THEME_SWAP_LOCATOR).first().click();
  await wait(page, MS_EIGHT_HUNDRED);
  await shot(page, "03-theme-business");
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resume}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_ONE_TWO_HUNDRED);
  await page.getByRole("button", { name: RE_EDIT_RESUME }).first().click();
  await wait(page, MS_ONE_TWO_HUNDRED);
  await shot(page, "04-resume-editor-themed");
  const resumePdf = await assertRealPdfFile(await exportPdf(page, "resume-themed.pdf"));
  await shot(page, "05-resume-pdf-exported");
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.coverLetter}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_ONE_TWO_HUNDRED);
  await page.getByRole("button", { name: RE_EDIT_COVER }).first().click();
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  await shot(page, "06-cover-letter-themed");
  const coverPdf = await assertRealPdfFile(await exportPdf(page, "cover-letter-themed.pdf"));
  await shot(page, "07-cover-pdf-exported");
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.portfolio}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_ONE_TWO_HUNDRED);
  await shot(page, "08-portfolio-themed");
  await page.getByRole("button", { name: RE_EXPORT_PORTFOLIO }).click();
  await wait(page, MS_FOUR_HUNDRED);
  const portfolioDownloadPromise = page.waitForEvent("download", {
    timeout: MS_FORTY_FIVE_SECONDS,
  });
  await page.getByRole("menuitem", { name: RE_EXPORT_PDF }).first().click();
  const portfolioDownload = await settle(portfolioDownloadPromise);
  if (portfolioDownload.status === "rejected") {
    throw new Error(`Portfolio PDF failed: ${portfolioDownload.reason.message}`);
  }
  const portfolioPdf = await assertRealPdfFile(
    await saveDownload(portfolioDownload.value, "portfolio-themed.pdf"),
  );
  await shot(page, "09-portfolio-pdf-exported");
  await page.locator(THEME_SWAP_LOCATOR).first().click();
  await wait(page, MS_SIX_HUNDRED);
  await shot(page, "10-theme-corporate");
  return { resumePdf, coverPdf, portfolioPdf };
};

const tour = async (page: Page): Promise<Record<string, unknown>> => {
  const nonce = await tourAiChat(page);
  const pdfs = await tourThemedPdfs(page);
  return { nonce, ...pdfs };
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  await mkdir(join(OUT, "downloads"), { recursive: true });
  await mkdir(join(OUT, "raw"), { recursive: true });

  const probe = await assertLiveInference({ modelId: MODEL, endpoint: ENDPOINT });

  const browser = await chromium.launch({ headless: false, args: ["--disable-dev-shm-usage"] });
  const context = await browser.newContext({
    acceptDownloads: true,
    recordVideo: { dir: join(OUT, "raw"), size: { width: 1440, height: 900 } },
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const results = await tour(page);
  const video = page.video();
  await context.close();
  await browser.close();

  let videoPath: string | null = null;
  if (video) {
    const raw = await video.path();
    videoPath = join(OUT, "ai-pdf-themed-demo.webm");
    await Bun.write(videoPath, Bun.file(raw));
  }

  const report = {
    ok: true,
    mode: "ui-click-type+video",
    probe,
    ...results,
    videoPath,
  };
  await writeFile(join(OUT, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  if (!videoPath) {
    throw new Error("Video capture missing");
  }
  await writeOutput(`browser-record-ai-pdf-demo OK video=${videoPath}`);
};

const runResult = await settle(main());
if (runResult.status === "rejected") {
  await writeError(runResult.reason.message);
  process.exit(1);
}
