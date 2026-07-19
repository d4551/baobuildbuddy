/**
 * Headed proof: enable gaming portal toggles via UI, run scrape, verify jobs feed.
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { APP_ROUTE_BUILDERS, APP_ROUTES } from "../packages/shared/src/constants/routes";
import { writeOutput } from "./utils/cli-output";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://localhost:3001").replace(
  /\/$/u,
  "",
);
const OUT =
  process.env.PORTAL_PROOF_OUT ?? join("/opt/cursor/artifacts/baseline/portal-toggle-proof");

const RE_SAVE_PROVIDERS = /Save Provider Config/i;
const RE_REFRESH_JOBS = /Refresh Jobs/i;
const RE_STUDIO = /Studio/i;

const wait = async (page: Page, ms: number): Promise<void> => {
  await page.waitForTimeout(ms);
};

const shot = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({
    path: join(OUT, "stills", `${name}.png`),
    fullPage: name.includes("full"),
  });
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
    void (async () => {
      const url = res.url();
      if (
        !(
          url.includes("/api/settings") ||
          url.includes("/api/automation") ||
          url.includes("/api/jobs") ||
          url.includes("/api/scraper")
        )
      ) {
        return;
      }
      let body = "";
      const textResult = await res.text().then(
        (value) => value,
        () => "",
      );
      body = textResult.slice(0, 240);
      api.push({
        s: res.status(),
        u: url.replace(/^https?:\/\/[^/]+/u, ""),
        b: body,
      });
    })();
  });

  await page.goto(`${CLIENT_BASE}${APP_ROUTE_BUILDERS.settingsSection("jobIntelligence")}`, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  await wait(page, 3_500);
  await shot(page, "01-settings-mobile-full");

  const toggleCount = await page
    .locator('section[aria-label="Gaming job portals"] input.toggle')
    .count();
  await writeOutput(`portal toggles=${String(toggleCount)}`);

  const portalNames = ["Work With Indies", "GrackleHQ", "RemoteGameJobs"] as const;
  await Promise.all(
    portalNames.map(async (name) => {
      const toggle = page.getByRole("checkbox", { name: new RegExp(`Enable ${name}`, "i") });
      if ((await toggle.count()) === 0) {
        await writeOutput(`missing toggle: ${name}`);
        return;
      }
      if (!(await toggle.isChecked())) {
        await toggle.click({ force: true });
      }
      await writeOutput(`enabled ${name}=${String(await toggle.isChecked())}`);
    }),
  );

  await page.getByRole("button", { name: RE_SAVE_PROVIDERS }).click();
  await wait(page, 2_500);
  await shot(page, "02-saved");

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.automationScraper}`, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  await wait(page, 3_000);
  const scraperState = await page.evaluate(() => {
    const text = document.body.innerText;
    const configuredMatch = /Configured\s+(\d+)/u.exec(text);
    return {
      configured: configuredMatch?.[1] ?? null,
      runButtons: [...document.querySelectorAll("main button")].map((button) => ({
        t: (button.textContent ?? "").trim().slice(0, 48),
        dis: (button as HTMLButtonElement).disabled,
        a: button.getAttribute("aria-label"),
      })),
    };
  });
  await writeOutput(`SCRAPER ${JSON.stringify(scraperState)}`);
  await shot(page, "03-scraper-full");

  const jobRuns = page.locator("main button.btn-primary").filter({ hasNotText: RE_STUDIO });
  const jobRunCount = await jobRuns.count();
  await writeOutput(`jobRun buttons=${String(jobRunCount)}`);
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
