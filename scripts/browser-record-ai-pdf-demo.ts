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
  MS_SIXTY_SECONDS,
  MS_TWO_MINUTES,
} from "./constants/numeric-literals";
import { writeError, writeOutput } from "./utils/cli-output";
import { assertLiveInference } from "./utils/live-ai-probe";
import { assertRealPdfFile } from "./utils/live-pdf-assert";
import { settlePage } from "./utils/playwright-settle";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const OUT = process.env.AI_PDF_DEMO_OUT ?? "/opt/cursor/artifacts/baseline/ai-pdf-video";
const MODEL = process.env.LOCAL_MODEL_NAME?.trim() || "llama3.2:1b";
const ENDPOINT =
  process.env.LOCAL_MODEL_ENDPOINT?.replace(/\/$/u, "") ?? "http://127.0.0.1:11434/v1";

const SEND_BUTTON_PATTERN = /send/iu;
const RE_EXPORT_PDF = /Export PDF|^PDF$/i;
const RE_EDIT_RESUME = /Edit resume/i;
const RE_EDIT_COVER = /Edit cover letter/i;
const RE_PREVIEW_RESUME = /Preview resume/i;
const RE_EXPORT_RESUME = /Export resume/i;
const RE_EXPORT_COVER = /Export cover-letter/i;
const RE_EXPORT_PORTFOLIO = /Export portfolio/i;
const RE_VISIBLE_EDIT = /^Edit$/;
const THEME_SWAP_LOCATOR = "button.swap.swap-rotate";
const ASSISTANT_CHAT_LOCATOR = "article.chat-start .chat-bubble";

const wait = settlePage;

const shot = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({ path: join(OUT, "stills", `${name}.png`), fullPage: false });
};

const saveDownload = async (download: Download, name: string): Promise<string> => {
  const target = join(OUT, "downloads", name);
  await download.saveAs(target);
  return target;
};

const exportPdf = async (
  page: Page,
  filename: string,
  triggerName: RegExp,
): Promise<string> => {
  const trigger = page.getByRole("button", { name: triggerName }).first();
  await trigger.waitFor({ state: "visible", timeout: MS_FORTY_FIVE_SECONDS });
  await trigger.click();
  await wait(page, MS_FOUR_HUNDRED);
  const downloadPromise = page.waitForEvent("download", { timeout: MS_FORTY_FIVE_SECONDS });
  await page.getByRole("menuitem", { name: RE_EXPORT_PDF }).first().click();
  const result = await settle(downloadPromise);
  if (result.status === "rejected") {
    throw new Error(`PDF download failed for ${filename}: ${result.reason.message}`);
  }
  return saveDownload(result.value, filename);
};

const GREETING_SNIPPET = "Hi, I'm Bao";

const waitLiveAssistantReply = async (page: Page, nonce: string): Promise<string> => {
  const deadline = Date.now() + MS_TWO_MINUTES;
  while (Date.now() < deadline) {
    const userText = await page.locator("article.chat-end .chat-bubble").last().innerText().catch(() => "");
    if (!userText.includes(nonce)) {
      await wait(page, MS_ONE_TWO_HUNDRED);
      continue;
    }
    const bubbles = page.locator(ASSISTANT_CHAT_LOCATOR);
    const count = await bubbles.count();
    if (count < 2) {
      await wait(page, MS_ONE_TWO_HUNDRED);
      continue;
    }
    const latest = (await bubbles.nth(count - 1).innerText()).trim();
    const looksLikeLiveReply =
      latest.length > COUNT_TWELVE &&
      !latest.startsWith(GREETING_SNIPPET) &&
      (latest.includes(nonce) || /[A-Za-z]{4,}/u.test(latest));
    if (looksLikeLiveReply) {
      return latest;
    }
    await wait(page, MS_ONE_TWO_HUNDRED);
  }
  await shot(page, "02-ai-chat-reply-missing");
  throw new Error(`AI Chat video proof missing live assistant reply for ${nonce}`);
};

const tourAiChat = async (page: Page): Promise<string> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.aiChat}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_ONE_TWO_HUNDRED);
  await shot(page, "01-ai-chat");
  const nonce = `BAO_VID_${Date.now().toString(COUNT_THIRTY_SIX)}`;
  const composer = page.locator("textarea").first();
  await composer.click();
  await composer.fill("");
  await composer.pressSequentially(
    `Your entire reply must be exactly this token on its own line: ${nonce}`,
    {
      delay: COUNT_TWELVE,
    },
  );
  await page.getByRole("button", { name: SEND_BUTTON_PATTERN }).first().click();
  const assistantSample = await waitLiveAssistantReply(page, nonce);
  await shot(page, "02-ai-chat-live-reply");
  await writeOutput(`ai-chat live reply chars=${String(assistantSample.length)}`);
  return nonce;
};

const openEditorByVisibleEdit = async (page: Page, ariaPattern: RegExp): Promise<void> => {
  const edit = page.getByRole("button", { name: ariaPattern }).filter({ hasText: RE_VISIBLE_EDIT });
  await edit.first().waitFor({ state: "visible", timeout: MS_SIXTY_SECONDS });
  await edit.first().click({ force: true });
  await wait(page, MS_ONE_AND_HALF_SECONDS);
};

const openResumeExportSurface = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resume}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  // Prefer editor path; fall back to preview (both expose Export resume).
  const edit = page.getByRole("button", { name: RE_EDIT_RESUME }).filter({ hasText: RE_VISIBLE_EDIT });
  await edit.first().waitFor({ state: "visible", timeout: MS_SIXTY_SECONDS });
  await edit.first().click({ force: true });
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  const exportBtn = page.getByRole("button", { name: RE_EXPORT_RESUME }).first();
  if ((await exportBtn.count()) === 0 || !(await exportBtn.isVisible().catch(() => false))) {
    await page.getByRole("link", { name: RE_PREVIEW_RESUME }).first().click();
    await wait(page, MS_ONE_AND_HALF_SECONDS);
  }
  await page.getByRole("button", { name: RE_EXPORT_RESUME }).first().waitFor({
    state: "visible",
    timeout: MS_SIXTY_SECONDS,
  });
};

const tourThemedPdfs = async (page: Page): Promise<Record<string, unknown>> => {
  await page.locator(THEME_SWAP_LOCATOR).first().click();
  await wait(page, MS_EIGHT_HUNDRED);
  await shot(page, "03-theme-business");
  await openResumeExportSurface(page);
  await shot(page, "04-resume-editor-themed");
  const resumePdf = await assertRealPdfFile(
    await exportPdf(page, "resume-themed.pdf", RE_EXPORT_RESUME),
  );
  await shot(page, "05-resume-pdf-exported");
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.coverLetter}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  await openEditorByVisibleEdit(page, RE_EDIT_COVER);
  await page.getByRole("button", { name: RE_EXPORT_COVER }).first().waitFor({
    state: "visible",
    timeout: MS_SIXTY_SECONDS,
  });
  await shot(page, "06-cover-letter-themed");
  const coverPdf = await assertRealPdfFile(
    await exportPdf(page, "cover-letter-themed.pdf", RE_EXPORT_COVER),
  );
  await shot(page, "07-cover-pdf-exported");
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.portfolio}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  await shot(page, "08-portfolio-themed");
  const portfolioPdf = await assertRealPdfFile(
    await exportPdf(page, "portfolio-themed.pdf", RE_EXPORT_PORTFOLIO),
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
