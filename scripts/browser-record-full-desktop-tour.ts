/**
 * Full desktop (1440×900) headed tour: every primary page + live capabilities.
 * UI click/type only. Video + stills. Fail-closed on missing main/h1/console.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  type Browser,
  type BrowserContext,
  type ConsoleMessage,
  chromium,
  type Page,
} from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import {
  COUNT_FIVE,
  COUNT_FIVE_HUNDRED,
  COUNT_THIRTY_SIX,
  COUNT_TWENTY,
  COUNT_TWO_FORTY,
  MS_EIGHT_HUNDRED,
  MS_EIGHT_SECONDS,
  MS_FORTY_FIVE_SECONDS,
  MS_FOUR_HUNDRED,
  MS_ONE_TWO_HUNDRED,
  MS_SECOND,
  MS_SIX_HUNDRED,
  MS_THREE_HUNDRED,
  VIEWPORT_HEIGHT_DESKTOP,
} from "./constants/numeric-literals";
import { writeError, writeOutput } from "./utils/cli-output";
import { assertLiveInference } from "./utils/live-ai-probe";
import { assertRealPdfFile } from "./utils/live-pdf-assert";
import { settlePage } from "./utils/playwright-settle";
import { reportFindingsAndExit } from "./utils/proof-findings";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const OUT =
  process.env.FULL_DESKTOP_TOUR_OUT ?? "/opt/cursor/artifacts/live-capabilities/full-desktop-tour";
const MODEL = process.env.LOCAL_MODEL_NAME?.trim() || "llama3.2:1b";
const ENDPOINT =
  process.env.LOCAL_MODEL_ENDPOINT?.replace(/\/$/u, "") ?? "http://127.0.0.1:11434/v1";

const ROUTES: readonly { readonly slug: string; readonly path: string }[] = [
  { slug: "dashboard", path: APP_ROUTES.dashboard },
  { slug: "jobs", path: APP_ROUTES.jobs },
  { slug: "resume", path: APP_ROUTES.resume },
  { slug: "cover-letter", path: APP_ROUTES.coverLetter },
  { slug: "portfolio", path: APP_ROUTES.portfolio },
  { slug: "interview", path: APP_ROUTES.interview },
  { slug: "skills", path: APP_ROUTES.skills },
  { slug: "studios", path: APP_ROUTES.studios },
  { slug: "ai-dashboard", path: APP_ROUTES.aiDashboard },
  { slug: "ai-chat", path: APP_ROUTES.aiChat },
  { slug: "automation", path: APP_ROUTES.automation },
  { slug: "automation-scraper", path: APP_ROUTES.automationScraper },
  { slug: "automation-job-apply", path: APP_ROUTES.automationJobApply },
  { slug: "automation-email", path: APP_ROUTES.automationEmail },
  { slug: "automation-runs", path: APP_ROUTES.automationRuns },
  { slug: "gamification", path: APP_ROUTES.gamification },
  { slug: "api-docs", path: APP_ROUTES.apiDocs },
  { slug: "settings", path: APP_ROUTES.settings },
  { slug: "setup", path: APP_ROUTES.setup },
];

const SEND_BUTTON_PATTERN = /send/iu;
const RE_EXPORT = /Export/i;
const RE_EXPORT_PDF = /Export PDF|^PDF$/i;
const RE_EDIT_RESUME = /Edit resume/i;
const RE_RUN_JOB_SCRAPER = /Run job scraper/i;
const THEME_SWAP_LOCATOR = "label.swap.swap-rotate";

const wait = settlePage;

const mapSequential = async <TItem>(
  items: readonly TItem[],
  mapper: (item: TItem) => Promise<void>,
  index = 0,
): Promise<void> => {
  const item = items[index];
  if (item === undefined) {
    return;
  }
  await mapper(item);
  await mapSequential(items, mapper, index + 1);
};

const shot = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({ path: join(OUT, "stills", `${name}.png`), fullPage: false });
};

const assertPageShell = async (page: Page, slug: string, findings: string[]): Promise<void> => {
  const mainCount = await page.locator("main").count();
  const h1 = await page
    .locator("h1")
    .first()
    .innerText()
    .then(
      (value) => value.trim(),
      () => "",
    );
  if (mainCount !== 1) {
    findings.push(`${slug}: main count ${String(mainCount)}`);
  }
  if (h1.length === 0) {
    findings.push(`${slug}: missing h1`);
  }
};

const tourPageGallery = async (page: Page, findings: string[]): Promise<void> => {
  await mapSequential(ROUTES, async (route) => {
    await page.goto(`${CLIENT_BASE}${route.path}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await wait(page, VIEWPORT_HEIGHT_DESKTOP);
    await assertPageShell(page, route.slug, findings);
    await shot(page, `page-${route.slug}`);
  });
};

const proveOmniSearch = async (page: Page, findings: string[]): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.dashboard}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_EIGHT_HUNDRED);
  await page.keyboard.press("Control+k");
  await wait(page, MS_SIX_HUNDRED);
  const omniOpen = await page.locator("#workspace-omni-search-title").isVisible();
  if (!omniOpen) {
    findings.push("Cmd+K OmniSearch did not open");
  }
  await page.fill("#workspace-omni-search-input", "unity");
  await page.keyboard.press("Enter");
  await wait(page, MS_ONE_TWO_HUNDRED);
  await shot(page, "cap-01-omni-search");
  await page
    .locator("dialog.modal[open] button[aria-label='Close workspace search']")
    .first()
    .click({});
  await wait(page, MS_THREE_HUNDRED);
};

const proveThemeFlip = async (page: Page, findings: string[]): Promise<string> => {
  await page.locator(THEME_SWAP_LOCATOR).first().click();
  await wait(page, COUNT_FIVE_HUNDRED);
  const theme = await page.evaluate(
    () => document.querySelector("[data-theme]")?.getAttribute("data-theme") ?? "",
  );
  await shot(page, "cap-02-theme-business");
  if (theme !== "business") {
    findings.push(`Theme flip expected business got ${theme}`);
  }
  return theme;
};

const proveAiChat = async (page: Page, findings: string[]): Promise<string> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.aiChat}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_SECOND);
  const nonce = `BAO_TOUR_${Date.now().toString(COUNT_THIRTY_SIX)}`;
  const composer = page.locator("textarea").first();
  await composer.click();
  await composer.fill("");
  await composer.pressSequentially(`Reply with ONLY this exact token and nothing else: ${nonce}`, {
    delay: 10,
  });
  await page.getByRole("button", { name: SEND_BUTTON_PATTERN }).first().click();
  await wait(page, MS_FORTY_FIVE_SECONDS);
  const chatBody = await page.locator("main").innerText();
  if (!chatBody.includes(nonce)) {
    findings.push(`AI chat missing nonce ${nonce}`);
  }
  await shot(page, "cap-03-ai-chat-nonce");
  return nonce;
};

const proveResumePdf = async (page: Page, findings: string[]): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resume}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_SECOND);
  await page.getByRole("button", { name: RE_EDIT_RESUME }).first().click();
  await wait(page, MS_SECOND);
  await page.getByRole("button", { name: RE_EXPORT }).first().click();
  await wait(page, MS_FOUR_HUNDRED);
  const downloadPromise = page.waitForEvent("download", { timeout: 45_000 });
  await page.getByRole("menuitem", { name: RE_EXPORT_PDF }).first().click();
  const downloadResult = await settle(downloadPromise);
  if (downloadResult.status === "rejected") {
    findings.push(`Resume PDF failed: ${downloadResult.reason.message}`);
  } else {
    const pdfPath = join(OUT, "downloads", "tour-resume.pdf");
    await downloadResult.value.saveAs(pdfPath);
    const assertion = await assertRealPdfFile(pdfPath);
    if (!assertion.ok) {
      findings.push("Resume PDF not real");
    }
  }
  await shot(page, "cap-04-resume-pdf");
};

const proveRpaScraper = async (page: Page, findings: string[]): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.automationScraper}`, {
    waitUntil: "domcontentloaded",
  });
  await wait(page, MS_ONE_TWO_HUNDRED);
  const runJob = page.getByRole("button", { name: RE_RUN_JOB_SCRAPER }).first();
  if ((await runJob.count()) > 0 && !(await runJob.isDisabled())) {
    await runJob.click();
    await wait(page, MS_EIGHT_SECONDS);
  } else {
    findings.push("Run Job Scraper unavailable");
  }
  await shot(page, "cap-05-rpa-scraper");
  await page.locator(THEME_SWAP_LOCATOR).first().click();
  await wait(page, MS_FOUR_HUNDRED);
};

const finalizeTourVideo = async (
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
  const videoPath = join(OUT, "full-desktop-tour.webm");
  await Bun.write(videoPath, Bun.file(raw));
  return videoPath;
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  await mkdir(join(OUT, "downloads"), { recursive: true });
  await mkdir(join(OUT, "raw"), { recursive: true });

  const probe = await assertLiveInference({ modelId: MODEL, endpoint: ENDPOINT });
  const findings: string[] = [];
  const consoleErrors: string[] = [];

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-dev-shm-usage", "--window-position=40,40"],
  });
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: join(OUT, "raw"), size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  page.on("console", (message: ConsoleMessage) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text().slice(0, COUNT_TWO_FORTY));
    }
  });
  page.on("pageerror", (error: Error) => {
    consoleErrors.push(`[pageerror] ${error.message.slice(0, COUNT_TWO_FORTY)}`);
  });

  await tourPageGallery(page, findings);
  await proveOmniSearch(page, findings);
  const theme = await proveThemeFlip(page, findings);
  const nonce = await proveAiChat(page, findings);
  await proveResumePdf(page, findings);
  await proveRpaScraper(page, findings);

  const videoPath = await finalizeTourVideo(page, context, browser);
  const seriousConsole = consoleErrors.filter(
    (line) => !line.includes("favicon") && !line.includes("404 (Not Found)"),
  );
  if (seriousConsole.length > 0) {
    findings.push(`console errors: ${seriousConsole.slice(0, COUNT_FIVE).join(" | ")}`);
  }

  const report = {
    ok: findings.length === 0,
    mode: "desktop-1440-headed+video",
    probe,
    nonce,
    theme,
    routeCount: ROUTES.length,
    videoPath,
    findings,
    consoleErrors: seriousConsole.slice(0, COUNT_TWENTY),
  };
  await writeFile(join(OUT, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeOutput(
    `full-desktop-tour: routes=${String(ROUTES.length)} findings=${String(findings.length)} video=${videoPath ?? "none"}`,
  );
  await reportFindingsAndExit(findings);
};

const runResult = await settle(main());
if (runResult.status === "rejected") {
  await writeError(runResult.reason.message);
  process.exit(1);
}
