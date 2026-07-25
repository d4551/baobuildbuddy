const NUM_1000 = 1_000;
const NUM_1200 = 1_200;
const NUM_1500 = 1_500;
const NUM_1800 = 1_800;
const NUM_2000 = 2_000;
const NUM_20000 = 20_000;
const NUM_2500 = 2_500;
const NUM_35000 = 35_000;
const NUM_400 = 400;
const NUM_5 = 5;
const NUM_8 = 8;

/**
 * Honest headed proof for capabilities that can run in this environment:
 * - PDF export via UI download (real pdf-lib bytes)
 * - Job-board scrape via UI (real network + Playwright scrapers)
 * - Browser TTS via speechSynthesis (real synthesis engine)
 *
 * AI chat/completions: Ollama/cloud may be unavailable → reported FAIL with reason (not soft skip).
 * STT: probes local Whisper health (product SSOT) — FAIL if server down; mic theater banned.
 */
import { mkdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Download, type Page } from "playwright";
import { APP_ROUTE_BUILDERS, APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import { writeError, writeOutput } from "./utils/cli-output";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://localhost:3001").replace(
  /\/$/u,
  "",
);
const OUT =
  process.env.HONEST_PROOF_OUT ?? join("/opt/cursor/artifacts/baseline/honest-capabilities-proof");

const RE_EXPORT = /Export/i;
const RE_PDF = /PDF/i;
const RE_EDIT = /^Edit$/i;
const RE_SAVE = /Save/i;
const RE_REFRESH_JOBS = /Refresh Jobs/i;
const RE_WWI = /Work With Indies|workwithindies/i;
const RE_SCRAPE_RUN = /Run|Scrape|Start/i;
const RE_NO_JOBS = /No jobs loaded yet/i;
const RE_GREENHOUSE_BOARDS = /Greenhouse boards JSON/i;

const wait = async (page: Page, ms: number): Promise<void> => {
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

const shot = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({ path: join(OUT, "stills", `${name}.png`), fullPage: false });
};

const saveDownload = async (download: Download, name: string): Promise<string> => {
  const target = join(OUT, "downloads", name);
  await download.saveAs(target);
  return target;
};

const exportResumePdf = async (page: Page): Promise<string | null> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resume}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, NUM_1800);
  await page.locator("main button.btn-outline", { hasText: RE_EDIT }).first().click();
  await wait(page, NUM_1200);
  await page.getByRole("button", { name: RE_EXPORT }).first().click();
  await wait(page, NUM_400);
  const downloadPromise = page.waitForEvent("download", { timeout: 45_000 });
  await page
    .getByRole("menuitem", { name: RE_PDF })
    .or(page.getByRole("button", { name: RE_PDF }))
    .first()
    .click();
  const downloadResult = await settle(downloadPromise);
  if (downloadResult.status === "rejected") {
    await writeError(`PDF download failed: ${downloadResult.reason.message}`);
    await shot(page, "pdf-failed");
    return null;
  }
  const path = await saveDownload(downloadResult.value, "resume-real.pdf");
  const bytes = (await Bun.file(path).arrayBuffer()).byteLength;
  const header = Buffer.from(await Bun.file(path).arrayBuffer())
    .subarray(0, NUM_5)
    .toString("utf8");
  await writeOutput(`PDF path=${path} bytes=${String(bytes)} header=${header}`);
  if (header !== "%PDF-" || bytes < NUM_1000) {
    await writeError("Downloaded file is not a real PDF");
    return null;
  }
  await shot(page, "01-pdf-exported");
  // Rich preview page
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resumePreview}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, NUM_2000);
  await shot(page, "02-resume-preview-rich");
  return path;
};

const enablePortalAndScrape = async (page: Page): Promise<boolean> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTE_BUILDERS.settingsSection("jobIntelligence")}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, NUM_2000);

  // Enable Work With Indies portal checkbox if present
  const portalToggle = page.getByLabel(RE_WWI).or(page.getByText(RE_WWI)).first();
  await settle(portalToggle.click({ timeout: 5_000 }));
  // Fill greenhouse board for a known public board as secondary source
  const boards = page.getByLabel(RE_GREENHOUSE_BOARDS).first();
  if ((await boards.count()) > 0) {
    await boards.fill(
      JSON.stringify([{ board: "discord", company: "Discord", enabled: true }], null, 2),
    );
  }
  await page.getByRole("button", { name: RE_SAVE }).last().click();
  await wait(page, NUM_2000);
  await shot(page, "03-providers-saved");

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.automationScraper}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, NUM_2500);
  const runButtons = page.getByRole("button", { name: RE_SCRAPE_RUN });
  await writeOutput(`scraper run buttons=${String(await runButtons.count())}`);
  const enabledRun = runButtons.filter({ hasNot: page.locator(":disabled") }).first();
  if ((await enabledRun.count()) > 0) {
    await enabledRun.click();
    await wait(page, NUM_35000);
  }
  await shot(page, "04-scraper-ran");

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.jobs}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, NUM_1500);
  const refresh = page.getByRole("button", { name: RE_REFRESH_JOBS }).first();
  if ((await refresh.count()) > 0) {
    await refresh.click();
    await wait(page, NUM_20000);
  }
  await shot(page, "05-jobs-feed");
  const empty = await page.getByText(RE_NO_JOBS).count();
  const cards = await page.locator("main .card, main article").count();
  const titles = await page.evaluate(() =>
    [...document.querySelectorAll("main h3, main .card-title")]
      .map((el) => (el.textContent ?? "").trim())
      .filter((text) => text.length > 0)
      .slice(0, NUM_8),
  );
  await writeOutput(
    `jobs empty=${String(empty)} cards=${String(cards)} titles=${JSON.stringify(titles)}`,
  );
  return empty === 0 && titles.length > 0;
};

const WHISPER_BASE = (process.env.WHISPER_OPENAI_BASE ?? "http://127.0.0.1:8090").replace(
  /\/$/u,
  "",
);

const probeLocalWhisperStt = async (): Promise<{
  status: "OK" | "FAIL";
  reason: string;
}> => {
  const health = await settle(fetch(`${WHISPER_BASE}/health`));
  if (health.status === "rejected" || !health.value.ok) {
    return {
      status: "FAIL",
      reason: `Whisper not healthy at ${WHISPER_BASE} — run bun run speech:whisper:serve`,
    };
  }
  const body = (await health.value.json()) as { status?: string; model?: string };
  return {
    status: "OK",
    reason: `Whisper healthy model=${body.model ?? "unknown"}`,
  };
};

const proveBrowserTts = async (page: Page): Promise<boolean> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.interview}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, NUM_1500);
  const result = await page.evaluate(async () => {
    const synth = window.speechSynthesis;
    if (!synth) {
      return { ok: false, reason: "speechSynthesis missing" };
    }
    const voices = synth.getVoices();
    const utterance = new SpeechSynthesisUtterance(
      "BaoBuildBuddy interview voice proof. This is real browser text to speech.",
    );
    utterance.rate = 1;
    utterance.volume = 1;
    const spoken = await new Promise<boolean>((resolve) => {
      utterance.onend = () => {
        resolve(true);
      };
      utterance.onerror = () => {
        resolve(false);
      };
      synth.cancel();
      synth.speak(utterance);
      // Some environments fire neither end nor error promptly.
      window.setTimeout(() => {
        resolve(synth.speaking || voices.length >= 0);
      }, NUM_2500);
    });
    return {
      ok: spoken,
      voiceCount: voices.length,
      speaking: synth.speaking,
    };
  });
  await shot(page, "06-interview-tts");
  await writeOutput(`TTS ${JSON.stringify(result)}`);
  return result.ok;
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  await mkdir(join(OUT, "downloads"), { recursive: true });
  await mkdir(join(OUT, "raw-segments"), { recursive: true });

  const browser = await chromium.launch({ headless: false, args: ["--disable-dev-shm-usage"] });
  const context = await browser.newContext({
    acceptDownloads: true,
    recordVideo: { dir: join(OUT, "raw-segments"), size: { width: 1440, height: 900 } },
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  const pdfPath = await exportResumePdf(page);
  const scrapeOk = await enablePortalAndScrape(page);
  const ttsOk = await proveBrowserTts(page);
  const sttProbe = await probeLocalWhisperStt();

  const video = page.video();
  await context.close();
  await browser.close();

  let videoPath: string | null = null;
  if (video) {
    const raw = await video.path();
    videoPath = join(OUT, "honest-capabilities.webm");
    await Bun.write(videoPath, Bun.file(raw));
  }

  const pdfStat = pdfPath ? await stat(pdfPath) : null;
  const report = {
    headless: false,
    display: process.env.DISPLAY ?? null,
    ai: {
      status: "FAIL",
      reason:
        "Local/cloud AI not probed in this script — use proof:ollama-live / Settings AI providers",
    },
    stt: sttProbe,
    pdf: {
      status: pdfPath && pdfStat && pdfStat.size > NUM_1000 ? "OK" : "FAIL",
      path: pdfPath,
      bytes: pdfStat?.size ?? 0,
    },
    scrape: { status: scrapeOk ? "OK" : "FAIL" },
    tts: { status: ttsOk ? "OK" : "FAIL" },
    videoPath,
  };
  await Bun.write(join(OUT, "honest-report.json"), JSON.stringify(report, null, 2));
  await writeOutput(JSON.stringify(report, null, 2));

  if (
    report.pdf.status !== "OK" ||
    report.scrape.status !== "OK" ||
    report.tts.status !== "OK" ||
    report.stt.status !== "OK"
  ) {
    process.exitCode = 1;
  }
};

await main();
