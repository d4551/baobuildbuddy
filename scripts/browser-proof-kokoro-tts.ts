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
import {
  BYTES_ONE_KILO_MIN,
  COUNT_FIVE_HUNDRED,
  COUNT_FOUR,
  HTTP_OK,
  MS_EIGHT_HUNDRED,
  MS_FOUR_SECONDS,
  MS_ONE_TWO_HUNDRED,
  MS_THREE_HUNDRED,
  VIEWPORT_HEIGHT_DESKTOP,
  VIEWPORT_WIDTH_DESKTOP,
} from "./constants/numeric-literals";
import { writeError, writeOutput } from "./utils/cli-output";
import { settlePage } from "./utils/playwright-settle";
import { reportFindingsAndExit } from "./utils/proof-findings";
import {
  artifactDir,
  resolveProofClientBase,
  resolveProofEnv,
  resolveProofOutDir,
} from "./utils/proof-script-env";

const CLIENT_BASE = resolveProofClientBase("http://127.0.0.1:3001");
const SERVER_BASE = (resolveProofEnv("PAGE_PROOF_SERVER_BASE") ?? "http://127.0.0.1:3000").replace(
  /\/$/u,
  "",
);
const OUT = resolveProofOutDir(
  "KOKORO_PROOF_OUT",
  artifactDir("live-capabilities", "kokoro-tts"),
);
const RE_SAVE_SPEECH = /Save Speech Profile|Save speech/i;
const RE_VOICE_SETTINGS = /Speech|Voice|音声|Voix|Voz/i;
const DESKTOP_VIEWPORT = {
  width: VIEWPORT_WIDTH_DESKTOP,
  height: VIEWPORT_HEIGHT_DESKTOP,
} as const;

const wait = settlePage;

const probeSynthesizeApi = async (findings: string[]): Promise<void> => {
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
    return;
  }
  const status = apiProbe.value.status;
  const jsonResult = await settle(apiProbe.value.json());
  if (status !== HTTP_OK || jsonResult.status === "rejected") {
    findings.push(
      `synthesize API status=${String(status)} (Kokoro server up? speech:kokoro:serve)`,
    );
    return;
  }
  const body = jsonResult.value as {
    audioBase64?: string;
    bytes?: number;
    provider?: string;
    model?: string;
  };
  if ((body.bytes ?? 0) < BYTES_ONE_KILO_MIN || !body.audioBase64) {
    findings.push(`synthesize audio too small bytes=${String(body.bytes ?? 0)}`);
    return;
  }
  const bin = Buffer.from(body.audioBase64, "base64");
  if (bin.subarray(0, COUNT_FOUR).toString("ascii") !== "RIFF") {
    findings.push("synthesize audio missing RIFF header");
  } else {
    await writeFile(join(OUT, "audio", "kokoro-api.wav"), bin);
  }
  if (body.provider !== "local") {
    findings.push(`expected provider=local got ${String(body.provider)}`);
  }
};

const probeUiTestSpeaker = async (
  page: Page,
  findings: string[],
  synthesizeCalls: () => number,
): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.aiChat}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_ONE_TWO_HUNDRED);
  const voiceSummary = page
    .locator("details.collapse summary")
    .filter({ hasText: RE_VOICE_SETTINGS })
    .first();
  if ((await voiceSummary.count()) > 0) {
    await voiceSummary.click();
    await wait(page, COUNT_FIVE_HUNDRED);
  }
  const ttsSelect = page.locator("#speech-profile-tts-provider");
  if ((await ttsSelect.count()) > 0) {
    await ttsSelect.selectOption("local");
    await wait(page, MS_THREE_HUNDRED);
  } else {
    findings.push("TTS provider select missing");
  }
  const saveBtn = page.getByRole("button", { name: RE_SAVE_SPEECH });
  if ((await saveBtn.count()) > 0) {
    await saveBtn.click();
    await wait(page, MS_EIGHT_HUNDRED);
  }
  await page.screenshot({ path: join(OUT, "stills", "01-kokoro-settings.png") });
  const testTts = page.getByTestId("on-device-tts-test");
  if ((await testTts.count()) === 0) {
    findings.push("Test speaker control missing");
  } else {
    await testTts.click();
    await wait(page, MS_FOUR_SECONDS);
  }
  await page.screenshot({ path: join(OUT, "stills", "02-kokoro-test-speak.png") });
  if (synthesizeCalls() < 1) {
    findings.push(
      "UI Test speaker never called /api/speech/synthesize (still on speechSynthesis?)",
    );
  }
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  await mkdir(join(OUT, "raw"), { recursive: true });
  await mkdir(join(OUT, "audio"), { recursive: true });
  const findings: string[] = [];
  await probeSynthesizeApi(findings);
  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    recordVideo: { dir: join(OUT, "raw"), size: DESKTOP_VIEWPORT },
    viewport: DESKTOP_VIEWPORT,
  });
  const page = await context.newPage();
  let synthesizeCalls = 0;
  page.on("request", (req) => {
    if (req.url().includes(API_ENDPOINTS.speechSynthesize) && req.method() === "POST") {
      synthesizeCalls += 1;
    }
  });
  await probeUiTestSpeaker(page, findings, () => synthesizeCalls);
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
  await reportFindingsAndExit(findings);
};

const run = await settle(main());
if (run.status === "rejected") {
  await writeError(run.reason.message);
  process.exit(1);
}
