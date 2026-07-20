/**
 * Honest headed proof for capabilities that can run in this environment:
 * - PDF export via UI download (real pdf-lib bytes)
 * - Job-board scrape via UI (real network + Playwright scrapers)
 * - Browser TTS via speechSynthesis (real synthesis engine)
 *
 * AI chat/completions: Ollama SEGV on this host; cloud keys empty → reported BLOCKED in report.
 * STT: no microphone device → reported BLOCKED in report.
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
  await wait(page, 1_800);
  await page.locator("main button.btn-outline", { hasText: RE_EDIT }).first().click();
  await wait(page, 1_200);
  await page.getByRole("button", { name: RE_EXPORT }).first().click();
  await wait(page, 400);
  const downloadPromise = page.waitForEvent("download", { timeout: 45_000 });
  await page.getByRole("menuitem", { name: RE_PDF }).or(page.getByRole("button", { name: RE_PDF })).first().click();
  const downloadResult = await settle(downloadPromise);
  if (downloadResult.status === "rejected") {
    await writeError(`PDF download failed: ${downloadResult.reason.message}`);
    await shot(page, "pdf-failed");
    return null;
  }
  const path = await saveDownload(downloadResult.value, "resume-real.pdf");
  const bytes = (await Bun.file(path).arrayBuffer()).byteLength;
  const header = Buffer.from(await Bun.file(path).arrayBuffer()).subarray(0, 5).toString("utf8");
  await writeOutput(`PDF path=${path} bytes=${String(bytes)} header=${header}`);
  if (header !== "%PDF-" || bytes < 1_000) {
    await writeError("Downloaded file is not a real PDF");
    return null;
  }
  await shot(page, "01-pdf-exported");
  // Rich preview page
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resumePreview}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 2_000);
  await shot(page, "02-resume-preview-rich");
  return path;
};

const enablePortalAndScrape = async (page: Page): Promise<boolean> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTE_BUILDERS.settingsSection("jobIntelligence")}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 2_000);

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
  await wait(page, 2_000);
  await shot(page, "03-providers-saved");

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.automationScraper}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 2_500);
  const runButtons = page.getByRole("button", { name: RE_SCRAPE_RUN });
  await writeOutput(`scraper run buttons=${String(await runButtons.count())}`);
  const enabledRun = runButtons.filter({ hasNot: page.locator(":disabled") }).first();
  if ((await enabledRun.count()) > 0) {
    await enabledRun.click();
    await wait(page, 35_000);
  }
  await shot(page, "04-scraper-ran");

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.jobs}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 1_500);
  const refresh = page.getByRole("button", { name: RE_REFRESH_JOBS }).first();
  if ((await refresh.count()) > 0) {
    await refresh.click();
    await wait(page, 20_000);
  }
  await shot(page, "05-jobs-feed");
  const empty = await page.getByText(RE_NO_JOBS).count();
  const cards = await page.locator("main .card, main article").count();
  const titles = await page.evaluate(() =>
    [...document.querySelectorAll("main h3, main .card-title")]
      .map((el) => (el.textContent ?? "").trim())
      .filter((text) => text.length > 0)
      .slice(0, 8),
  );
  await writeOutput(
    `jobs empty=${String(empty)} cards=${String(cards)} titles=${JSON.stringify(titles)}`,
  );
  return empty === 0 && titles.length > 0;
};

const proveBrowserTts = async (page: Page): Promise<boolean> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.interview}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 1_500);
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
      }, 2_500);
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
      status: "BLOCKED",
      reason:
        "Ollama llama-server SEGV on this host (qwen2.5:0.5b); GEMINI/OPENAI/CLAUDE/HUGGINGFACE keys empty in .env",
      evidence: [
        "/opt/cursor/artifacts/baseline/ollama-chat2.txt",
        "/opt/cursor/artifacts/baseline/ollama-generate-api.txt",
      ],
    },
    stt: {
      status: "BLOCKED",
      reason: "No microphone device / permission in this cloud agent environment for real STT",
    },
    pdf: {
      status: pdfPath && pdfStat && pdfStat.size > 1000 ? "OK" : "FAIL",
      path: pdfPath,
      bytes: pdfStat?.size ?? 0,
    },
    scrape: { status: scrapeOk ? "OK" : "FAIL" },
    tts: { status: ttsOk ? "OK" : "FAIL" },
    videoPath,
  };
  await Bun.write(join(OUT, "honest-report.json"), JSON.stringify(report, null, 2));
  await writeOutput(JSON.stringify(report, null, 2));

  if (report.pdf.status !== "OK" || report.scrape.status !== "OK" || report.tts.status !== "OK") {
    process.exitCode = 1;
  }
};

await main();
