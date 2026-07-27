/**
 * Headed desktop capability proof: Cmd+K OmniSearch, theme flip, full route stills + WebM.
 */

import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { type Browser, type BrowserContext, chromium, type Page } from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import {
  COUNT_FIVE_HUNDRED,
  COUNT_TWO_FIFTY,
  MS_FOUR_HUNDRED,
  MS_ONE_FOUR_HUNDRED,
  MS_ONE_ONE_HUNDRED,
  MS_ONE_TWO_HUNDRED,
  MS_SECOND,
  MS_SEVEN_HUNDRED,
  MS_THREE_HUNDRED,
} from "./constants/numeric-literals";
import { writeError, writeOutput } from "./utils/cli-output";
import { settlePage } from "./utils/playwright-settle";
import {
  artifactDir,
  resolveProofClientBase,
  resolveProofEnv,
  resolveProofOutDir,
} from "./utils/proof-script-env";

const CLIENT_BASE = resolveProofClientBase("http://127.0.0.1:3001");
const OUT = resolveProofOutDir(
  "CAPABILITY_PROOF_OUT",
  artifactDir("visual-mission", "desktop-capabilities"),
);

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

type ShotFn = (name: string) => Promise<void>;

const proveOmniSearch = async (
  page: Page,
  shot: ShotFn,
  findings: string[],
): Promise<{ omniOpen: boolean; omniFocus: boolean }> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.dashboard}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await settlePage(page, MS_ONE_TWO_HUNDRED);
  await shot("01-dashboard");

  await page.keyboard.press("Control+k");
  await settlePage(page, MS_SEVEN_HUNDRED);
  const omniOpen = await page.locator("#workspace-omni-search-title").isVisible();
  const omniFocus = await page.evaluate(
    () => document.activeElement?.id === "workspace-omni-search-input",
  );
  await shot("02-omni-search-cmdk");
  if (!omniOpen || !omniFocus) {
    findings.push("Cmd+K OmniSearch failed open/focus");
  }

  await page.fill("#workspace-omni-search-input", "unity");
  await settlePage(page, MS_FOUR_HUNDRED);
  await page.keyboard.press("Enter");
  await settlePage(page, MS_ONE_FOUR_HUNDRED);
  await shot("03-omni-search-results");
  await page.locator("dialog.modal[open]").focus();
  await page.keyboard.press("Escape");
  await settlePage(page, COUNT_TWO_FIFTY);
  await page.keyboard.press("Escape");
  await settlePage(page, MS_FOUR_HUNDRED);
  const dialogOpenAfterEscape = await page.evaluate(() =>
    Boolean(document.querySelector("dialog.modal[open]")),
  );
  if (dialogOpenAfterEscape) {
    findings.push("OmniSearch stayed open after Escape");
    await page
      .locator("dialog.modal[open] button[aria-label='Close workspace search']")
      .first()
      .click({ timeout: 5_000 });
    await settlePage(page, MS_THREE_HUNDRED);
  }
  return { omniOpen, omniFocus };
};

const proveThemeFlip = async (
  page: Page,
  shot: ShotFn,
  findings: string[],
): Promise<{ before: string; after: string }> => {
  const before = await page.evaluate(
    () => document.querySelector("[data-theme]")?.getAttribute("data-theme") ?? "",
  );
  await page.locator("label.swap").first().click({ timeout: 5_000 });
  await settlePage(page, COUNT_FIVE_HUNDRED);
  const after = await page.evaluate(
    () => document.querySelector("[data-theme]")?.getAttribute("data-theme") ?? "",
  );
  await shot("04-theme-business");
  if (!before || !after || before === after) {
    findings.push(`Theme flip failed ${before}->${after}`);
  }
  await page.locator("label.swap").first().click({ timeout: 5_000 });
  await settlePage(page, MS_THREE_HUNDRED);
  return { before, after };
};

const tourRoute = async (
  page: Page,
  shot: ShotFn,
  findings: string[],
  route: (typeof ROUTES)[number],
): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${route.path}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await settlePage(page, MS_ONE_ONE_HUNDRED);
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
    findings.push(`${route.path}: main count ${String(mainCount)}`);
  }
  if (h1.length === 0) {
    findings.push(`${route.path}: missing h1`);
  }
  await shot(route.name);
};

const captureCapabilityVideo = async (
  page: Page,
  context: BrowserContext,
  browser: Browser,
  rawDir: string,
): Promise<string | null> => {
  const video = page.video();
  await context.close();
  await browser.close();
  if (video) {
    const source = await video.path();
    const dest = join(OUT, "desktop-capabilities-tour.webm");
    await Bun.write(dest, Bun.file(source));
    return dest;
  }
  const segments = await readdir(rawDir);
  const webm = segments.find((name) => name.endsWith(".webm"));
  if (!webm) {
    return null;
  }
  const videoPath = join(OUT, "desktop-capabilities-tour.webm");
  await Bun.write(videoPath, Bun.file(join(rawDir, webm)));
  return videoPath;
};

const writeCapabilityFindings = async (findings: readonly string[]): Promise<void> => {
  const actionable = findings.filter((finding) => !finding.startsWith("floatingChatButtons="));
  await actionable.reduce<Promise<void>>(async (previous, finding) => {
    await previous;
    await writeError(finding);
    process.exitCode = 1;
  }, Promise.resolve());
};

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
  const shot: ShotFn = async (name) => {
    await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: false });
  };

  const { omniOpen, omniFocus } = await proveOmniSearch(page, shot, findings);
  const theme = await proveThemeFlip(page, shot, findings);
  await mapSequential(ROUTES, async (route) => tourRoute(page, shot, findings, route));

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.jobs}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await settlePage(page, MS_SECOND);
  const floatingChatButtons = await page.locator("button[aria-label*='chat' i]").count();
  await shot("23-jobs-floating-chrome");

  const videoPath = await captureCapabilityVideo(page, context, browser, rawDir);
  const report = {
    CLIENT_BASE,
    display: resolveProofEnv("DISPLAY") ?? null,
    omniOpen,
    omniFocus,
    theme,
    floatingChatButtons,
    findings,
    videoPath,
    routeCount: ROUTES.length,
  };
  await Bun.write(join(OUT, "capabilities-report.json"), JSON.stringify(report, null, 2));
  await writeOutput(
    `desktop-capabilities: findings=${String(findings.length)} video=${videoPath ?? "none"}`,
  );
  await writeCapabilityFindings(findings);
};

await main();
