/**
 * STT proof — server transcription via /api/speech with a generated WAV fixture.
 * Browser mic is env-blocked; this proves the wired STT API path fail-closed.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import { writeError, writeOutput } from "./utils/cli-output";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const SERVER_BASE = (process.env.PAGE_PROOF_SERVER_BASE ?? "http://127.0.0.1:3000").replace(
  /\/$/u,
  "",
);
const OUT = process.env.STT_PROOF_OUT ?? "/opt/cursor/artifacts/live-capabilities/stt-live";

const wait = async (page: Page, ms: number): Promise<void> => {
  await page.waitForTimeout(ms);
};

/** Minimal silent WAV (PCM 16-bit mono 8kHz, 0.25s). */
const buildSilentWav = (): Uint8Array => {
  const sampleRate = 8_000;
  const samples = sampleRate / 4;
  const dataSize = samples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (offset: number, value: string): void => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  return new Uint8Array(buffer);
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  await mkdir(join(OUT, "raw"), { recursive: true });
  const findings: string[] = [];

  // UI: mic control must exist (wired), even if permission denied.
  const browser = await chromium.launch({
    headless: false,
    args: [
      "--disable-dev-shm-usage",
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
  });
  const context = await browser.newContext({
    permissions: ["microphone"],
    recordVideo: { dir: join(OUT, "raw"), size: { width: 1440, height: 900 } },
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.aiChat}`, { waitUntil: "networkidle" });
  await wait(page, 1_200);

  const mic = page.getByRole("button", { name: /Listen|Microphone|Voice|Speech|Mic/i }).first();
  if ((await mic.count()) === 0) {
    findings.push("STT mic control not wired in AI Chat UI");
  } else {
    await mic.click();
    await wait(page, 1_000);
    await page.screenshot({ path: join(OUT, "stills", "01-stt-mic.png"), fullPage: false });
  }

  // API path: POST speech with WAV — expect configured path OR honest 422 not-configured (not 404).
  const wav = buildSilentWav();
  const form = new FormData();
  form.append("audio", new Blob([wav], { type: "audio/wav" }), "silence.wav");
  const apiResult = await settle(
    fetch(`${SERVER_BASE}/api/speech/transcribe`, {
      method: "POST",
      body: form,
    }),
  );
  if (apiResult.status === "rejected") {
    findings.push(`STT API fetch failed: ${apiResult.reason.message}`);
  } else {
    const status = apiResult.value.status;
    if (status === 404) {
      findings.push("STT API route missing (404) — unwired");
    } else if (status === 422 || status === 200 || status === 201) {
      // 422 not-configured is honest wiring; 200 is live provider.
      await writeFile(
        join(OUT, "api-status.txt"),
        `status=${String(status)} body=${(await apiResult.value.text()).slice(0, 400)}\n`,
      );
    } else {
      findings.push(`STT API unexpected status ${String(status)}`);
    }
  }

  const video = page.video();
  await context.close();
  await browser.close();
  let videoPath: string | null = null;
  if (video) {
    const raw = await video.path();
    videoPath = join(OUT, "stt-live.webm");
    await Bun.write(videoPath, Bun.file(raw));
  }

  const report = { ok: findings.length === 0, findings, videoPath };
  await writeFile(join(OUT, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeOutput(`stt-live: findings=${String(findings.length)}`);
  if (findings.length > 0) {
    for (const finding of findings) {
      await writeError(finding);
    }
    process.exit(1);
  }
};

const run = await settle(main());
if (run.status === "rejected") {
  await writeError(run.reason.message);
  process.exit(1);
}
