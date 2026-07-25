/**
 * Fail-closed headed RPA proof — UI click/type only (no API inject).
 * Flow: Settings enable portal → Scraper Run → Runs history → Job Apply.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { APP_ROUTE_BUILDERS, APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import {
  COUNT_FIVE_HUNDRED,
  MS_ONE_AND_HALF_SECONDS,
  MS_SECOND,
  MS_TEN_SECONDS,
  MS_TWELVE_SECONDS,
  MS_TWO_AND_HALF_SECONDS,
  MS_TWO_SECONDS,
} from "./constants/numeric-literals";
import { writeError, writeOutput } from "./utils/cli-output";
import { settlePage } from "./utils/playwright-settle";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const OUT = process.env.RPA_PROOF_OUT ?? "/opt/cursor/artifacts/live-capabilities/rpa-live-ui";

const RE_ENABLE_WWI = /Enable Work With Indies job portal scraper/i;
const RE_SAVE_PROVIDERS = /Save job provider configuration/i;
const RE_JOB_URL = /Job posting URL/i;
const RE_SELECT_RESUME = /Select resume/i;
const RE_RUN_APPLICATION = /Run job application automation/i;
const RUNS_URL_PATTERN = /\/automation\/runs/u;
const RUN_STATUS_SIGNAL_PATTERN = /queued|running|completed|success|failed|scrape/iu;

const wait = settlePage;

const shot = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({ path: join(OUT, "stills", `${name}.png`), fullPage: false });
};

const enablePortalViaUi = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTE_BUILDERS.settingsSection("jobIntelligence")}`, {
    waitUntil: "domcontentloaded",
  });
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  const toggle = page.getByLabel(RE_ENABLE_WWI);
  await toggle.scrollIntoViewIfNeeded();
  if (!(await toggle.isChecked())) {
    await toggle.click();
  }
  await page.getByRole("button", { name: RE_SAVE_PROVIDERS }).click();
  await wait(page, MS_TWO_SECONDS);
  await shot(page, "01-providers-enabled");
};

const API_BASE = (process.env.PAGE_PROOF_API_BASE ?? "http://127.0.0.1:3000").replace(/\/$/u, "");

const countRunsViaApi = async (): Promise<number> => {
  const response = await fetch(`${API_BASE}/api/automation/runs`, {
    signal: AbortSignal.timeout(MS_TEN_SECONDS),
  });
  if (!response.ok) {
    throw new Error(`GET /api/automation/runs → ${String(response.status)}`);
  }
  const body = (await response.json()) as unknown;
  return Array.isArray(body) ? body.length : 0;
};

const pickEnabledRunner = async (page: Page) => {
  // Prefer job scraper (portal feeds) over long studio crawls when both are armed.
  const preferred = [
    page.getByRole("button", { name: /Run job scraper/i }),
    page.getByRole("button", { name: /Run studio scraper/i }),
  ];
  for (const locator of preferred) {
    const total = await locator.count();
    for (let index = 0; index < total; index += 1) {
      const candidate = locator.nth(index);
      if ((await candidate.isVisible()) && !(await candidate.isDisabled())) {
        return candidate;
      }
    }
  }
  return null;
};

const runScraperViaUi = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.automationScraper}`, {
    waitUntil: "domcontentloaded",
  });
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  await shot(page, "02-scraper-hub");

  // Wait out in-flight scrapes that disable Run buttons (pendingAction global).
  const armedDeadline = Date.now() + MS_TWELVE_SECONDS * 10;
  let runner = await pickEnabledRunner(page);
  while (!runner && Date.now() < armedDeadline) {
    await wait(page, MS_TWO_SECONDS);
    await page.reload({ waitUntil: "domcontentloaded" });
    await wait(page, MS_ONE_AND_HALF_SECONDS);
    runner = await pickEnabledRunner(page);
  }
  if (!runner) {
    throw new Error("No enabled Run Scraper button in UI after waiting for idle");
  }
  await runner.scrollIntoViewIfNeeded();
  await runner.click();
  await wait(page, MS_TWO_SECONDS);
  await shot(page, "03-scraper-clicked");
};

const countRunRows = async (page: Page): Promise<number> =>
  page.locator("main table tbody tr").count();

const waitForApiRunGrowth = async (beforeCount: number): Promise<number> => {
  const deadline = Date.now() + MS_TWELVE_SECONDS * 5;
  while (Date.now() < deadline) {
    const after = await countRunsViaApi();
    if (after > beforeCount) {
      return after;
    }
    await Bun.sleep(MS_SECOND);
  }
  throw new Error(
    `Automation runs API did not grow after scraper click (before=${String(beforeCount)}) — RPA not integrated`,
  );
};

const assertRunsViaUi = async (page: Page, beforeCount: number): Promise<number> => {
  const apiAfter = await waitForApiRunGrowth(beforeCount);
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.automationRuns}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForURL(RUNS_URL_PATTERN, { timeout: 30_000 });
  await wait(page, MS_TWO_AND_HALF_SECONDS);
  await shot(page, "04-runs-history");
  const afterCount = await countRunRows(page);
  const body = await page.locator("main").innerText();
  // Fail-closed: UI table must show growth (API already confirmed a new run).
  if (!(afterCount > beforeCount)) {
    throw new Error(
      `Runs history UI stale after scraper click (before=${String(beforeCount)} ui=${String(afterCount)} api=${String(apiAfter)} bodyHasScrapeSignal=${String(RUN_STATUS_SIGNAL_PATTERN.test(body))}) — RPA not integrated`,
    );
  }
  return afterCount;
};

const jobApplyViaUi = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.automationJobApply}`, {
    waitUntil: "domcontentloaded",
  });
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  const urlInput = page.getByPlaceholder(/Paste the job posting URL/i).or(page.getByLabel(RE_JOB_URL));
  await urlInput.first().waitFor({ state: "visible", timeout: MS_TEN_SECONDS });
  await urlInput.first().click();
  await urlInput.first().fill("");
  await urlInput.first().pressSequentially("https://boards.greenhouse.io/discord/jobs/6982349", {
    delay: 10,
  });
  const resumeSelect = page.getByLabel(RE_SELECT_RESUME);
  await resumeSelect.waitFor({ state: "visible", timeout: MS_TEN_SECONDS });
  // Wait until bootstrap finishes populating resume options.
  const optionDeadline = Date.now() + MS_TEN_SECONDS;
  while (Date.now() < optionDeadline) {
    const options = await resumeSelect.locator("option").count();
    if (options > 1) {
      break;
    }
    await wait(page, MS_SECOND);
  }
  await resumeSelect.selectOption({ index: 1 });
  const runApply = page.getByRole("button", { name: RE_RUN_APPLICATION });
  const enableDeadline = Date.now() + MS_TEN_SECONDS;
  while (Date.now() < enableDeadline && (await runApply.isDisabled())) {
    await wait(page, COUNT_FIVE_HUNDRED);
  }
  if (await runApply.isDisabled()) {
    await shot(page, "05-job-apply-form-filled");
    throw new Error("Run Application stayed disabled after typing URL + selecting resume");
  }
  await shot(page, "05-job-apply-form-ready");
  await runApply.click();
  await wait(page, MS_TEN_SECONDS);
  await shot(page, "05-job-apply-ran");
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  await mkdir(join(OUT, "raw"), { recursive: true });
  const browser = await chromium.launch({ headless: false, args: ["--disable-dev-shm-usage"] });
  const context = await browser.newContext({
    recordVideo: { dir: join(OUT, "raw"), size: { width: 1440, height: 900 } },
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await enablePortalViaUi(page);

  const beforeCount = await countRunsViaApi();

  await runScraperViaUi(page);
  const afterCount = await assertRunsViaUi(page, beforeCount);

  let jobApplyOk = false;
  let jobApplyError: string | null = null;
  const applyResult = await settle(jobApplyViaUi(page));
  if (applyResult.status === "fulfilled") {
    jobApplyOk = true;
  } else {
    jobApplyError = applyResult.reason.message;
    await writeError(`job-apply UI: ${jobApplyError}`);
  }

  const video = page.video();
  await context.close();
  await browser.close();

  let videoPath: string | null = null;
  if (video) {
    const raw = await video.path();
    videoPath = join(OUT, "rpa-integration-demo.webm");
    await Bun.write(videoPath, Bun.file(raw));
  }

  const scraperDeltaOk = afterCount > beforeCount;
  const ok = scraperDeltaOk && jobApplyOk;
  await writeFile(
    join(OUT, "report.json"),
    `${JSON.stringify(
      {
        ok,
        mode: "ui-click-type+video",
        scraper: { ran: scraperDeltaOk, runsBefore: beforeCount, runsAfter: afterCount },
        jobApply: { ok: jobApplyOk, error: jobApplyError },
        videoPath,
      },
      null,
      2,
    )}\n`,
  );
  if (!ok) {
    throw new Error(
      `browser-proof-rpa-live FAIL scraperDelta=${String(scraperDeltaOk)} jobApply=${String(jobApplyOk)} error=${jobApplyError ?? "none"}`,
    );
  }
  await writeOutput(`browser-proof-rpa-live OK (UI) video=${videoPath ?? "none"} → ${OUT}`);
};

const runResult = await settle(main());
if (runResult.status === "rejected") {
  await writeError(runResult.reason.message);
  process.exit(1);
}
