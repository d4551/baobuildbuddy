const NUM_12 = 12;
const NUM_240 = 240;
/**
 * Headed proof: enable gaming portal toggles via UI, run scrape, verify jobs feed.
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Response } from "playwright";
import { API_ENDPOINTS } from "../packages/shared/src/constants/endpoints";
import {
  phaseEnablePortals,
  phaseRunScraper,
  phaseVerifyJobs,
} from "./browser-portal-toggle-phases";
import { writeOutput } from "./utils/cli-output";

const WATCHED_API_PREFIXES = [
  API_ENDPOINTS.settings,
  API_ENDPOINTS.automationBase,
  API_ENDPOINTS.jobs,
  API_ENDPOINTS.scraperBase,
] as const;

const ORIGIN_PREFIX_PATTERN = /^https?:\/\/[^/]+/u;

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://localhost:3001").replace(
  /\/$/u,
  "",
);
const OUT =
  process.env.PORTAL_PROOF_OUT ?? join("/opt/cursor/artifacts/baseline/portal-toggle-proof");

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
    b: textResult.slice(0, NUM_240),
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
    captureApiResponse(res, api).then(
      () => undefined,
      () => undefined,
    );
  });

  await phaseEnablePortals(page, CLIENT_BASE, OUT);
  const scraperState = await phaseRunScraper(page, CLIENT_BASE, OUT);
  const jobs = await phaseVerifyJobs(page, CLIENT_BASE, OUT);
  await writeOutput(`JOBS ${JSON.stringify(jobs)}`);

  const video = page.video();
  await context.close();
  await browser.close();
  let videoPath: string | null = null;
  if (video) {
    videoPath = join(OUT, "portal-toggle-scrape.webm");
    await Bun.write(videoPath, Bun.file(await video.path()));
  }

  const report = { scraperState, jobs, api: api.slice(-NUM_12), videoPath };
  await Bun.write(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  await writeOutput(JSON.stringify(report, null, 2));
  if (jobs.empty) {
    process.exitCode = 1;
  }
};

await main();
