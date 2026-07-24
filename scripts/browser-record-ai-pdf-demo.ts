/**
 * Headed video proof: mandatory live AI + themed PDF generation via UI click/type.
 * No API inject. Playwright recordVideo + stills.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Download, type Page } from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import { writeError, writeOutput } from "./utils/cli-output";
import { assertLiveInference } from "./utils/live-ai-probe";
import { assertRealPdfFile } from "./utils/live-pdf-assert";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const OUT =
  process.env.AI_PDF_DEMO_OUT ?? "/opt/cursor/artifacts/live-capabilities/ai-pdf-video";
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

const wait = async (page: Page, ms: number): Promise<void> => {
  await page.waitForTimeout(ms);
};

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
  await wait(page, 400);
  const downloadPromise = page.waitForEvent("download", { timeout: 45_000 });
  await page.getByRole("menuitem", { name: RE_EXPORT_PDF }).first().click();
  const result = await settle(downloadPromise);
  if (result.status === "rejected") {
    throw new Error(`PDF download failed for ${filename}: ${result.reason.message}`);
  }
  return saveDownload(result.value, filename);
};

const tour = async (page: Page): Promise<Record<string, unknown>> => {
  // 1) Live AI mandatory — Chat nonce via UI
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.aiChat}`, { waitUntil: "networkidle" });
  await wait(page, 1_200);
  await shot(page, "01-ai-chat");
  const nonce = `BAO_VID_${Date.now().toString(36)}`;
  const composer = page.locator("textarea").first();
  await composer.click();
  await composer.fill("");
  await composer.pressSequentially(
    `Reply with ONLY this exact token and nothing else: ${nonce}`,
    { delay: 12 },
  );
  await page.getByRole("button", { name: SEND_BUTTON_PATTERN }).first().click();
  await wait(page, 45_000);
  const chatText = await page.locator("main").innerText();
  if (!chatText.includes(nonce)) {
    throw new Error(`AI Chat video proof missing nonce ${nonce}`);
  }
  await shot(page, "02-ai-chat-nonce");

  // 2) Theme flip (business) then resume PDF — click visible swap label chrome.
  await page.locator(THEME_SWAP_LOCATOR).first().click();
  await wait(page, 800);
  await shot(page, "03-theme-business");

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resume}`, { waitUntil: "networkidle" });
  await wait(page, 1_200);
  await page.getByRole("button", { name: RE_EDIT_RESUME }).first().click();
  await wait(page, 1_200);
  await shot(page, "04-resume-editor-themed");
  const resumePath = await exportPdf(page, "resume-themed.pdf");
  const resumePdf = await assertRealPdfFile(resumePath);
  await shot(page, "05-resume-pdf-exported");

  // 3) Cover letter PDF (existing letter)
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.coverLetter}`, { waitUntil: "networkidle" });
  await wait(page, 1_200);
  await page.getByRole("button", { name: RE_EDIT_COVER }).first().click();
  await wait(page, 1_500);
  await shot(page, "06-cover-letter-themed");
  const coverPath = await exportPdf(page, "cover-letter-themed.pdf");
  const coverPdf = await assertRealPdfFile(coverPath);
  await shot(page, "07-cover-pdf-exported");

  // 4) Portfolio PDF
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.portfolio}`, { waitUntil: "networkidle" });
  await wait(page, 1_200);
  await shot(page, "08-portfolio-themed");
  await page.getByRole("button", { name: RE_EXPORT_PORTFOLIO }).click();
  await wait(page, 400);
  const portfolioDownloadPromise = page.waitForEvent("download", { timeout: 45_000 });
  await page.getByRole("menuitem", { name: RE_EXPORT_PDF }).first().click();
  const portfolioDownload = await settle(portfolioDownloadPromise);
  if (portfolioDownload.status === "rejected") {
    throw new Error(`Portfolio PDF failed: ${portfolioDownload.reason.message}`);
  }
  const portfolioPath = await saveDownload(portfolioDownload.value, "portfolio-themed.pdf");
  const portfolioPdf = await assertRealPdfFile(portfolioPath);
  await shot(page, "09-portfolio-pdf-exported");

  // flip back to light for closure
  await page.locator(THEME_SWAP_LOCATOR).first().click();
  await wait(page, 600);
  await shot(page, "10-theme-corporate");

  return {
    nonce,
    resumePdf,
    coverPdf,
    portfolioPdf,
  };
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
