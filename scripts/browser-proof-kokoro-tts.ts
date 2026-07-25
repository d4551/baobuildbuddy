/**
 * Authentic Kokoro local TTS proof — UI click Test speaker with TTS=local.
 * Fail-closed: must receive RIFF WAV ≥1KB from /api/speech/synthesize (not speechSynthesis).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { API_ENDPOINTS } from "../packages/shared/src/constants/endpoints";
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
const OUT = process.env.KOKORO_PROOF_OUT ?? "/opt/cursor/artifacts/live-capabilities/kokoro-tts";

const RE_SAVE_SPEECH = /Save Speech Profile|Save speech/i;
const RE_VOICE_SETTINGS = /Speech|Voice|音声|Voix|Voz/i;

const wait = async (page: Page, ms: number): Promise<void> => {
  await page.waitForTimeout(ms);
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  await mkdir(join(OUT, "raw"), { recursive: true });
  await mkdir(join(OUT, "audio"), { recursive: true });
  const findings: string[] = [];

  // Direct API probe first (LDL — no UI false green without bytes)
  const apiProbe = await settle(
    fetch(`${SERVER_BASE}/api/speech/synthesize`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "Kokoro local on-device text to speech proof.",
        voice: "af_heart",
      }),
    }),
  );
  if (apiProbe.status === "rejected") {
    findings.push(`synthesize API unreachable: ${apiProbe.reason.message}`);
  } else {
    const status = apiProbe.value.status;
    const jsonResult = await settle(apiProbe.value.json());
    if (status !== 200 || jsonResult.status === "rejected") {
      findings.push(`synthesize API status=${String(status)} (Kokoro server up? speech:kokoro:serve)`);
    } else {
      const body = jsonResult.value as {
        audioBase64?: string;
        bytes?: number;
        provider?: string;
        model?: string;
      };
      if ((body.bytes ?? 0) < 1_000 || !body.audioBase64) {
        findings.push(`synthesize audio too small bytes=${String(body.bytes ?? 0)}`);
      } else {
        const bin = Buffer.from(body.audioBase64, "base64");
        if (bin.subarray(0, 4).toString("ascii") !== "RIFF") {
          findings.push("synthesize audio missing RIFF header");
        } else {
          await writeFile(join(OUT, "audio", "kokoro-api.wav"), bin);
        }
        if (body.provider !== "local") {
          findings.push(`expected provider=local got ${String(body.provider)}`);
        }
      }
    }
  }

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    recordVideo: { dir: join(OUT, "raw"), size: { width: 1440, height: 900 } },
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  let synthesizeCalls = 0;
  page.on("request", (req) => {
    if (req.url().includes(API_ENDPOINTS.speechSynthesize) && req.method() === "POST") {
      synthesizeCalls += 1;
    }
  });

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.aiChat}`, { waitUntil: "networkidle" });
  await wait(page, 1_200);

  const voiceSummary = page.locator("details.collapse summary").filter({ hasText: RE_VOICE_SETTINGS }).first();
  if ((await voiceSummary.count()) > 0) {
    await voiceSummary.click();
    await wait(page, 500);
  }

  const ttsSelect = page.locator("#speech-profile-tts-provider");
  if ((await ttsSelect.count()) > 0) {
    await ttsSelect.selectOption("local");
    await wait(page, 300);
  } else {
    findings.push("TTS provider select missing");
  }

  const saveBtn = page.getByRole("button", { name: RE_SAVE_SPEECH });
  if ((await saveBtn.count()) > 0) {
    await saveBtn.click();
    await wait(page, 800);
  }
  await page.screenshot({ path: join(OUT, "stills", "01-kokoro-settings.png") });

  const testTts = page.getByTestId("on-device-tts-test");
  if ((await testTts.count()) === 0) {
    findings.push("Test speaker control missing");
  } else {
    await testTts.click({ force: true });
    await wait(page, 4_000);
  }
  await page.screenshot({ path: join(OUT, "stills", "02-kokoro-test-speak.png") });

  if (synthesizeCalls < 1) {
    findings.push("UI Test speaker never called /api/speech/synthesize (still on speechSynthesis?)");
  }

  const video = page.video();
  await context.close();
  await browser.close();
  let videoPath: string | null = null;
  if (video) {
    const raw = await video.path();
    videoPath = join(OUT, "kokoro-tts.webm");
    await Bun.write(videoPath, Bun.file(raw));
  }

  const report = { ok: findings.length === 0, findings, synthesizeCalls, videoPath };
  await writeFile(join(OUT, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeOutput(
    `kokoro-tts: ok=${String(report.ok)} synthesizeCalls=${String(synthesizeCalls)}`,
  );
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
