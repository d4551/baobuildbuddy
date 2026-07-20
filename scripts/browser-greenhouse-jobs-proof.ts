/**
 * Headed proof: configure Greenhouse boards via UI, Refresh Jobs, verify non-empty feed.
 * Uses HTTP job providers (not Playwright RPA) — still real network fetch of public boards.
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
  process.env.GREENHOUSE_PROOF_OUT ??
  join("/opt/cursor/artifacts/baseline/greenhouse-jobs-proof");

const RE_SAVE_PROVIDERS = /Save Provider Config/i;
const RE_REFRESH_JOBS = /Refresh Jobs/i;
const RE_BOARDS_LABEL = /Greenhouse boards JSON/i;
const RE_JOB_INTELLIGENCE = /Job Intelligence/i;

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
  await page.screenshot({ path: join(OUT, "stills", `${name}.png`), fullPage: true });
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

  // Expand Greenhouse boards collapse
  const boardsSummary = page.getByText(RE_BOARDS_LABEL).first();
  await boardsSummary.waitFor({ state: "visible", timeout: 10_000 });
  await boardsSummary.click();
  await wait(page, 400);
  const boardsField = page.getByLabel(RE_BOARDS_LABEL);
  await boardsField.fill(
    JSON.stringify(
      [
        { board: "discord", company: "Discord", enabled: true },
        { board: "figma", company: "Figma", enabled: true },
      ],
      null,
      2,
    ),
  );
  await page.locator("button").filter({ hasText: RE_SAVE_PROVIDERS }).first().click();
  await wait(page, 2_500);
  await shot(page, "01-greenhouse-saved");

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.jobs}`, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  await wait(page, 1_500);
  await page.getByRole("button", { name: RE_REFRESH_JOBS }).click();
  await wait(page, 25_000);
  await shot(page, "02-jobs-after-refresh");

  const jobs = await page.evaluate(() => ({
    empty: document.body.innerText.includes("No jobs loaded yet"),
    titles: [...document.querySelectorAll("main .card-title, main h3, main a")]
      .map((element) => element.textContent?.trim())
      .filter((value): value is string => Boolean(value) && value.length > 2)
      .slice(0, 20),
    bodySnippet: document.body.innerText.slice(0, 500),
  }));
  await writeOutput(`JOBS ${JSON.stringify(jobs)}`);

  const video = page.video();
  await context.close();
  await browser.close();
  let videoPath: string | null = null;
  if (video) {
    videoPath = join(OUT, "greenhouse-jobs.webm");
    await Bun.write(videoPath, Bun.file(await video.path()));
  }
  const report = { jobs, videoPath };
  await Bun.write(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  if (jobs.empty) {
    process.exitCode = 1;
  }
};

await main();
