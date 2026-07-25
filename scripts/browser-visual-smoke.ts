/**
 * Browser-only visual smoke (Playwright). No curl / raw API fetch.
 * Navigates Nuxt routes, captures screenshots + console errors.
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type ConsoleMessage, type Page } from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { writeError, writeOutput } from "./utils/cli-output";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const OUT_DIR =
  process.env.BROWSER_SMOKE_OUT ?? join("/opt/cursor/artifacts/baseline/browser-smoke");
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

const collectPageSignals = async (page: Page) =>
  page.evaluate((aiRoutePrefix: string) => {
    const collapse = (value: string): string =>
      value
        .split(" ")
        .flatMap((part) => part.split("\t"))
        .flatMap((part) => part.split("\n"))
        .flatMap((part) => part.split("\r"))
        .filter((part) => part.length > 0)
        .join(" ")
        .trim();
    const isLevelLabel = (value: string): boolean => {
      if (!value.startsWith("Level ")) {
        return false;
      }
      const digits = value.slice("Level ".length);
      return digits.length > 0 && [...digits].every((char) => char >= "0" && char <= "9");
    };
    const h1 = document.querySelector("h1");
    const mains = document.querySelectorAll("main");
    const dockActive = Array.from(
      document.querySelectorAll('nav.dock a[aria-current="page"], nav.dock a.dock-active'),
    ).map((el) => ({
      href: el.getAttribute("href"),
      label: collapse(el.getAttribute("aria-label") ?? el.textContent ?? ""),
    }));
    const tables = Array.from(document.querySelectorAll("table.table")).map((table) => {
      const rect = table.getBoundingClientRect();
      return { width: rect.width, visible: rect.width > 0 && rect.height > 0 };
    });
    const underTouch = Array.from(
      document.querySelectorAll("nav.dock a, .menu a.min-h-11, .menu a.h-11, .menu button.min-h-11"),
    )
      .map((el) => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (rect.width <= 0 || rect.height <= 0 || style.visibility === "hidden" || style.display === "none") {
          return null;
        }
        // Closed dropdown/details content is not an active touch target — skip.
        const details = el.closest("details");
        if (details && !details.open) {
          return null;
        }
        return {
          label: collapse(el.getAttribute("aria-label") ?? el.textContent ?? "").slice(0, 40),
          h: rect.height,
          under: rect.height + 0.5 < 44,
        };
      })
      .filter((row): row is { label: string; h: number; under: boolean } => row !== null && row.under);
    const setupCtaVisible = Array.from(document.querySelectorAll("a.btn, button.btn")).some((el) => {
      const rect = el.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        collapse(el.textContent ?? "").toLowerCase().includes("complete setup")
      );
    });
    const levelLabelVisible = Array.from(document.querySelectorAll("p, span, h2, h3, div")).some(
      (el) => {
        if (el.childElementCount > 2) {
          return false;
        }
        const rect = el.getBoundingClientRect();
        const text = collapse(el.textContent ?? "");
        return rect.width > 0 && rect.height > 0 && isLevelLabel(text);
      },
    );
    const setupXpConflict = setupCtaVisible && levelLabelVisible;
    const floatingChatVisible = [...document.querySelectorAll("button, a")].some((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return false;
      }
      const aria = (el.getAttribute("aria-label") ?? "").toLowerCase();
      return aria.includes("floating chat") || aria.includes("show floating chat");
    });
    const dockHasAiChat = [...document.querySelectorAll("nav.dock a")].some((a) => {
      const href = a.getAttribute("href") ?? "";
      return href === aiRoutePrefix || href.startsWith(`${aiRoutePrefix}/`);
    });
    return {
      h1: h1?.textContent ? collapse(h1.textContent) : null,
      mainCount: mains.length,
      bodySnippet: collapse(document.body?.innerText ?? "").slice(0, 240),
      dockActive,
      tables,
      underTouch,
      setupXpConflict,
      floatingChatVisible,
      dockHasAiChat,
    };
  }, APP_ROUTES.ai);

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

  const url = `${CLIENT_BASE}${route}`;
  const screenshot = join(OUT_DIR, `${viewportName}-${slug}.png`);
  let reason: string | null = null;

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(2_000);
  const title = await page.title();
  const signals = await collectPageSignals(page);
  await page.screenshot({ path: screenshot, fullPage: true });

  if (signals.mainCount !== 1) {
    reason = `expected 1 main landmark, got ${String(signals.mainCount)}`;
  } else if (!signals.h1 || signals.h1.length === 0) {
    reason = "missing h1";
  } else if (title.trim().length === 0) {
    reason = "empty title";
  } else if (pageErrors.length > 0) {
    reason = `pageerror: ${pageErrors[0] ?? "unknown"}`;
  } else if (
    viewportName === "mobile" &&
    (route === APP_ROUTES.ai || route.startsWith(`${APP_ROUTES.ai}/`)) &&
    signals.dockActive.length === 0
  ) {
    // Automation lives in sidebar Work group only (IA cutover); AI still requires dock active.
    reason = `dock orphan on ${route} — expected aria-current/dock-active`;
  } else if (
    viewportName === "mobile" &&
    route === APP_ROUTES.automationRuns &&
    signals.tables.some((table) => table.visible && table.width > 360)
  ) {
    reason = `automation runs table still wide @320 (max visible ${String(
      Math.max(0, ...signals.tables.filter((table) => table.visible).map((table) => table.width)),
    )}px)`;
  } else if (viewportName === "mobile" && signals.underTouch.length > 0) {
    reason = `touch target under 44px: ${signals.underTouch[0]?.label ?? "unknown"} (${String(
      signals.underTouch[0]?.h ?? 0,
    )}px)`;
  } else if (route === APP_ROUTES.dashboard && signals.setupXpConflict) {
    reason = "dashboard Setup CTA vs Level/XP gamification contradiction";
  } else if (
    viewportName === "mobile" &&
    signals.floatingChatVisible &&
    signals.dockHasAiChat
  ) {
    reason = "dual chat chrome: floating FAB + dock AI Chat below lg";
  }

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
  await page.waitForTimeout(1_500);

  // Prefer sidebar / drawer links for primary discovery.
  const hrefs = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll("a[href]"));
    const paths = anchors
      .map((anchor) => anchor.getAttribute("href") ?? "")
      .filter((href) => href.startsWith("/") && !href.startsWith("//"));
    return [...new Set(paths)].slice(0, 12);
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

const main = async (): Promise<void> => {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
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
    .slice(0, 40)
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
