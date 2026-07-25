const NUM_12 = 12;
const NUM_200 = 200;
const NUM_2000 = 2_000;
const NUM_20000 = 20_000;
const NUM_2500 = 2_500;
const NUM_3000 = 3_000;
const NUM_45000 = 45_000;
const NUM_48 = 48;
const NUM_800 = 800;

/**
 * Portal toggle scrape proof phases (main() size split).
 */
import { join } from "node:path";
import type { Page } from "playwright";
import { APP_ROUTE_BUILDERS, APP_ROUTES } from "../packages/shared/src/constants/routes";
import { writeOutput } from "./utils/cli-output";

const RE_SAVE_PROVIDERS = /Save Provider Config/i;
const RE_REFRESH_JOBS = /Refresh Jobs/i;
const RE_STUDIO = /Studio/i;
const RE_JOB_INTELLIGENCE = /Job Intelligence/i;
const RE_CONFIGURED_COUNT = /Configured\s+(\d+)/u;
const RE_ENABLE_WWI = /Enable Work With Indies/i;
const RE_ENABLE_GRACKLE = /Enable GrackleHQ/i;
const RE_ENABLE_REMOTE = /Enable RemoteGameJobs/i;

export type ScraperState = {
  readonly configured: string | null;
  readonly runButtons: readonly { t: string; dis: boolean; a: string | null }[];
};

export type JobsState = {
  readonly empty: boolean;
  readonly titles: readonly string[];
};

export const wait = async (page: Page, ms: number): Promise<void> => {
  await page
    .locator("body")
    .waitFor({ state: "visible", timeout: ms })
    .then(
      () => undefined,
      () => undefined,
    );
  await page.waitForLoadState("domcontentloaded", { timeout: ms }).then(
    () => undefined,
    () => undefined,
  );
};

export const shot = async (page: Page, out: string, name: string): Promise<void> => {
  await page.screenshot({
    path: join(out, "stills", `${name}.png`),
    fullPage: name.includes("full"),
  });
};

export const enablePortal = async (
  page: Page,
  namePattern: RegExp,
  label: string,
): Promise<void> => {
  const toggle = page.getByRole("checkbox", { name: namePattern });
  if ((await toggle.count()) === 0) {
    await writeOutput(`missing toggle: ${label}`);
    return;
  }
  if (!(await toggle.isChecked())) {
    await toggle.click();
    await wait(page, NUM_200);
  }
  await writeOutput(`enabled ${label}=${String(await toggle.isChecked())}`);
};

export const phaseEnablePortals = async (
  page: Page,
  clientBase: string,
  out: string,
): Promise<void> => {
  await page.goto(`${clientBase}${APP_ROUTE_BUILDERS.settingsSection("jobIntelligence")}`, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  await wait(page, NUM_2500);
  const jobIntelNav = page.getByRole("button", { name: RE_JOB_INTELLIGENCE }).first();
  if ((await jobIntelNav.count()) > 0) {
    await jobIntelNav.click();
    await wait(page, NUM_800);
  }
  await shot(page, out, "01-settings-mobile-full");
  const toggleCount = await page
    .locator('section[aria-label="Gaming job portals"] input.toggle')
    .count();
  await writeOutput(`portal toggles=${String(toggleCount)}`);
  await enablePortal(page, RE_ENABLE_WWI, "Work With Indies");
  await enablePortal(page, RE_ENABLE_GRACKLE, "GrackleHQ");
  await enablePortal(page, RE_ENABLE_REMOTE, "RemoteGameJobs");
  const saveProviders = page.locator("button").filter({ hasText: RE_SAVE_PROVIDERS }).first();
  await saveProviders.click();
  await wait(page, NUM_2500);
  await shot(page, out, "02-saved");
};

export const phaseRunScraper = async (
  page: Page,
  clientBase: string,
  out: string,
): Promise<ScraperState> => {
  await page.goto(`${clientBase}${APP_ROUTES.automationScraper}`, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  await wait(page, NUM_3000);
  const scraperState = await page.evaluate((configuredPatternSource) => {
    const text = document.body.innerText;
    const configuredMatch = new RegExp(configuredPatternSource, "u").exec(text);
    return {
      configured: configuredMatch?.[1] ?? null,
      runButtons: [...document.querySelectorAll("main button")].map((button) => ({
        t: (button.textContent ?? "").trim().slice(0, NUM_48),
        dis: (button as HTMLButtonElement).disabled,
        a: button.getAttribute("aria-label"),
      })),
    };
  }, RE_CONFIGURED_COUNT.source);
  await writeOutput(`SCRAPER ${JSON.stringify(scraperState)}`);
  await shot(page, out, "03-scraper-full");
  const jobRuns = page.locator("main button.btn-primary").filter({ hasNotText: RE_STUDIO });
  await writeOutput(`jobRun buttons=${String(await jobRuns.count())}`);
  const enabledJobRun = jobRuns.filter({ hasNot: page.locator(":disabled") }).first();
  if ((await enabledJobRun.count()) > 0) {
    await writeOutput(`click ${String(await enabledJobRun.getAttribute("aria-label"))}`);
    await enabledJobRun.click();
    await wait(page, NUM_45000);
  }
  await shot(page, out, "04-after-run");
  return scraperState;
};

export const phaseVerifyJobs = async (
  page: Page,
  clientBase: string,
  out: string,
): Promise<JobsState> => {
  await page.goto(`${clientBase}${APP_ROUTES.jobs}`, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  await wait(page, NUM_2000);
  const refresh = page.getByRole("button", { name: RE_REFRESH_JOBS });
  if ((await refresh.count()) > 0) {
    await refresh.click();
    await wait(page, NUM_20000);
  }
  await shot(page, out, "05-jobs");
  return page.evaluate(() => ({
    empty: document.body.innerText.includes("No jobs loaded yet"),
    titles: [...document.querySelectorAll("main .card-title, main h3")]
      .map((element) => element.textContent?.trim())
      .filter((value): value is string => Boolean(value))
      .slice(0, NUM_12),
  }));
};
