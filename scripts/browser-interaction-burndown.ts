const NUM_220 = 220;
const NUM_4 = 4;
const NUM_40 = 40;
const NUM_8 = 8;

/**
 * Browser interaction burndown — Playwright only (no curl / API inject).
 * Mobile → tablet → desktop. Canonical proof script for `proof:browser-burndown`.
 *
 * Env: PAGE_PROOF_CLIENT_BASE / BROWSER_BURNOUT_OUT read via scripts/utils/proof-script-env.ts.
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { type ConsoleMessage, chromium, type Page } from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import {
  captureFinding,
  clickVisibleControls,
  type Finding,
  mapSequential,
  openRoute,
  probeFirstTextInput,
  probeRouteShell,
  slugify,
} from "./browser-interaction-burndown-actions";
import type { ChromeSignals } from "./browser-interaction-burndown-chrome";
import { writeError, writeOutput } from "./utils/cli-output";
import { resolveProofClientBase, resolveProofOutDir } from "./utils/proof-script-env";

const CLIENT_BASE = resolveProofClientBase("http://127.0.0.1:3001");
const OUT_DIR = resolveProofOutDir(
  "BROWSER_BURNOUT_OUT",
  join("/opt/cursor/artifacts/interactive-burndown"),
);
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

type RouteLedger = {
  readonly viewport: string;
  readonly route: string;
  readonly screenshot: string;
  readonly fiveQ: FiveQ;
  readonly ok: boolean;
};

const APP_MANIFEST_ERROR_RE = /Error fetching app manifest/iu;
const isIgnorableConsole = (text: string): boolean => APP_MANIFEST_ERROR_RE.test(text);

const buildFiveQ = (
  shell: ChromeSignals,
  clicks: number,
  consoleErrors: readonly string[],
  pageErrors: readonly string[],
  routeFindings: readonly Finding[],
): FiveQ => {
  const hardErrors = routeFindings.filter((finding) => finding.severity === "error");
  return {
    shouldBeHere:
      shell.mains === 1 && shell.h1.length > 0 && shell.title.length > 0
        ? "landmarks ok"
        : "FAIL: landmarks",
    ssotUx:
      shell.overflowX <= NUM_8 && !shell.truncatedChrome && !shell.clippedSectionTabs
        ? "layout ok"
        : "FAIL: overflow/clip",
    interactions: clicks > 0 ? `clicked ${String(clicks)}` : "no clickable controls",
    glassDry:
      !shell.rawGlass && shell.duplicateChromeCopy.length === 0
        ? "no raw glass; chrome copy unique"
        : "FAIL: glass/DRY",
    logs:
      consoleErrors.length === 0 && pageErrors.length === 0 && hardErrors.length === 0
        ? "0 console/page errors"
        : `FAIL: console=${String(consoleErrors.length)} page=${String(pageErrors.length)} findings=${String(hardErrors.length)}`,
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
  await openRoute(page, CLIENT_BASE, route, consoleBucket, pageErrorBucket);
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
      OUT_DIR,
      viewport,
      route,
      "load",
      loadErrors.slice(0, NUM_4).join(" | "),
    );
  }

  const shell = await probeRouteShell(page, findings, OUT_DIR, viewport, route);
  const clicks = await clickVisibleControls(
    page,
    CLIENT_BASE,
    OUT_DIR,
    viewport,
    route,
    findings,
    consoleBucket,
    pageErrorBucket,
    MAX_CLICKS_PER_ROUTE,
  );
  if (route === APP_ROUTES.settings) {
    await openRoute(page, CLIENT_BASE, route, consoleBucket, pageErrorBucket);
    await probeFirstTextInput(
      page,
      OUT_DIR,
      viewport,
      route,
      findings,
      consoleBucket,
      pageErrorBucket,
    );
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
  const fiveQFailed = Object.values(fiveQ).some((value) => value.startsWith("FAIL:"));
  const ok = !fiveQFailed && routeFindings.every((finding) => finding.severity !== "error");
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
  const ledgerFailures = ledger.filter((item) => !item.ok);
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
        ledgerFailures: ledgerFailures.length,
      },
      null,
      2,
    ),
  );
  await Bun.write(ledgerPath, JSON.stringify(ledger, null, 2));
  await writeOutput(
    `browser-interaction-burndown: ${String(ledger.length)} page×viewport, ${String(errors.length)} errors, ${String(ledgerFailures.length)} ledger fails, ${String(findings.length)} findings → ${reportPath}`,
  );
  if (errors.length > 0 || ledgerFailures.length > 0) {
    const findingLines = errors
      .slice(0, NUM_40)
      .map(
        (finding) =>
          `- ${finding.viewport} ${finding.route} [${finding.action}]: ${finding.detail.slice(0, NUM_220)}`,
      );
    const ledgerLines = ledgerFailures.slice(0, NUM_40).map((item) => {
      const failedKeys = Object.entries(item.fiveQ)
        .filter(([, value]) => value.startsWith("FAIL:"))
        .map(([key, value]) => `${key}=${value}`)
        .join("; ");
      return `- ${item.viewport} ${item.route}: ${failedKeys || "ledger ok=false"}`;
    });
    await writeError([...findingLines, ...ledgerLines].join("\n"));
    process.exitCode = 1;
  }
};

await main();
