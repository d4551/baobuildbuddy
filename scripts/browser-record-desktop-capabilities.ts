/**
 * Headed desktop capability proof: Cmd+K OmniSearch, theme flip, full route stills + WebM.
 */
import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { writeError, writeOutput } from "./utils/cli-output";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const OUT =
  process.env.CAPABILITY_PROOF_OUT ??
  join("/opt/cursor/artifacts/visual-mission/desktop-capabilities");

const ROUTES: readonly { readonly name: string; readonly path: string }[] = [
  { name: "05-jobs", path: APP_ROUTES.jobs },
  { name: "06-resume", path: APP_ROUTES.resume },
  { name: "07-cover-letter", path: APP_ROUTES.coverLetter },
  { name: "08-portfolio", path: APP_ROUTES.portfolio },
  { name: "09-interview", path: APP_ROUTES.interview },
  { name: "10-skills", path: APP_ROUTES.skills },
  { name: "11-studios", path: APP_ROUTES.studios },
  { name: "12-ai-dashboard", path: APP_ROUTES.aiDashboard },
  { name: "13-ai-chat", path: APP_ROUTES.aiChat },
  { name: "14-automation", path: APP_ROUTES.automation },
  { name: "15-job-apply", path: APP_ROUTES.automationJobApply },
  { name: "16-scraper", path: APP_ROUTES.automationScraper },
  { name: "17-email", path: APP_ROUTES.automationEmail },
  { name: "18-runs", path: APP_ROUTES.automationRuns },
  { name: "19-gamification", path: APP_ROUTES.gamification },
  { name: "20-api-docs", path: APP_ROUTES.apiDocs },
  { name: "21-settings", path: APP_ROUTES.settings },
  { name: "22-setup", path: APP_ROUTES.setup },
];

const main = async (): Promise<void> => {
  await mkdir(OUT, { recursive: true });
  const rawDir = join(OUT, "raw");
  await mkdir(rawDir, { recursive: true });

  const findings: string[] = [];
  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-dev-shm-usage", "--window-position=40,40"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: rawDir, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();

  const shot = async (name: string): Promise<void> => {
    await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: false });
  };

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.dashboard}`, {
    waitUntil: "networkidle",
    timeout: 60_000,
  });
  await page.waitForTimeout(1_200);
  await shot("01-dashboard");

  await page.keyboard.press("Control+k");
  await page.waitForTimeout(700);
  const omniOpen = await page.locator("#workspace-omni-search-title").isVisible();
  const omniFocus = await page.evaluate(
    () => document.activeElement?.id === "workspace-omni-search-input",
  );
  await shot("02-omni-search-cmdk");
  if (!omniOpen || !omniFocus) {
    findings.push("Cmd+K OmniSearch failed open/focus");
  }

  await page.fill("#workspace-omni-search-input", "unity");
  await page.waitForTimeout(400);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1_400);
  await shot("03-omni-search-results");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  let stillOpenAfterEscape = await page.locator("dialog[open] #workspace-omni-search-title").isVisible();
  if (stillOpenAfterEscape) {
    findings.push("OmniSearch stayed open after Escape");
    await page
      .locator("dialog[open] button[aria-label='Close workspace search']")
      .first()
      .click({ timeout: 5_000 });
    await page.waitForTimeout(400);
    stillOpenAfterEscape = await page.locator("dialog[open] #workspace-omni-search-title").isVisible();
    if (stillOpenAfterEscape) {
      findings.push("OmniSearch stayed open after close button");
    }
  }

  const beforeTheme = await page.evaluate(
    () => document.querySelector("[data-theme]")?.getAttribute("data-theme") ?? "",
  );
  await page.locator("label.swap").first().click({ timeout: 5_000 });
  await page.waitForTimeout(500);
  const afterTheme = await page.evaluate(
    () => document.querySelector("[data-theme]")?.getAttribute("data-theme") ?? "",
  );
  await shot("04-theme-business");
  if (!beforeTheme || !afterTheme || beforeTheme === afterTheme) {
    findings.push(`Theme flip failed ${beforeTheme}->${afterTheme}`);
  }
  await page.locator("label.swap").first().click({ timeout: 5_000 });
  await page.waitForTimeout(300);

  for (const route of ROUTES) {
    await page.goto(`${CLIENT_BASE}${route.path}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForTimeout(1_100);
    const mainCount = await page.locator("main").count();
    const h1 = await page
      .locator("h1")
      .first()
      .innerText()
      .then((value) => value.trim(), () => "");
    if (mainCount !== 1) {
      findings.push(`${route.path}: main count ${String(mainCount)}`);
    }
    if (h1.length === 0) {
      findings.push(`${route.path}: missing h1`);
    }
    await shot(route.name);
  }

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.jobs}`, {
    waitUntil: "networkidle",
    timeout: 60_000,
  });
  await page.waitForTimeout(1_000);
  const floatingChatButtons = await page.locator("button[aria-label*='chat' i]").count();
  await shot("23-jobs-floating-chrome");

  const video = page.video();
  await context.close();
  await browser.close();

  let videoPath: string | null = null;
  if (video) {
    const source = await video.path();
    const dest = join(OUT, "desktop-capabilities-tour.webm");
    await Bun.write(dest, Bun.file(source));
    videoPath = dest;
  } else {
    const segments = await readdir(rawDir);
    const webm = segments.find((name) => name.endsWith(".webm"));
    if (webm) {
      videoPath = join(OUT, "desktop-capabilities-tour.webm");
      await Bun.write(videoPath, Bun.file(join(rawDir, webm)));
    }
  }

  const report = {
    CLIENT_BASE,
    display: process.env.DISPLAY ?? null,
    omniOpen,
    omniFocus,
    theme: { before: beforeTheme, after: afterTheme },
    floatingChatButtons,
    findings,
    videoPath,
    routeCount: ROUTES.length,
  };
  await Bun.write(join(OUT, "capabilities-report.json"), JSON.stringify(report, null, 2));
  await writeOutput(`desktop-capabilities: findings=${String(findings.length)} video=${videoPath ?? "none"}`);
  for (const finding of findings) {
    if (!finding.startsWith("floatingChatButtons=")) {
      await writeError(finding);
      process.exitCode = 1;
    }
  }
};

await main();
