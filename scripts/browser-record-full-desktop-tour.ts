/**
 * Full desktop (1440×900) headed tour: every primary page + live capabilities.
 * UI click/type only. Video + stills. Fail-closed on missing main/h1/console.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type ConsoleMessage, type Page } from "playwright";
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
  process.env.FULL_DESKTOP_TOUR_OUT ??
  "/opt/cursor/artifacts/live-capabilities/full-desktop-tour";
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

const wait = async (page: Page, ms: number): Promise<void> => {
  await page.waitForTimeout(ms);
};

const shot = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({ path: join(OUT, "stills", `${name}.png`), fullPage: false });
};

const assertPageShell = async (
  page: Page,
  slug: string,
  findings: string[],
): Promise<void> => {
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
      consoleErrors.push(message.text().slice(0, 240));
    }
  });
  page.on("pageerror", (error: Error) => {
    consoleErrors.push(`[pageerror] ${error.message.slice(0, 240)}`);
  });

  // --- Page gallery ---
  for (const route of ROUTES) {
    await page.goto(`${CLIENT_BASE}${route.path}`, {
      waitUntil: "networkidle",
      timeout: 60_000,
    });
    await wait(page, 900);
    await assertPageShell(page, route.slug, findings);
    await shot(page, `page-${route.slug}`);
  }

  // --- Capability: OmniSearch ---
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.dashboard}`, { waitUntil: "networkidle" });
  await wait(page, 800);
  await page.keyboard.press("Control+k");
  await wait(page, 600);
  const omniOpen = await page.locator("#workspace-omni-search-title").isVisible();
  if (!omniOpen) {
    findings.push("Cmd+K OmniSearch did not open");
  }
  await page.fill("#workspace-omni-search-input", "unity");
  await page.keyboard.press("Enter");
  await wait(page, 1_200);
  await shot(page, "cap-01-omni-search");
  await page.locator("dialog.modal[open] button[aria-label='Close workspace search']").first().click({
    force: true,
  });
  await wait(page, 300);

  // --- Capability: Theme ---
  await page.locator(THEME_SWAP_LOCATOR).first().click();
  await wait(page, 500);
  const theme = await page.evaluate(
    () => document.querySelector("[data-theme]")?.getAttribute("data-theme") ?? "",
  );
  await shot(page, "cap-02-theme-business");
  if (theme !== "business") {
    findings.push(`Theme flip expected business got ${theme}`);
  }

  // --- Capability: AI chat (mandatory live) ---
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.aiChat}`, { waitUntil: "networkidle" });
  await wait(page, 1_000);
  const nonce = `BAO_TOUR_${Date.now().toString(36)}`;
  const composer = page.locator("textarea").first();
  await composer.click();
  await composer.fill("");
  await composer.pressSequentially(
    `Reply with ONLY this exact token and nothing else: ${nonce}`,
    { delay: 10 },
  );
  await page.getByRole("button", { name: SEND_BUTTON_PATTERN }).first().click();
  await wait(page, 45_000);
  const chatBody = await page.locator("main").innerText();
  if (!chatBody.includes(nonce)) {
    findings.push(`AI chat missing nonce ${nonce}`);
  }
  await shot(page, "cap-03-ai-chat-nonce");

  // --- Capability: PDF export ---
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resume}`, { waitUntil: "networkidle" });
  await wait(page, 1_000);
  await page.getByRole("button", { name: RE_EDIT_RESUME }).first().click();
  await wait(page, 1_000);
  await page.getByRole("button", { name: RE_EXPORT }).first().click();
  await wait(page, 400);
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

  // --- Capability: RPA scraper ---
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.automationScraper}`, {
    waitUntil: "networkidle",
  });
  await wait(page, 1_200);
  const runJob = page.getByRole("button", { name: RE_RUN_JOB_SCRAPER }).first();
  if ((await runJob.count()) > 0 && !(await runJob.isDisabled())) {
    await runJob.click();
    await wait(page, 8_000);
  } else {
    findings.push("Run Job Scraper unavailable");
  }
  await shot(page, "cap-05-rpa-scraper");

  await page.locator(THEME_SWAP_LOCATOR).first().click();
  await wait(page, 400);

  const video = page.video();
  await context.close();
  await browser.close();

  let videoPath: string | null = null;
  if (video) {
    const raw = await video.path();
    videoPath = join(OUT, "full-desktop-tour.webm");
    await Bun.write(videoPath, Bun.file(raw));
  }

  const seriousConsole = consoleErrors.filter(
    (line) => !line.includes("favicon") && !line.includes("404 (Not Found)"),
  );
  if (seriousConsole.length > 0) {
    findings.push(`console errors: ${seriousConsole.slice(0, 5).join(" | ")}`);
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
    consoleErrors: seriousConsole.slice(0, 20),
  };
  await writeFile(join(OUT, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeOutput(
    `full-desktop-tour: routes=${String(ROUTES.length)} findings=${String(findings.length)} video=${videoPath ?? "none"}`,
  );
  if (findings.length > 0) {
    for (const finding of findings) {
      await writeError(finding);
    }
    process.exit(1);
  }
};

const runResult = await settle(main());
if (runResult.status === "rejected") {
  await writeError(runResult.reason.message);
  process.exit(1);
}
