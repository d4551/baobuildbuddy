const NUM_12 = 12;
const NUM_1500 = 1_500;
const NUM_2000 = 2_000;
const NUM_40 = 40;

/**
 * Browser-only visual smoke (Playwright). No curl / raw API fetch.
 * Navigates Nuxt routes, captures screenshots + console errors.
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { type ConsoleMessage, chromium, type Page } from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import {
  collectPageSignals,
  isMobileAiOrAutomationRoute,
  scoreSmokeRoute,
} from "./browser-visual-smoke-signals";
import { writeError, writeOutput } from "./utils/cli-output";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const OUT_DIR =
  process.env.BROWSER_SMOKE_OUT ?? join(process.cwd(), "artifacts", "baseline", "browser-smoke");
const VIEWPORTS = [
  { name: "mobile", width: 320, height: 720 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

const STATIC_ROUTES = [
  ["dashboard", APP_ROUTES.dashboard],
  ["setup", APP_ROUTES.setup],
  ["jobs", APP_ROUTES.jobs],
  ["resume", APP_ROUTES.resume],
  ["cover-letter", APP_ROUTES.coverLetter],
  ["portfolio", APP_ROUTES.portfolio],
  ["interview", APP_ROUTES.interview],
  ["skills", APP_ROUTES.skills],
  ["studios", APP_ROUTES.studios],
  ["ai-chat", APP_ROUTES.aiChat],
  ["ai-dashboard", APP_ROUTES.aiDashboard],
  ["automation", APP_ROUTES.automation],
  ["automation-job-apply", APP_ROUTES.automationJobApply],
  ["automation-scraper", APP_ROUTES.automationScraper],
  ["automation-email", APP_ROUTES.automationEmail],
  ["automation-runs", APP_ROUTES.automationRuns],
  ["gamification", APP_ROUTES.gamification],
  ["docs-api", APP_ROUTES.apiDocs],
  ["settings", APP_ROUTES.settings],
] as const;

const LOADING_STATUS_TEXT_PATTERN = /^Loading$/u;

const waitForPageReady = async (page: Page, timeout: number): Promise<void> => {
  await page
    .locator("body")
    .waitFor({ state: "visible", timeout })
    .then(
      () => undefined,
      () => undefined,
    );
  await page.waitForLoadState("domcontentloaded", { timeout }).then(
    () => undefined,
    () => undefined,
  );
};

type RouteResult = {
  readonly slug: string;
  readonly route: string;
  readonly viewport: string;
  readonly title: string;
  readonly h1: string | null;
  readonly mainCount: number;
  readonly consoleErrors: readonly string[];
  readonly pageErrors: readonly string[];
  readonly screenshot: string;
  readonly ok: boolean;
  readonly reason: string | null;
};

const waitForMobileDockActive = async (page: Page, viewportName: string, route: string) => {
  if (viewportName !== "mobile" || !isMobileAiOrAutomationRoute(route)) return;
  await page
    .locator('nav.dock a[aria-current="page"], nav.dock a.dock-active')
    .first()
    .waitFor({ state: "attached", timeout: 5_000 })
    .then(
      () => undefined,
      () => undefined,
    );
};

const smokeRoute = async (
  page: Page,
  slug: string,
  route: string,
  viewportName: string,
): Promise<RouteResult> => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const onConsole = (message: ConsoleMessage): void => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  };
  const onPageError = (error: Error): void => {
    pageErrors.push(error.message);
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  const screenshot = join(OUT_DIR, `${viewportName}-${slug}.png`);
  await page.goto(`${CLIENT_BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await waitForPageReady(page, NUM_2000);
  await waitForMobileDockActive(page, viewportName, route);
  if (route === APP_ROUTES.settings) {
    await page
      .getByTestId("settings-auth-access-status")
      .filter({ hasNotText: LOADING_STATUS_TEXT_PATTERN })
      .waitFor({ state: "visible", timeout: 8_000 })
      .then(
        () => undefined,
        () => undefined,
      );
  }
  const title = await page.title();
  const signals = await collectPageSignals(page);
  await page.screenshot({ path: screenshot, fullPage: true });
  const reason = scoreSmokeRoute(viewportName, route, title, signals, pageErrors);

  page.off("console", onConsole);
  page.off("pageerror", onPageError);

  return {
    slug,
    route,
    viewport: viewportName,
    title,
    h1: signals.h1,
    mainCount: signals.mainCount,
    consoleErrors,
    pageErrors,
    screenshot,
    ok: reason === null,
    reason,
  };
};

const mapSequential = async <TItem, TResult>(
  items: readonly TItem[],
  mapper: (item: TItem, index: number) => Promise<TResult>,
  index = 0,
): Promise<TResult[]> => {
  const item = items[index];
  if (item === undefined) {
    return [];
  }
  const head = await mapper(item, index);
  const rest = await mapSequential(items, mapper, index + 1);
  return [head, ...rest];
};

const clickFirstNavLinks = async (page: Page, viewportName: string): Promise<RouteResult[]> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.dashboard}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await waitForPageReady(page, NUM_1500);

  // Prefer sidebar / drawer links for primary discovery.
  const hrefs = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll("a[href]"));
    const paths = anchors
      .map((anchor) => anchor.getAttribute("href") ?? "")
      .filter((href) => href.startsWith("/") && !href.startsWith("//"));
    return [...new Set(paths)].slice(0, NUM_12);
  });

  return mapSequential(hrefs, async (href, index) => {
    const slug = `nav-${String(index)}-${href.replace(/[^\w-]+/gu, "_")}`;
    return smokeRoute(page, slug, href, viewportName);
  });
};

const smokeViewport = async (
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  viewport: (typeof VIEWPORTS)[number],
): Promise<RouteResult[]> => {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
  });
  const staticResults = await mapSequential(STATIC_ROUTES, async ([slug, route]) =>
    smokeRoute(page, slug, route, viewport.name),
  );
  const navResults =
    viewport.name === "desktop" ? await clickFirstNavLinks(page, "desktop-nav") : [];
  await page.close();
  return [...staticResults, ...navResults];
};

const resolveSmokeLaunchOptions = (): {
  headless: boolean;
  channel?: "chrome";
} => {
  // Visual proof defaults to headed Chromium when a display is available.
  // Set PAGE_PROOF_HEADLESS=true only for CI environments without a display.
  const forceHeadless = process.env.PAGE_PROOF_HEADLESS === "true";
  const hasDisplay = Boolean(process.env.DISPLAY && process.env.DISPLAY.length > 0);
  if (forceHeadless || !hasDisplay) {
    return { headless: true };
  }
  return { headless: false, channel: "chrome" };
};

const main = async (): Promise<void> => {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch(resolveSmokeLaunchOptions());
  const reportChunks = await mapSequential(VIEWPORTS, async (viewport) =>
    smokeViewport(browser, viewport),
  );
  const report = reportChunks.flat();

  await browser.close();
  const failures = report.filter((item) => !item.ok || item.consoleErrors.length > 0);
  const summaryPath = join(OUT_DIR, "report.json");
  await Bun.write(summaryPath, JSON.stringify({ CLIENT_BASE, report, failures }, null, 2));

  await writeOutput(
    `browser-visual-smoke: ${String(report.length)} captures, ${String(failures.length)} failures → ${summaryPath}`,
  );
  const failureLines = failures
    .slice(0, NUM_40)
    .map(
      (failure) =>
        `- ${failure.viewport}/${failure.slug} ${failure.route}: ${failure.reason ?? "console"} | console=${String(failure.consoleErrors.length)}`,
    );
  if (failureLines.length > 0) {
    await writeError(failureLines.join("\n"));
  }
  if (failures.length > 0) {
    process.exitCode = 1;
  }
};

await main();
