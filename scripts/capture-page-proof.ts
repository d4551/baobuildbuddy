import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { APP_ROUTES, APP_ROUTE_QUERY_KEYS } from "../packages/shared/src/constants/routes";
import { writeError, writeOutput } from "./utils/cli-output";

type JsonRecord = Record<string, unknown>;

type ViewportSize = {
  readonly width: number;
  readonly height: number;
};

type ScreenshotOptions = {
  readonly path: string;
  readonly fullPage: boolean;
};

type PageSignalSnapshot = {
  readonly heading: string | null;
  readonly alerts: readonly string[];
  readonly bodyText: string;
};

type PageInstance = {
  goto(url: string, options: { readonly waitUntil: "domcontentloaded"; readonly timeout: number }): Promise<void>;
  waitForTimeout(timeoutMs: number): Promise<void>;
  title(): Promise<string>;
  evaluate<Result>(handler: () => Result): Promise<Result>;
  screenshot(options: ScreenshotOptions): Promise<Uint8Array>;
};

type BrowserInstance = {
  newPage(options: { readonly viewport: ViewportSize }): Promise<PageInstance>;
  close(): Promise<void>;
};

type ChromiumLauncher = {
  launch(options: { readonly headless: boolean }): Promise<BrowserInstance>;
};

type PlaywrightModule = {
  readonly chromium: ChromiumLauncher;
};

type PageProofRouteSpec = {
  readonly slug: string;
  readonly route: string;
};

type PageProofReportItem = {
  readonly slug: string;
  readonly route: string;
  readonly url: string;
  readonly screenshotPath: string;
  readonly title: string;
  readonly h1: string | null;
  readonly alerts: readonly string[];
  readonly flaggedKeywords: readonly string[];
};

type ResolvedPageIdentifiers = {
  readonly resumeId: string;
  readonly jobId: string;
  readonly studioId: string;
  readonly coverLetterId: string;
  readonly scrapeRunId: string;
  readonly interviewSessionId: string;
};

const DEFAULT_API_BASE = "http://127.0.0.1:3000";
const DEFAULT_CLIENT_BASE = "http://localhost:3001";
const DEFAULT_VIEWPORT = {
  width: 1440,
  height: 1600,
} as const satisfies ViewportSize;
const DEFAULT_WAIT_AFTER_NAVIGATION_MS = 3_000;
const DEFAULT_NAVIGATION_TIMEOUT_MS = 60_000;
const FLAGGED_KEYWORDS = ["failed", "error", "could not", "unable", "not found"] as const;
const PLAYWRIGHT_ENTRYPOINT = resolve(
  process.cwd(),
  "packages",
  "scraper",
  "node_modules",
  "playwright",
  "index.mjs",
);

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";

const isPageProofRouteSpec = (value: unknown): value is PageProofRouteSpec =>
  isRecord(value) && isString(value.slug) && isString(value.route);

const isChromiumLauncher = (value: unknown): value is ChromiumLauncher =>
  isRecord(value) && typeof value.launch === "function";

const isPlaywrightModule = (value: unknown): value is PlaywrightModule =>
  isRecord(value) && isChromiumLauncher(value.chromium);

const normalizeText = (value: string): string => value.replace(/\s+/gu, " ").trim();

const resolveFlagValue = (flagName: string): string | null => {
  const flagIndex = process.argv.indexOf(flagName);
  const rawValue = flagIndex >= 0 ? process.argv[flagIndex + 1] : null;
  return rawValue && !rawValue.startsWith("--") ? rawValue : null;
};

const resolveOutputDirectory = (): string => {
  const explicit = resolveFlagValue("--output-dir");
  if (explicit) {
    return resolve(process.cwd(), explicit);
  }

  const date = new Date().toISOString().slice(0, 10);
  return join("/tmp", `bao-page-proof-${date}`);
};

const resolveClientBase = (): string =>
  (resolveFlagValue("--client-base") ?? process.env.PAGE_PROOF_CLIENT_BASE ?? DEFAULT_CLIENT_BASE).replace(
    /\/$/u,
    "",
  );

const resolveApiBase = (): string =>
  (resolveFlagValue("--api-base") ?? process.env.PAGE_PROOF_API_BASE ?? DEFAULT_API_BASE).replace(
    /\/$/u,
    "",
  );

const loadPlaywrightModule = async (): Promise<PlaywrightModule> => {
  const imported = await import(pathToFileURL(PLAYWRIGHT_ENTRYPOINT).href);
  if (!isPlaywrightModule(imported)) {
    throw new Error(`Playwright entrypoint did not expose a Chromium launcher: ${PLAYWRIGHT_ENTRYPOINT}`);
  }
  return imported;
};

const fetchJson = async (url: string): Promise<unknown> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

const readArrayCandidate = (value: unknown): readonly unknown[] =>
  Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.items)
      ? value.items
      : isRecord(value) && Array.isArray(value.data)
        ? value.data
        : isRecord(value) && Array.isArray(value.jobs)
          ? value.jobs
          : isRecord(value) && Array.isArray(value.resumes)
            ? value.resumes
            : isRecord(value) && Array.isArray(value.studios)
              ? value.studios
              : isRecord(value) && Array.isArray(value.coverLetters)
                ? value.coverLetters
                : [];

const readEntityId = (value: unknown): string | null =>
  isRecord(value) && isString(value.id) && value.id.length > 0 ? value.id : null;

const requireEntityId = (label: string, value: unknown): string => {
  const resolved = readEntityId(value);
  if (resolved) {
    return resolved;
  }
  throw new Error(`Unable to resolve ${label} for page proof.`);
};

const findSuccessfulScrapeRunId = (value: unknown): string => {
  const candidate = readArrayCandidate(value).find(
    (item) =>
      isRecord(item) &&
      item.type === "scrape" &&
      item.status === "success" &&
      isString(item.id) &&
      item.id.length > 0,
  );
  return requireEntityId("scrape run id", candidate);
};

const findInterviewSessionId = (value: unknown): string => {
  const candidate = readArrayCandidate(value)[0];
  return requireEntityId("interview session id", candidate);
};

const resolvePageIdentifiers = async (apiBase: string): Promise<ResolvedPageIdentifiers> => {
  const [resumes, jobs, studios, coverLetters, runs, interviewSessions] = await Promise.all([
    fetchJson(`${apiBase}/api/resumes`),
    fetchJson(`${apiBase}/api/jobs?limit=5`),
    fetchJson(`${apiBase}/api/studios`),
    fetchJson(`${apiBase}/api/cover-letters`),
    fetchJson(`${apiBase}/api/automation/runs?limit=20`),
    fetchJson(`${apiBase}/api/interview/sessions`),
  ]);

  const resumeId = requireEntityId("resume id", readArrayCandidate(resumes)[0]);
  const jobId = requireEntityId("job id", readArrayCandidate(jobs)[0]);
  const studioId = requireEntityId("studio id", readArrayCandidate(studios)[0]);
  const coverLetterId = requireEntityId("cover letter id", readArrayCandidate(coverLetters)[0]);
  const scrapeRunId = findSuccessfulScrapeRunId(runs);
  const interviewSessionId = findInterviewSessionId(interviewSessions);

  return {
    resumeId,
    jobId,
    studioId,
    coverLetterId,
    scrapeRunId,
    interviewSessionId,
  };
};

const buildRouteSpecs = (ids: ResolvedPageIdentifiers): readonly PageProofRouteSpec[] => {
  const routes = [
    { slug: "dashboard", route: APP_ROUTES.dashboard },
    { slug: "jobs-index", route: APP_ROUTES.jobs },
    { slug: "jobs-detail", route: `${APP_ROUTES.jobs}/${ids.jobId}` },
    { slug: "resume-index", route: APP_ROUTES.resume },
    { slug: "resume-build", route: `${APP_ROUTES.resume}/build` },
    { slug: "resume-preview", route: `${APP_ROUTES.resume}/preview?id=${ids.resumeId}` },
    { slug: "cover-letter-index", route: APP_ROUTES.coverLetter },
    { slug: "cover-letter-detail", route: `${APP_ROUTES.coverLetter}/${ids.coverLetterId}` },
    { slug: "portfolio-index", route: APP_ROUTES.portfolio },
    { slug: "portfolio-preview", route: `${APP_ROUTES.portfolio}/preview` },
    { slug: "interview-index", route: APP_ROUTES.interview },
    { slug: "interview-history", route: `${APP_ROUTES.interview}/history` },
    {
      slug: "interview-session",
      route: `${APP_ROUTES.interview}/session?${APP_ROUTE_QUERY_KEYS.id}=${ids.interviewSessionId}`,
    },
    { slug: "skills-index", route: APP_ROUTES.skills },
    { slug: "skills-pathways", route: `${APP_ROUTES.skills}/pathways` },
    { slug: "studios-index", route: APP_ROUTES.studios },
    { slug: "studios-detail", route: `${APP_ROUTES.studios}/${ids.studioId}` },
    { slug: "studios-analytics", route: `${APP_ROUTES.studios}/analytics` },
    { slug: "ai-chat", route: APP_ROUTES.aiChat },
    { slug: "ai-dashboard", route: "/ai/dashboard" },
    { slug: "automation-index", route: APP_ROUTES.automation },
    { slug: "automation-job-apply", route: APP_ROUTES.automationJobApply },
    { slug: "automation-scraper", route: APP_ROUTES.automationScraper },
    { slug: "automation-email", route: APP_ROUTES.automationEmail },
    { slug: "automation-runs", route: APP_ROUTES.automationRuns },
    { slug: "automation-run-detail", route: `${APP_ROUTES.automationRuns}/${ids.scrapeRunId}` },
    { slug: "docs-api", route: APP_ROUTES.apiDocs },
    { slug: "gamification", route: APP_ROUTES.gamification },
    { slug: "settings", route: APP_ROUTES.settings },
    { slug: "setup", route: APP_ROUTES.setup },
  ] satisfies readonly unknown[];

  return routes.filter(isPageProofRouteSpec);
};

const capturePageSignals = async (page: PageInstance): Promise<PageSignalSnapshot> =>
  page.evaluate(() => {
    const collectTexts = (selector: string): readonly string[] =>
      Array.from(document.querySelectorAll(selector))
        .map((node) => node.textContent?.replace(/\s+/gu, " ").trim() ?? "")
        .filter((value) => value.length > 0);

    const headingText =
      [...collectTexts("main h1"), ...collectTexts("h1")]
        .sort((left, right) => right.length - left.length)
        .at(0) ?? "";
    const bodyText = document.body.textContent?.replace(/\s+/gu, " ").trim() ?? "";

    return {
      heading: headingText.length > 0 ? headingText : null,
      alerts: collectTexts('[role="alert"], .alert, [data-page-state="error"]'),
      bodyText,
    };
  });

const capturePageProof = async (
  browser: BrowserInstance,
  clientBase: string,
  outputDirectory: string,
  spec: PageProofRouteSpec,
): Promise<PageProofReportItem> => {
  const page = await browser.newPage({ viewport: DEFAULT_VIEWPORT });
  const url = `${clientBase}${spec.route}`;
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: DEFAULT_NAVIGATION_TIMEOUT_MS,
  });
  await page.waitForTimeout(DEFAULT_WAIT_AFTER_NAVIGATION_MS);

  const title = normalizeText(await page.title());
  const snapshot = await capturePageSignals(page);
  const screenshotPath = join(outputDirectory, `${spec.slug}.png`);
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });

  const loweredAlertText = snapshot.alerts.join(" ").toLowerCase();
  const flaggedKeywords = FLAGGED_KEYWORDS.filter((keyword) => loweredAlertText.includes(keyword));

  return {
    slug: spec.slug,
    route: spec.route,
    url,
    screenshotPath,
    title,
    h1: snapshot.heading,
    alerts: snapshot.alerts,
    flaggedKeywords,
  };
};

const buildMarkdownReport = (report: readonly PageProofReportItem[]): string => {
  const lines = [
    "# Page Proof Report",
    "",
    `Generated at ${new Date().toISOString()}`,
    "",
    "| Slug | Route | Title | H1 | Alerts | Flagged keywords | Screenshot |",
    "|------|-------|-------|----|--------|------------------|------------|",
  ];

  for (const item of report) {
    lines.push(
      `| ${item.slug} | ${item.route} | ${item.title || "n/a"} | ${item.h1 || "n/a"} | ${item.alerts.length} | ${
        item.flaggedKeywords.length > 0 ? item.flaggedKeywords.join(", ") : "none"
      } | ${item.screenshotPath} |`,
    );
  }

  return `${lines.join("\n")}\n`;
};

const main = async (): Promise<void> => {
  const apiBase = resolveApiBase();
  const clientBase = resolveClientBase();
  const outputDirectory = resolveOutputDirectory();
  await writeOutput(`page-proof: writing screenshots to ${outputDirectory}`);
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });

  const ids = await resolvePageIdentifiers(apiBase);
  const routeSpecs = buildRouteSpecs(ids);
  const playwright = await loadPlaywrightModule();
  const browser = await playwright.chromium.launch({ headless: true });
  const report = await Promise.all(
    routeSpecs.map((spec) => capturePageProof(browser, clientBase, outputDirectory, spec)),
  );
  await browser.close();

  const jsonPath = join(outputDirectory, "report.json");
  const markdownPath = join(outputDirectory, "report.md");
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownPath, buildMarkdownReport(report));
  await writeOutput(`page-proof: captured ${report.length} routes`);
  await writeOutput(`page-proof: report.json -> ${jsonPath}`);
  await writeOutput(`page-proof: report.md -> ${markdownPath}`);
};

await main().then(undefined, async (error: unknown) => {
  const message = error instanceof Error ? error.message : `Unknown page proof failure: ${String(error)}`;
  await writeError(`page-proof: ${message}`);
  process.exitCode = 1;
});
