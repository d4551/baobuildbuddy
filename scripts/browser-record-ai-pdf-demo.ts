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
import { pollUntil } from "./utils/async-control";
import { writeError, writeOutput } from "./utils/cli-output";
import { assertLiveInference } from "./utils/live-ai-probe";
import { PORTFOLIO_EXPORT_THEME_BY_TEMPLATE } from "../packages/shared/src/constants/export-document-theme";
import { assertPdfContainsRgbFill, assertRealPdfFile } from "./utils/live-pdf-assert";
import { settlePage } from "./utils/playwright-settle";
import {
  artifactDir,
  resolveProofClientBase,
  resolveProofEnv,
  resolveProofOutDir,
} from "./utils/proof-script-env";

const CLIENT_BASE = resolveProofClientBase("http://127.0.0.1:3001");
const OUT = resolveProofOutDir(
  "AI_PDF_DEMO_OUT",
  artifactDir("baseline", "ai-pdf-video"),
);
const MODEL = resolveProofEnv("LOCAL_MODEL_NAME")?.trim() || "llama3.2:1b";
const ENDPOINT =
  resolveProofEnv("LOCAL_MODEL_ENDPOINT")?.replace(/\/$/u, "") ?? "http://127.0.0.1:11434/v1";

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
const ASSISTANT_WORD_PATTERN = /[A-Za-z]{4,}/u;
const USER_BUBBLE_LOCATOR = "article.chat-end .chat-bubble";

const probeLiveAssistantReply = async (page: Page, nonce: string): Promise<string | null> => {
  const userBubbles = page.locator(USER_BUBBLE_LOCATOR);
  const userText = (await userBubbles.count()) > 0 ? await userBubbles.last().innerText() : "";
  if (!userText.includes(nonce)) {
    return null;
  }
  const bubbles = page.locator(ASSISTANT_CHAT_LOCATOR);
  const count = await bubbles.count();
  if (count < 2) {
    return null;
  }
  const latest = (await bubbles.nth(count - 1).innerText()).trim();
  const looksLikeLiveReply =
    latest.length > COUNT_TWELVE &&
    !latest.startsWith(GREETING_SNIPPET) &&
    (latest.includes(nonce) || ASSISTANT_WORD_PATTERN.test(latest));
  return looksLikeLiveReply ? latest : null;
};

const waitLiveAssistantReply = async (page: Page, nonce: string): Promise<string> => {
  const reply = await pollUntil({
    probe: () => probeLiveAssistantReply(page, nonce),
    intervalMs: MS_ONE_TWO_HUNDRED,
    timeoutMs: MS_TWO_MINUTES,
    sleep: (milliseconds) => wait(page, milliseconds),
  });
  if (reply === null) {
    await shot(page, "02-ai-chat-reply-missing");
    throw new Error(`AI Chat video proof missing live assistant reply for ${nonce}`);
  }
  return reply;
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
  if ((await exportBtn.count()) === 0 || !(await exportBtn.isVisible())) {
    await page.getByRole("link", { name: RE_PREVIEW_RESUME }).first().click();
    await wait(page, MS_ONE_AND_HALF_SECONDS);
  }
  await page.getByRole("button", { name: RE_EXPORT_RESUME }).first().waitFor({
    state: "visible",
    timeout: MS_SIXTY_SECONDS,
  });
};

const tourDocumentExportPdfs = async (page: Page): Promise<Record<string, unknown>> => {
  await page.locator(THEME_SWAP_LOCATOR).first().click();
  await wait(page, MS_EIGHT_HUNDRED);
  await shot(page, "03-ui-theme-business");
  await openResumeExportSurface(page);
  await shot(page, "04-resume-editor");
  const resumePdf = await assertRealPdfFile(
    await exportPdf(page, "resume-export.pdf", RE_EXPORT_RESUME),
  );
  await shot(page, "05-resume-pdf-exported");
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.coverLetter}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  await openEditorByVisibleEdit(page, RE_EDIT_COVER);
  await page.getByRole("button", { name: RE_EXPORT_COVER }).first().waitFor({
    state: "visible",
    timeout: MS_SIXTY_SECONDS,
  });
  await shot(page, "06-cover-letter-editor");
  const coverPdf = await assertRealPdfFile(
    await exportPdf(page, "cover-letter-export.pdf", RE_EXPORT_COVER),
  );
  await shot(page, "07-cover-pdf-exported");
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.portfolio}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  const templateSelect = page.getByLabel("Portfolio export template");
  await templateSelect.waitFor({ state: "visible", timeout: MS_SIXTY_SECONDS });
  await templateSelect.selectOption("gaming");
  await wait(page, MS_FOUR_HUNDRED);
  await shot(page, "08-portfolio-gaming-template");
  const portfolioPath = await exportPdf(page, "portfolio-gaming.pdf", RE_EXPORT_PORTFOLIO);
  const portfolioPdf = await assertRealPdfFile(portfolioPath);
  const paletteOk = await assertPdfContainsRgbFill(
    portfolioPath,
    PORTFOLIO_EXPORT_THEME_BY_TEMPLATE.gaming.primary,
    "portfolio-gaming-primary",
  );
  if (!paletteOk) {
    throw new Error("Portfolio gaming PDF missing SSOT primary fill");
  }
  await shot(page, "09-portfolio-pdf-exported");
  await page.locator(THEME_SWAP_LOCATOR).first().click();
  await wait(page, MS_SIX_HUNDRED);
  await shot(page, "10-ui-theme-corporate");
  return { resumePdf, coverPdf, portfolioPdf, portfolioTemplate: "gaming" };
};

const tour = async (page: Page): Promise<Record<string, unknown>> => {
  const nonce = await tourAiChat(page);
  const pdfs = await tourDocumentExportPdfs(page);
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
