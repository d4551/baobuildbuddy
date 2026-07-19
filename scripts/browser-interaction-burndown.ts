/**
 * Browser interaction burndown — Playwright only (no curl / API inject).
 * Loads each route, asserts shell landmarks, clicks up to 3 labeled buttons
 * (scrolls into view, dismisses dialogs), probes one textbox.
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type ConsoleMessage, type Page } from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import { writeError, writeOutput } from "./utils/cli-output";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://localhost:3001").replace(
  /\/$/u,
  "",
);
const OUT_DIR =
  process.env.BROWSER_BURNOUT_OUT ?? join("/opt/cursor/artifacts/baseline/browser-burndown");
const CLICK_TIMEOUT_MS = 2_500;
const MAX_CLICKS_PER_ROUTE = 3;

const ROUTES = [
  APP_ROUTES.dashboard,
  APP_ROUTES.jobs,
  APP_ROUTES.resume,
  APP_ROUTES.coverLetter,
  APP_ROUTES.portfolio,
  APP_ROUTES.interview,
  APP_ROUTES.skills,
  APP_ROUTES.studios,
  APP_ROUTES.aiDashboard,
  APP_ROUTES.aiChat,
  APP_ROUTES.automation,
  APP_ROUTES.automationJobApply,
  APP_ROUTES.automationScraper,
  APP_ROUTES.automationEmail,
  APP_ROUTES.automationRuns,
  APP_ROUTES.gamification,
  APP_ROUTES.apiDocs,
  APP_ROUTES.settings,
  APP_ROUTES.setup,
] as const;

type Finding = {
  readonly route: string;
  readonly action: string;
  readonly severity: "error" | "warn";
  readonly detail: string;
  readonly screenshot: string | null;
};

const mapSequential = async <TItem, TResult>(
  items: readonly TItem[],
  mapper: (item: TItem) => Promise<TResult>,
  index = 0,
): Promise<TResult[]> => {
  const item = items[index];
  if (item === undefined) {
    return [];
  }
  const head = await mapper(item);
  return [head, ...(await mapSequential(items, mapper, index + 1))];
};

const slugify = (value: string): string => value.replace(/[^\w-]+/gu, "_").slice(0, 80);

const captureFinding = async (
  page: Page,
  findings: Finding[],
  route: string,
  action: string,
  detail: string,
  severity: "error" | "warn" = "error",
): Promise<void> => {
  const screenshot = join(OUT_DIR, `${slugify(route)}__${slugify(action)}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  findings.push({ route, action, severity, detail, screenshot });
};

const openRoute = async (
  page: Page,
  route: string,
  consoleBucket: string[],
  pageErrorBucket: string[],
): Promise<void> => {
  consoleBucket.length = 0;
  pageErrorBucket.length = 0;
  await page.goto(`${CLIENT_BASE}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForTimeout(1_200);
};

const probeRouteShell = async (page: Page, route: string, findings: Finding[]): Promise<void> => {
  const shell = await page.evaluate(() => ({
    mains: document.querySelectorAll("main").length,
    h1: document.querySelector("h1")?.textContent?.replace(/\s+/gu, " ").trim() ?? "",
    title: document.title.trim(),
  }));
  if (shell.mains !== 1) {
    await captureFinding(
      page,
      findings,
      route,
      "shell-main",
      `expected 1 main, got ${String(shell.mains)}`,
    );
  }
  if (shell.h1.length === 0) {
    await captureFinding(page, findings, route, "shell-h1", "missing h1");
  }
  if (shell.title.length === 0) {
    await captureFinding(page, findings, route, "shell-title", "empty document title");
  }
};

const listClickableControlLabels = async (page: Page): Promise<readonly string[]> =>
  page.evaluate((maxClicks: number) => {
    const main = document.querySelector("main");
    if (!main) {
      return [];
    }
    const controls = Array.from(main.querySelectorAll("button"));
    const labels: string[] = [];
    for (const control of controls) {
      if (!(control instanceof HTMLElement)) {
        continue;
      }
      if (control.hasAttribute("disabled") || control.getAttribute("aria-disabled") === "true") {
        continue;
      }
      if (control.classList.contains("absolute")) {
        continue;
      }
      const style = window.getComputedStyle(control);
      if (style.visibility === "hidden" || style.display === "none") {
        continue;
      }
      const label =
        control.getAttribute("aria-label")?.trim() ||
        control.textContent?.replace(/\s+/gu, " ").trim() ||
        "";
      if (label.length > 0) {
        labels.push(label);
      }
    }
    return [...new Set(labels)].slice(0, maxClicks);
  }, MAX_CLICKS_PER_ROUTE);

const clickOneLabel = async (
  page: Page,
  route: string,
  label: string,
  findings: Finding[],
  consoleBucket: string[],
  pageErrorBucket: string[],
): Promise<void> => {
  consoleBucket.length = 0;
  pageErrorBucket.length = 0;
  const locator = page.getByRole("button", { name: label, exact: true });
  await settle(locator.first().scrollIntoViewIfNeeded());
  const clickResult = await settle(locator.first().click({ timeout: CLICK_TIMEOUT_MS }));
  if (clickResult.status === "rejected") {
    await captureFinding(
      page,
      findings,
      route,
      `click-${slugify(label)}`,
      clickResult.reason.message,
      "warn",
    );
  }
  await page.waitForTimeout(400);
  if (pageErrorBucket.length > 0) {
    await captureFinding(page, findings, route, `after-click-${slugify(label)}`, pageErrorBucket[0] ?? "");
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
};

const clickVisibleButtons = async (
  page: Page,
  route: string,
  findings: Finding[],
  consoleBucket: string[],
  pageErrorBucket: string[],
): Promise<void> => {
  const labels = await listClickableControlLabels(page);
  await mapSequential(labels, async (label) => {
    await clickOneLabel(page, route, label, findings, consoleBucket, pageErrorBucket);
    if (!page.url().includes(route) && route !== "/") {
      await openRoute(page, route, consoleBucket, pageErrorBucket);
    }
  });
};

const probeFirstTextInput = async (
  page: Page,
  route: string,
  findings: Finding[],
  consoleBucket: string[],
  pageErrorBucket: string[],
): Promise<void> => {
  const input = page.getByRole("textbox").first();
  const count = await input.count();
  if (count === 0) {
    return;
  }
  consoleBucket.length = 0;
  pageErrorBucket.length = 0;
  await settle(input.scrollIntoViewIfNeeded());
  const fillResult = await settle(input.fill("browser-burndown-probe"));
  if (fillResult.status === "rejected") {
    await captureFinding(page, findings, route, "fill-input", fillResult.reason.message, "warn");
  }
  await page.waitForTimeout(200);
  if (pageErrorBucket.length > 0) {
    await captureFinding(page, findings, route, "fill-input-pageerror", pageErrorBucket.join(" | "));
  }
};

const burnRoute = async (
  page: Page,
  route: string,
  findings: Finding[],
  consoleBucket: string[],
  pageErrorBucket: string[],
): Promise<void> => {
  await openRoute(page, route, consoleBucket, pageErrorBucket);
  if (
    pageErrorBucket.length > 0 ||
    consoleBucket.some((line) => line.includes("500") || line.includes("TypeError"))
  ) {
    await captureFinding(
      page,
      findings,
      route,
      "load",
      [...pageErrorBucket, ...consoleBucket].slice(0, 4).join(" | "),
    );
    return;
  }
  await probeRouteShell(page, route, findings);
  await clickVisibleButtons(page, route, findings, consoleBucket, pageErrorBucket);
  await openRoute(page, route, consoleBucket, pageErrorBucket);
  await probeFirstTextInput(page, route, findings, consoleBucket, pageErrorBucket);
};

const main = async (): Promise<void> => {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const findings: Finding[] = [];
  const consoleBucket: string[] = [];
  const pageErrorBucket: string[] = [];

  page.on("console", (message: ConsoleMessage) => {
    if (message.type() === "error") {
      consoleBucket.push(message.text());
    }
  });
  page.on("pageerror", (error: Error) => {
    pageErrorBucket.push(error.message);
  });

  await mapSequential(ROUTES, async (route) => {
    await burnRoute(page, route, findings, consoleBucket, pageErrorBucket);
  });

  await browser.close();
  const errors = findings.filter((finding) => finding.severity === "error");
  const reportPath = join(OUT_DIR, "burndown-report.json");
  await Bun.write(
    reportPath,
    JSON.stringify({ CLIENT_BASE, findings, errorCount: errors.length }, null, 2),
  );
  await writeOutput(
    `browser-interaction-burndown: ${String(ROUTES.length)} routes, ${String(errors.length)} errors, ${String(findings.length)} findings → ${reportPath}`,
  );
  if (errors.length > 0) {
    await writeError(
      errors
        .slice(0, 30)
        .map((finding) => `- ${finding.route} [${finding.action}]: ${finding.detail.slice(0, 220)}`)
        .join("\n"),
    );
    process.exitCode = 1;
  }
};

await main();
