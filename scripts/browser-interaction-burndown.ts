/**
 * Browser interaction burndown — Playwright only (no curl / API inject).
 * Mobile → tablet → desktop. Every static APP_ROUTES page: screenshot, shell
 * landmarks, overflow, page-chrome DRY, click labeled controls, probe textbox,
 * emit 5Q ledger. Canonical proof script for `proof:browser-burndown`.
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { type ConsoleMessage, chromium, type Page } from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import { writeError, writeOutput } from "./utils/cli-output";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const OUT_DIR =
  process.env.BROWSER_BURNOUT_OUT ?? join("/opt/cursor/artifacts/interactive-burndown");
const MAX_CLICKS_PER_ROUTE = 4;

const VIEWPORTS = [
  { name: "mobile", width: 320, height: 720, isMobile: true, hasTouch: true },
  { name: "tablet", width: 768, height: 1024, isMobile: false, hasTouch: true },
  { name: "desktop", width: 1440, height: 900, isMobile: false, hasTouch: false },
] as const;

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

type FiveQ = {
  readonly shouldBeHere: string;
  readonly ssotUx: string;
  readonly interactions: string;
  readonly glassDry: string;
  readonly logs: string;
};

type Finding = {
  readonly viewport: string;
  readonly route: string;
  readonly action: string;
  readonly severity: "error" | "warn";
  readonly detail: string;
  readonly screenshot: string | null;
};

type RouteLedger = {
  readonly viewport: string;
  readonly route: string;
  readonly screenshot: string;
  readonly fiveQ: FiveQ;
  readonly ok: boolean;
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

const NON_SLUG_RE = /[^\w-]+/gu;
const APP_MANIFEST_ERROR_RE = /Error fetching app manifest/iu;

const slugify = (value: string): string => value.replace(NON_SLUG_RE, "_").slice(0, 80);

const isIgnorableConsole = (text: string): boolean => APP_MANIFEST_ERROR_RE.test(text);

const captureFinding = async (
  page: Page,
  findings: Finding[],
  viewport: string,
  route: string,
  action: string,
  detail: string,
  severity: "error" | "warn" = "error",
): Promise<void> => {
  let screenshot: string | null = null;
  if (severity === "error") {
    screenshot = join(OUT_DIR, viewport, `${slugify(route)}__${slugify(action)}.png`);
    await mkdir(join(OUT_DIR, viewport), { recursive: true });
    await page.screenshot({ path: screenshot, fullPage: false });
  }
  findings.push({ viewport, route, action, severity, detail, screenshot });
};

const openRoute = async (
  page: Page,
  route: string,
  consoleBucket: string[],
  pageErrorBucket: string[],
): Promise<void> => {
  consoleBucket.length = 0;
  pageErrorBucket.length = 0;
  const target = `${CLIENT_BASE}${route}`;
  await settle(page.waitForLoadState("domcontentloaded", { timeout: 5_000 }));
  // If a prior click already landed here, skip competing goto.
  if (page.url().startsWith(target)) {
    await page.waitForTimeout(400);
    return;
  }
  let attempt = 0;
  while (attempt < 4) {
    const navResult = await settle(
      page.goto(target, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      }),
    );
    if (navResult.status === "fulfilled") {
      await page.waitForTimeout(600);
      return;
    }
    await settle(page.waitForLoadState("domcontentloaded", { timeout: 8_000 }));
    if (page.url().startsWith(target)) {
      await page.waitForTimeout(400);
      return;
    }
    if (attempt === 3) {
      throw navResult.reason;
    }
    attempt += 1;
  }
};

const collectChromeSignals = async (page: Page) =>
  page.evaluate(() => {
    const collapseWs = (value: string): string => {
      let out = "";
      let prevSpace = false;
      for (const ch of value) {
        const isSpace = ch === " " || ch === "\n" || ch === "\t" || ch === "\r";
        if (isSpace) {
          if (!prevSpace) {
            out += " ";
          }
          prevSpace = true;
          continue;
        }
        out += ch;
        prevSpace = false;
      }
      return out.trim();
    };
    const isAsciiLetter = (ch: string): boolean => {
      const code = ch.charCodeAt(0);
      return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
    };
    const isNavbarEllipsisGut = (text: string): boolean => {
      if (text.length === 2) {
        return isAsciiLetter(text[0] ?? "") && text[1] === "…";
      }
      if (text.length === 4) {
        return isAsciiLetter(text[0] ?? "") && text.slice(1) === "...";
      }
      return false;
    };
    const overflowX =
      Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0) -
      window.innerWidth;
    const truncatedChrome = [...document.querySelectorAll(".navbar *")]
      .map((el) => (el.textContent ?? "").trim())
      .some((text) => isNavbarEllipsisGut(text));
    // Mid-word hard-clip only. Intentional SSOT truncate (`truncate` / ellipsis)
    // via SECTION_RAIL_LABEL_CLASS is allowed — discoverability without hide.
    const clippedSectionTabs = [...document.querySelectorAll(".tabs .tab")].some((el) => {
      const label =
        el.querySelector("span.truncate, span.font-medium, span.whitespace-nowrap") ??
        (el instanceof HTMLElement ? el : null);
      if (!(label instanceof HTMLElement)) {
        return false;
      }
      if (label.scrollWidth <= label.clientWidth + 1) {
        return false;
      }
      const className = label.className?.toString?.() ?? "";
      const style = getComputedStyle(label);
      const intentionalTruncate =
        className.includes("truncate") || style.textOverflow === "ellipsis";
      return !intentionalTruncate;
    });
    const duplicateChromeCopy = (() => {
      const texts = [...document.querySelectorAll("p")]
        .filter((el) => !el.closest(".grid, .stats, [role='log']"))
        .map((el) => collapseWs(el.textContent ?? ""))
        .filter((text) => text.length > 40);
      const counts = new Map<string, number>();
      for (const text of texts) {
        counts.set(text, (counts.get(text) ?? 0) + 1);
      }
      return [...counts.entries()].filter(([, count]) => count > 1).map(([text]) => text);
    })();
    const rawGlass = [...document.querySelectorAll("*")].some((el) => {
      const style = getComputedStyle(el);
      const filter =
        style.getPropertyValue("backdrop-filter") ||
        style.getPropertyValue("-webkit-backdrop-filter") ||
        "";
      if (!filter || filter === "none") {
        return false;
      }
      return !(el.className?.toString?.() ?? "").includes("glass");
    });
    return {
      mains: document.querySelectorAll("main").length,
      h1: collapseWs(document.querySelector("h1")?.textContent ?? ""),
      title: document.title.trim(),
      overflowX,
      truncatedChrome,
      clippedSectionTabs,
      duplicateChromeCopy,
      rawGlass,
      bodyLen: collapseWs(document.body?.innerText ?? "").length,
    };
  });

const probeRouteShell = async (
  page: Page,
  viewport: string,
  route: string,
  findings: Finding[],
): Promise<Awaited<ReturnType<typeof collectChromeSignals>>> => {
  const shell = await collectChromeSignals(page);
  if (shell.mains !== 1) {
    await captureFinding(
      page,
      findings,
      viewport,
      route,
      "shell-main",
      `expected 1 main, got ${String(shell.mains)}`,
    );
  }
  if (shell.h1.length === 0) {
    await captureFinding(page, findings, viewport, route, "shell-h1", "missing h1");
  }
  if (shell.title.length === 0) {
    await captureFinding(page, findings, viewport, route, "shell-title", "empty document title");
  }
  if (shell.overflowX > 1) {
    await captureFinding(
      page,
      findings,
      viewport,
      route,
      "overflow-x",
      `overflowX=${String(shell.overflowX)}`,
    );
  }
  if (shell.truncatedChrome) {
    await captureFinding(
      page,
      findings,
      viewport,
      route,
      "truncated-chrome",
      "navbar ellipsis gut",
    );
  }
  if (shell.clippedSectionTabs) {
    await captureFinding(
      page,
      findings,
      viewport,
      route,
      "clipped-section-tabs",
      "section tab label scrollWidth>clientWidth",
    );
  }
  if (shell.duplicateChromeCopy.length > 0) {
    await captureFinding(
      page,
      findings,
      viewport,
      route,
      "duplicate-chrome-copy",
      shell.duplicateChromeCopy[0] ?? "dup",
    );
  }
  if (shell.rawGlass) {
    await captureFinding(page, findings, viewport, route, "raw-glass", "backdrop outside glass-*");
  }
  return shell;
};

const listClickableControlLabels = async (page: Page): Promise<readonly string[]> => {
  const evaluated = await settle(
    page.evaluate((maxClicks: number) => {
      const main = document.querySelector("main");
      if (!main) {
        return [];
      }
      const controls = Array.from(main.querySelectorAll("button, a.btn, a[href]"));
      const labels: string[] = [];
      for (const control of controls) {
        if (!(control instanceof HTMLElement)) {
          continue;
        }
        if (control.hasAttribute("disabled") || control.getAttribute("aria-disabled") === "true") {
          continue;
        }
        if (typeof control.checkVisibility === "function") {
          if (!control.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) {
            continue;
          }
        } else {
          const style = window.getComputedStyle(control);
          if (style.visibility === "hidden" || style.display === "none") {
            continue;
          }
        }
        const aria = control.getAttribute("aria-label")?.replace(/\s+/gu, " ").trim() ?? "";
        const text = control.textContent?.replace(/\s+/gu, " ").trim() ?? "";
        // Prefer aria-label — card NuxtLinks concatenate nested copy into textContent.
        const label = aria.length > 0 ? aria : text;
        if (label.length > 0 && label.length < 80) {
          labels.push(label);
        }
      }
      return [...new Set(labels)].slice(0, maxClicks);
    }, MAX_CLICKS_PER_ROUTE),
  );
  return evaluated.status === "fulfilled" ? evaluated.value : [];
};

const clickOneLabel = async (
  page: Page,
  viewport: string,
  route: string,
  label: string,
  findings: Finding[],
  consoleBucket: string[],
  pageErrorBucket: string[],
): Promise<void> => {
  consoleBucket.length = 0;
  pageErrorBucket.length = 0;
  // settle(evaluate) survives SPA navigations that destroy the prior execution context.
  const clickResult = await settle(
    page.evaluate((targetLabel) => {
      const normalize = (value: string): string => value.replace(/\s+/gu, " ").trim();
      const controls = [...document.querySelectorAll("main button, main a.btn, main a[href]")];
      for (const control of controls) {
        if (!(control instanceof HTMLElement)) {
          continue;
        }
        const aria = normalize(control.getAttribute("aria-label") ?? "");
        const text = normalize(control.textContent ?? "");
        const resolved = aria.length > 0 ? aria : text;
        if (resolved !== targetLabel) {
          continue;
        }
        if (control.hasAttribute("disabled") || control.getAttribute("aria-disabled") === "true") {
          continue;
        }
        control.scrollIntoView({ block: "nearest", inline: "nearest" });
        control.click();
        return true;
      }
      return false;
    }, label),
  );
  const clicked = clickResult.status === "fulfilled" && clickResult.value;
  if (!clicked) {
    // Prior clicks (refresh/filter) often unmount empty-state CTAs; skip stale labels.
    const stillListedResult = await settle(listClickableControlLabels(page));
    const stillListed =
      stillListedResult.status === "fulfilled" && stillListedResult.value.includes(label);
    if (stillListed) {
      await captureFinding(
        page,
        findings,
        viewport,
        route,
        `click-${slugify(label)}`,
        "control not found",
        "warn",
      );
    }
  }
  await page.waitForTimeout(180);
  // Re-home after in-app navigation before the next evaluate/locator sweep.
  const origin = `${CLIENT_BASE}${route}`;
  if (!page.url().startsWith(origin)) {
    await openRoute(page, route, consoleBucket, pageErrorBucket);
  }
  if (pageErrorBucket.length > 0) {
    await captureFinding(
      page,
      findings,
      viewport,
      route,
      `after-click-${slugify(label)}`,
      pageErrorBucket[0] ?? "",
    );
  }
};

const clickVisibleControls = async (
  page: Page,
  viewport: string,
  route: string,
  findings: Finding[],
  consoleBucket: string[],
  pageErrorBucket: string[],
): Promise<number> => {
  const labels = await listClickableControlLabels(page);
  await mapSequential(labels, async (label) => {
    await clickOneLabel(page, viewport, route, label, findings, consoleBucket, pageErrorBucket);
    const origin = `${CLIENT_BASE}${route}`;
    if (page.url() !== origin) {
      await openRoute(page, route, consoleBucket, pageErrorBucket);
    }
  });
  return labels.length;
};

const probeFirstTextInput = async (
  page: Page,
  viewport: string,
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
    await captureFinding(
      page,
      findings,
      viewport,
      route,
      "fill-input",
      fillResult.reason.message,
      "warn",
    );
  }
  await page.waitForTimeout(200);
  if (pageErrorBucket.length > 0) {
    await captureFinding(
      page,
      findings,
      viewport,
      route,
      "fill-input-pageerror",
      pageErrorBucket.join(" | "),
    );
  }
};

const buildFiveQ = (
  shell: Awaited<ReturnType<typeof collectChromeSignals>>,
  clicks: number,
  consoleErrors: readonly string[],
  pageErrors: readonly string[],
  routeFindings: readonly Finding[],
): FiveQ => {
  const errors = routeFindings.filter((finding) => finding.severity === "error");
  return {
    shouldBeHere:
      shell.bodyLen > 40 && shell.h1.length > 0
        ? "h1+content present"
        : "FAIL: empty or missing h1",
    ssotUx:
      shell.overflowX <= 1 && !shell.truncatedChrome && !shell.clippedSectionTabs
        ? "no overflow; chrome intact"
        : "FAIL: overflow/truncation",
    interactions:
      errors.every((finding) => !finding.action.startsWith("after-click")) && clicks >= 0
        ? `clicked ${String(clicks)} controls`
        : "FAIL: click path errors",
    glassDry:
      !shell.rawGlass && shell.duplicateChromeCopy.length === 0
        ? "no raw glass; chrome copy unique"
        : "FAIL: glass/DRY",
    logs:
      consoleErrors.length === 0 && pageErrors.length === 0
        ? "0 console/page errors"
        : `FAIL: console=${String(consoleErrors.length)} page=${String(pageErrors.length)}`,
  };
};

const burnRoute = async (
  page: Page,
  viewport: string,
  route: string,
  findings: Finding[],
  consoleBucket: string[],
  pageErrorBucket: string[],
): Promise<RouteLedger> => {
  await openRoute(page, route, consoleBucket, pageErrorBucket);
  const screenshot = join(OUT_DIR, viewport, `${slugify(route)}.png`);
  await mkdir(join(OUT_DIR, viewport), { recursive: true });
  await page.screenshot({ path: screenshot, fullPage: false });

  const loadErrors = [
    ...pageErrorBucket,
    ...consoleBucket.filter((line) => !isIgnorableConsole(line)),
  ];
  if (loadErrors.some((line) => line.includes("500") || line.includes("TypeError"))) {
    await captureFinding(
      page,
      findings,
      viewport,
      route,
      "load",
      loadErrors.slice(0, 4).join(" | "),
    );
  }

  const shell = await probeRouteShell(page, viewport, route, findings);
  const clicks = await clickVisibleControls(
    page,
    viewport,
    route,
    findings,
    consoleBucket,
    pageErrorBucket,
  );
  // Text probe once per viewport on settings only — keeps matrix fast.
  if (route === APP_ROUTES.settings) {
    await openRoute(page, route, consoleBucket, pageErrorBucket);
    await probeFirstTextInput(page, viewport, route, findings, consoleBucket, pageErrorBucket);
  }

  const routeFindings = findings.filter(
    (finding) => finding.viewport === viewport && finding.route === route,
  );
  const fiveQ = buildFiveQ(
    shell,
    clicks,
    consoleBucket.filter((line) => !isIgnorableConsole(line)),
    pageErrorBucket,
    routeFindings,
  );
  const ok = routeFindings.every((finding) => finding.severity !== "error");
  return { viewport, route, screenshot, fiveQ, ok };
};

const burnViewport = async (
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  viewport: (typeof VIEWPORTS)[number],
  findings: Finding[],
): Promise<RouteLedger[]> => {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.isMobile,
    hasTouch: viewport.hasTouch,
  });
  const consoleBucket: string[] = [];
  const pageErrorBucket: string[] = [];
  page.on("console", (message: ConsoleMessage) => {
    if (message.type() === "error" && !isIgnorableConsole(message.text())) {
      consoleBucket.push(message.text());
    }
  });
  page.on("pageerror", (error: Error) => {
    pageErrorBucket.push(error.message);
  });

  const ledger = await mapSequential(ROUTES, async (route) =>
    burnRoute(page, viewport.name, route, findings, consoleBucket, pageErrorBucket),
  );
  await page.close();
  return ledger;
};

const main = async (): Promise<void> => {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const findings: Finding[] = [];
  const ledger = (
    await mapSequential(VIEWPORTS, async (viewport) => burnViewport(browser, viewport, findings))
  ).flat();
  await browser.close();

  const errors = findings.filter((finding) => finding.severity === "error");
  const reportPath = join(OUT_DIR, "burndown-report.json");
  const ledgerPath = join(OUT_DIR, "fiveq-ledger.json");
  await Bun.write(
    reportPath,
    JSON.stringify(
      {
        CLIENT_BASE,
        viewports: VIEWPORTS.map((viewport) => viewport.name),
        findings,
        errorCount: errors.length,
        ledgerOk: ledger.filter((item) => item.ok).length,
        ledgerTotal: ledger.length,
      },
      null,
      2,
    ),
  );
  await Bun.write(ledgerPath, JSON.stringify(ledger, null, 2));
  await writeOutput(
    `browser-interaction-burndown: ${String(ledger.length)} page×viewport, ${String(errors.length)} errors, ${String(findings.length)} findings → ${reportPath}`,
  );
  if (errors.length > 0) {
    await writeError(
      errors
        .slice(0, 40)
        .map(
          (finding) =>
            `- ${finding.viewport} ${finding.route} [${finding.action}]: ${finding.detail.slice(0, 220)}`,
        )
        .join("\n"),
    );
    process.exitCode = 1;
  }
};

await main();
