const NUM_2000 = 2_000;
const NUM_240 = 240;
const NUM_30 = 30;
const NUM_50000 = 50_000;
/**
 * Headed product demo video — real local AI + Whisper STT, mock interview,
 * stylized resume / portfolio / cover-letter generation.
 */
import { mkdir, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { APP_ROUTE_BUILDERS, APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import { demoInterview } from "./browser-record-product-demo-interview";
import {
  assertLiveInference,
  assertLiveWhisper,
  seedSpeechAndAiSettings,
} from "./browser-record-product-demo-probes";
import { startDisplayRecorder } from "./browser-record-product-demo-recorder";
import { demoResumeGuidedBuild } from "./browser-record-product-demo-resume";
import {
  CLIENT_BASE,
  DEMO_VIEWPORT,
  FAKE_AUDIO_WAV,
  OUT,
  shot,
  wait,
} from "./browser-record-product-demo-shared";
import { demoAiChat, demoCoverLetter, demoPortfolio } from "./browser-record-product-demo-surfaces";
import { writeError, writeOutput } from "./utils/cli-output";
import { resolveProofEnv } from "./utils/proof-script-env";

const runProductTour = async (
  page: Page,
  liveModelId: string,
  whisperEndpoint: string,
): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.dashboard}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, NUM_2000);
  await shot(page, "00-dashboard");
  await page.goto(`${CLIENT_BASE}${APP_ROUTE_BUILDERS.settingsSection("aiProviders")}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, NUM_2000);
  await shot(page, "01-ai-providers-configured");
  await writeOutput(`settings shown; live LLM=${liveModelId} whisper=${whisperEndpoint}`);
  await demoResumeGuidedBuild(page);
  await demoPortfolio(page);
  await demoCoverLetter(page);
  await demoAiChat(page);
  await demoInterview(page);
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.dashboard}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, NUM_2000);
  await shot(page, "19-dashboard-complete");
};

const finalizeDemoReport = async (input: {
  liveEndpoint: string;
  liveModelId: string;
  liveSample: string;
  whisperEndpoint: string;
  whisperSample: string;
  tourError: string | null;
  mp4Path: string | null;
  webmPath: string | null;
  consoleErrors: readonly string[];
}): Promise<void> => {
  const stillCount = (await readdir(join(OUT, "stills"))).filter((name) =>
    name.endsWith(".png"),
  ).length;
  const webmBytes = input.webmPath ? (await stat(input.webmPath)).size : 0;
  const mp4Bytes = input.mp4Path ? (await stat(input.mp4Path)).size : 0;
  const report = {
    CLIENT_BASE,
    liveEndpoint: input.liveEndpoint,
    liveModelId: input.liveModelId,
    liveSample: input.liveSample.slice(0, NUM_240),
    whisperEndpoint: input.whisperEndpoint,
    whisperSample: input.whisperSample.slice(0, NUM_240),
    mockUsed: false,
    capture: "ffmpeg-x11grab",
    tourError: input.tourError,
    stillCount,
    webmPath: input.webmPath,
    webmBytes,
    mp4Path: input.mp4Path,
    mp4Bytes,
    consoleErrorCount: input.consoleErrors.length,
    consoleErrors: input.consoleErrors.slice(0, NUM_30),
    display: resolveProofEnv("DISPLAY") ?? null,
  };
  await Bun.write(join(OUT, "demo-report.json"), JSON.stringify(report, null, 2));
  await writeOutput(
    `browser-record-product-demo: stills=${String(stillCount)} webm=${input.webmPath ?? "none"} (${String(webmBytes)}) mp4=${input.mp4Path ?? "none"} (${String(mp4Bytes)}) errors=${String(input.consoleErrors.length)} live=${input.liveModelId} tourError=${input.tourError ?? "none"}`,
  );
  if ((!input.mp4Path || mp4Bytes < NUM_50000) && (!input.webmPath || webmBytes < NUM_50000)) {
    await writeError("Product demo incomplete (missing/small video).");
    process.exitCode = 1;
  } else if (input.tourError) {
    await writeError("Product demo incomplete (tour error).");
    process.exitCode = 1;
  }
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  await mkdir(join(OUT, "downloads"), { recursive: true });
  await mkdir(join(OUT, "raw-segments"), { recursive: true });

  const live = await assertLiveInference();
  const whisper = await assertLiveWhisper();
  await seedSpeechAndAiSettings(live.modelId);
  const recorder = startDisplayRecorder();

  const browser = await chromium.launch({
    headless: false,
    args: [
      "--disable-dev-shm-usage",
      `--window-size=${String(DEMO_VIEWPORT.width)},${String(DEMO_VIEWPORT.height)}`,
      "--window-position=0,0",
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-audio-capture=${FAKE_AUDIO_WAV}`,
    ],
  });
  const context = await browser.newContext({
    viewport: { ...DEMO_VIEWPORT },
    acceptDownloads: true,
    permissions: ["microphone"],
  });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text().slice(0, NUM_240));
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(`PAGE:${error.message.slice(0, NUM_240)}`);
  });

  let tourError: string | null = null;
  const tourSettled = await runProductTour(page, live.modelId, whisper.endpoint).then(
    () => ({ status: "fulfilled" as const }),
    (error: Error) => ({ status: "rejected" as const, error }),
  );
  if (tourSettled.status === "rejected") {
    tourError = tourSettled.error.message;
    await writeError(`product demo tour failed: ${tourError}`);
    await settle(shot(page, "99-tour-failed"));
  }

  await context.close();
  await browser.close();
  const { mp4Path, webmPath } = await recorder.stop();
  await finalizeDemoReport({
    liveEndpoint: live.endpoint,
    liveModelId: live.modelId,
    liveSample: live.sample,
    whisperEndpoint: whisper.endpoint,
    whisperSample: whisper.text,
    tourError,
    mp4Path,
    webmPath,
    consoleErrors,
  });
};

await main();
