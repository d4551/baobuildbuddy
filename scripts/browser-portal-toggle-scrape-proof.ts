/**
 * Headed proof: enable gaming portal toggles via UI, run scrape, verify jobs feed.
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page, type Response } from "playwright";
import { API_ENDPOINTS } from "../packages/shared/src/constants/endpoints";
import { APP_ROUTE_BUILDERS, APP_ROUTES } from "../packages/shared/src/constants/routes";
import { writeOutput } from "./utils/cli-output";

const WATCHED_API_PREFIXES = [
  API_ENDPOINTS.settings,
  API_ENDPOINTS.automationBase,
  API_ENDPOINTS.jobs,
  API_ENDPOINTS.scraperBase,
] as const;

const ORIGIN_PREFIX_PATTERN = /^https?:\/\/[^/]+/u;
const RE_SAVE_PROVIDERS = /Save Provider Config/i;
const RE_REFRESH_JOBS = /Refresh Jobs/i;
const RE_STUDIO = /Studio/i;
const RE_JOB_INTELLIGENCE = /Job Intelligence/i;
const RE_CONFIGURED_COUNT = /Configured\s+(\d+)/u;
const RE_ENABLE_WWI = /Enable Work With Indies/i;
const RE_ENABLE_GRACKLE = /Enable GrackleHQ/i;
const RE_ENABLE_REMOTE = /Enable RemoteGameJobs/i;

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://localhost:3001").replace(
  /\/$/u,
  "",
);
const OUT =
  process.env.PORTAL_PROOF_OUT ?? join("/opt/cursor/artifacts/baseline/portal-toggle-proof");

const wait = async (page: Page, ms: number): Promise<void> => {
  await page.locator("body").waitFor({ state: "visible", timeout: ms }).then(
    () => undefined,
    () => undefined,
  );
  await page.waitForLoadState("domcontentloaded", { timeout: ms }).then(
    () => undefined,
    () => undefined,
  );
};

const shot = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({
    path: join(OUT, "stills", `${name}.png`),
    fullPage: name.includes("full"),
  });
};

const captureApiResponse = async (
  res: Response,
  api: Array<{ s: number; u: string; b: string }>,
): Promise<void> => {
  const url = res.url();
  if (!WATCHED_API_PREFIXES.some((prefix) => url.includes(prefix))) {
    return;
  }
  const textResult = await res.text().then(
    (value) => value,
    () => "",
  );
  api.push({
    s: res.status(),
    u: url.replace(ORIGIN_PREFIX_PATTERN, ""),
    b: textResult.slice(0, 240),
  });
};

const enablePortal = async (page: Page, namePattern: RegExp, label: string): Promise<void> => {
  const toggle = page.getByRole("checkbox", { name: namePattern });
  if ((await toggle.count()) === 0) {
    await writeOutput(`missing toggle: ${label}`);
    return;
  }
  if (!(await toggle.isChecked())) {
    await toggle.click();
    await wait(page, 200);
  }
  await writeOutput(`enabled ${label}=${String(await toggle.isChecked())}`);
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  await mkdir(join(OUT, "raw"), { recursive: true });

  const browser = await chromium.launch({ headless: false, args: ["--disable-dev-shm-usage"] });
  const context = await browser.newContext({
    recordVideo: { dir: join(OUT, "raw"), size: { width: 390, height: 844 } },
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const api: Array<{ s: number; u: string; b: string }> = [];
  page.on("response", (res) => {
    captureApiResponse(res, api).then(
      () => undefined,
      () => undefined,
    );
  });

  await page.goto(`${CLIENT_BASE}${APP_ROUTE_BUILDERS.settingsSection("jobIntelligence")}`, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  await wait(page, 2_500);
  const jobIntelNav = page.getByRole("button", { name: RE_JOB_INTELLIGENCE }).first();
  if ((await jobIntelNav.count()) > 0) {
    await jobIntelNav.click();
    await wait(page, 800);
  }
  await shot(page, "01-settings-mobile-full");

  const toggleCount = await page
    .locator('section[aria-label="Gaming job portals"] input.toggle')
    .count();
  await writeOutput(`portal toggles=${String(toggleCount)}`);

  await enablePortal(page, RE_ENABLE_WWI, "Work With Indies");
  await enablePortal(page, RE_ENABLE_GRACKLE, "GrackleHQ");
  await enablePortal(page, RE_ENABLE_REMOTE, "RemoteGameJobs");

  const saveProviders = page.locator("button").filter({ hasText: RE_SAVE_PROVIDERS }).first();
  await saveProviders.click();
  await wait(page, 2_500);
  await shot(page, "02-saved");

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.automationScraper}`, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  await wait(page, 3_000);
  const scraperState = await page.evaluate((configuredPatternSource) => {
    const text = document.body.innerText;
    const configuredMatch = new RegExp(configuredPatternSource, "u").exec(text);
    return {
      configured: configuredMatch?.[1] ?? null,
      runButtons: [...document.querySelectorAll("main button")].map((button) => ({
        t: (button.textContent ?? "").trim().slice(0, 48),
        dis: (button as HTMLButtonElement).disabled,
        a: button.getAttribute("aria-label"),
      })),
    };
  }, RE_CONFIGURED_COUNT.source);
  await writeOutput(`SCRAPER ${JSON.stringify(scraperState)}`);
  await shot(page, "03-scraper-full");

  const jobRuns = page.locator("main button.btn-primary").filter({ hasNotText: RE_STUDIO });
  await writeOutput(`jobRun buttons=${String(await jobRuns.count())}`);
  const enabledJobRun = jobRuns.filter({ hasNot: page.locator(":disabled") }).first();
  if ((await enabledJobRun.count()) > 0) {
    await writeOutput(`click ${String(await enabledJobRun.getAttribute("aria-label"))}`);
    await enabledJobRun.click();
    await wait(page, 45_000);
  }
  await shot(page, "04-after-run");

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.jobs}`, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  await wait(page, 2_000);
  const refresh = page.getByRole("button", { name: RE_REFRESH_JOBS });
  if ((await refresh.count()) > 0) {
    await refresh.click();
    await wait(page, 20_000);
  }
  await shot(page, "05-jobs");
  const jobs = await page.evaluate(() => ({
    empty: document.body.innerText.includes("No jobs loaded yet"),
    titles: [...document.querySelectorAll("main .card-title, main h3")]
      .map((element) => element.textContent?.trim())
      .filter((value): value is string => Boolean(value))
      .slice(0, 12),
  }));
  await writeOutput(`JOBS ${JSON.stringify(jobs)}`);

  const video = page.video();
  await context.close();
  await browser.close();
  let videoPath: string | null = null;
  if (video) {
    videoPath = join(OUT, "portal-toggle-scrape.webm");
    await Bun.write(videoPath, Bun.file(await video.path()));
  }

  const report = { scraperState, jobs, api: api.slice(-12), videoPath };
  await Bun.write(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  await writeOutput(JSON.stringify(report, null, 2));
  if (jobs.empty) {
    process.exitCode = 1;
  }
};

await main();
