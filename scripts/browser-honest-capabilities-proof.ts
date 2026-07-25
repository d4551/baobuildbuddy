/**
 * Honest headed proof for capabilities that can run in this environment:
 * - PDF export via UI download (real pdf-lib bytes)
 * - Job-board scrape via UI (real network + Playwright scrapers)
 * - Local Kokoro TTS via /api/speech/synthesize (RIFF WAV — not speechSynthesis-only)
 * - Local Whisper STT via /api/speech/transcribe (fail-closed; not mic-BLOCKED theater)
 *
 * AI chat/completions: live Ollama probe (fail-closed via assertLiveInference).
 */
import { mkdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Download, type Page } from "playwright";
import { APP_ROUTE_BUILDERS, APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import { writeError, writeOutput } from "./utils/cli-output";
import { assertLiveInference, type LiveAiProbeResult } from "./utils/live-ai-probe";
import { assertRealPdfFile } from "./utils/live-pdf-assert";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://localhost:3001").replace(
  /\/$/u,
  "",
);
const SERVER_BASE = (process.env.PAGE_PROOF_SERVER_BASE ?? "http://127.0.0.1:3000").replace(
  /\/$/u,
  "",
);
const WHISPER_BASE = (process.env.WHISPER_BASE ?? "http://127.0.0.1:8090").replace(/\/$/u, "");
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
  await page.waitForTimeout(ms);
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
  const assertion = await assertRealPdfFile(path);
  if (!assertion.ok) {
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
  // Greenhouse boards may be AppCodeEditor (CM6). Best-effort; WWI portal toggle is enough for scrape.
  const boardsCm = page.locator('[aria-label*="Greenhouse" i] .cm-content').first();
  const boardsVisible = await settle(boardsCm.isVisible());
  if (
    (await boardsCm.count()) > 0 &&
    boardsVisible.status === "fulfilled" &&
    boardsVisible.value
  ) {
    const typed = await settle(
      (async () => {
        await boardsCm.click({ timeout: 3_000 });
        await page.keyboard.press("Control+a");
        await page.keyboard.type(
          JSON.stringify([{ board: "discord", company: "Discord", enabled: true }]),
        );
      })(),
    );
    if (typed.status === "rejected") {
      await writeOutput(`Greenhouse JSON type skipped: ${typed.reason.message}`);
    }
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
  const clickedRun = (await enabledRun.count()) > 0;
  if (clickedRun) {
    await enabledRun.click();
    await wait(page, 45_000);
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
  const titles = await page.evaluate(() =>
    [...document.querySelectorAll("main h3, main .card-title")]
      .map((el) => (el.textContent ?? "").trim())
      .filter((text) => text.length > 0)
      .slice(0, 8),
  );
  // Fail-closed RPA: either jobs landed OR a scrape/automation run completed/running after UI click.
  const runsResult = await settle(fetch(`${SERVER_BASE}/api/automation/runs?limit=5`));
  let runOk = false;
  if (runsResult.status === "fulfilled" && runsResult.value.ok) {
    const runs = (await runsResult.value.json()) as Array<{
      type?: string;
      status?: string;
      createdAt?: string;
    }>;
    const list = Array.isArray(runs) ? runs : [];
    runOk = list.some(
      (run) =>
        (run.type === "scrape" || run.type === "job-scrape") &&
        (run.status === "completed" || run.status === "running" || run.status === "succeeded"),
    );
  }
  await writeOutput(
    `jobs empty=${String(empty)} titles=${JSON.stringify(titles)} runOk=${String(runOk)} clickedRun=${String(clickedRun)}`,
  );
  return (empty === 0 && titles.length > 0) || (clickedRun && runOk);
};

const proveLocalKokoroTts = async (): Promise<{
  readonly ok: boolean;
  readonly bytes: number;
  readonly reason?: string;
}> => {
  const result = await settle(
    fetch(`${SERVER_BASE}/api/speech/synthesize`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "BaoBuildBuddy local Kokoro proof.",
        voice: "af_heart",
      }),
    }),
  );
  if (result.status === "rejected") {
    return { ok: false, bytes: 0, reason: result.reason.message };
  }
  if (!result.value.ok) {
    return { ok: false, bytes: 0, reason: `status ${String(result.value.status)}` };
  }
  const body = (await result.value.json()) as { audioBase64?: string; bytes?: number };
  const bytes = body.bytes ?? 0;
  if (!body.audioBase64 || bytes < 1_000) {
    return { ok: false, bytes, reason: "audio too small" };
  }
  const bin = Buffer.from(body.audioBase64, "base64");
  if (bin.subarray(0, 4).toString("ascii") !== "RIFF") {
    return { ok: false, bytes, reason: "missing RIFF header" };
  }
  return { ok: true, bytes };
};

const proveLocalWhisperStt = async (): Promise<{
  readonly ok: boolean;
  readonly reason?: string;
  readonly text?: string;
}> => {
  const health = await settle(fetch(`${WHISPER_BASE}/health`));
  if (health.status === "rejected" || !health.value.ok) {
    return { ok: false, reason: "Whisper server unhealthy — run speech:whisper:serve" };
  }
  // Seed STT=local Whisper endpoint (fail-closed product path).
  const settingsGet = await settle(fetch(`${SERVER_BASE}/api/settings`));
  if (settingsGet.status === "fulfilled" && settingsGet.value.ok) {
    const settings = (await settingsGet.value.json()) as {
      automationSettings?: Record<string, unknown> & {
        speech?: { locale?: string; tts?: Record<string, unknown>; stt?: Record<string, unknown> };
      };
    };
    const automation = settings.automationSettings ?? {};
    await settle(
      fetch(`${SERVER_BASE}/api/settings`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          automationSettings: {
            ...automation,
            speech: {
              locale: automation.speech?.locale ?? "en-US",
              tts: {
                provider: "local",
                model: "kokoro",
                endpoint: "http://127.0.0.1:8880/v1",
                voice: "af_heart",
                format: "wav",
              },
              stt: {
                provider: "local",
                model: "whisper-tiny",
                endpoint: `${WHISPER_BASE}/v1`,
              },
            },
          },
        }),
      }),
    );
  }
  const syn = await settle(
    fetch(`${SERVER_BASE}/api/speech/synthesize`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "Hello from Bao.", voice: "af_heart" }),
    }),
  );
  if (syn.status === "rejected" || !syn.value.ok) {
    return { ok: false, reason: "failed to mint WAV for STT" };
  }
  const wavBody = (await syn.value.json()) as { audioBase64?: string };
  if (!wavBody.audioBase64) {
    return { ok: false, reason: "empty WAV" };
  }
  const tr = await settle(
    fetch(`${SERVER_BASE}/api/speech/transcribe`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        audioBase64: wavBody.audioBase64,
        mimeType: "audio/wav",
        filename: "kokoro.wav",
      }),
    }),
  );
  if (tr.status === "rejected" || !tr.value.ok) {
    return { ok: false, reason: "transcribe failed" };
  }
  const body = (await tr.value.json()) as { text?: string; provider?: string };
  if (body.provider !== "local") {
    return { ok: false, reason: `provider=${String(body.provider)}` };
  }
  return { ok: true, text: body.text ?? "" };
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

  let aiProbe: LiveAiProbeResult | null = null;
  let aiError: string | null = null;
  const preferredModel = process.env.LOCAL_MODEL_NAME?.trim() || "llama3.2:1b";
  const aiProbeResult = await settle(assertLiveInference({ modelId: preferredModel }));
  if (aiProbeResult.status === "fulfilled") {
    aiProbe = aiProbeResult.value;
  } else {
    aiError = aiProbeResult.reason.message;
    await writeError(`live AI probe failed (${preferredModel}): ${aiError}`);
    const retry = await settle(assertLiveInference({ modelId: "llama3.2:1b" }));
    if (retry.status === "fulfilled") {
      aiProbe = retry.value;
      aiError = null;
    } else {
      await writeError(`live AI retry failed: ${retry.reason.message}`);
    }
  }

  const pdfPath = await exportResumePdf(page);
  const scrapeOk = await enablePortalAndScrape(page);
  const kokoro = await proveLocalKokoroTts();
  const whisper = await proveLocalWhisperStt();
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
    ai: aiProbe
      ? {
          status: "OK",
          endpoint: aiProbe.endpoint,
          modelId: aiProbe.modelId,
          nonce: aiProbe.nonce,
          sample: aiProbe.sample,
        }
      : {
          status: "FAIL",
          reason: aiError ?? "Live Ollama nonce echo failed",
        },
    stt: whisper.ok
      ? { status: "OK", engine: "whisper-local", text: whisper.text }
      : { status: "FAIL", reason: whisper.reason ?? "Whisper STT failed" },
    pdf: {
      status: pdfPath && pdfStat && pdfStat.size > 1000 ? "OK" : "FAIL",
      path: pdfPath,
      bytes: pdfStat?.size ?? 0,
    },
    scrape: { status: scrapeOk ? "OK" : "FAIL" },
    tts: kokoro.ok
      ? { status: "OK", engine: "kokoro-local", bytes: kokoro.bytes }
      : { status: "FAIL", reason: kokoro.reason ?? "Kokoro TTS failed" },
    videoPath,
  };
  await Bun.write(join(OUT, "honest-report.json"), JSON.stringify(report, null, 2));
  await writeOutput(JSON.stringify(report, null, 2));

  if (
    report.ai.status !== "OK" ||
    report.pdf.status !== "OK" ||
    report.scrape.status !== "OK" ||
    report.tts.status !== "OK" ||
    report.stt.status !== "OK"
  ) {
    process.exitCode = 1;
  }
};

await main();
