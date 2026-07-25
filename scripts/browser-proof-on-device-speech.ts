/**
 * Fail-closed headed proof for **on-device** TTS/STT (browser Web Speech API).
 * Opens AI Chat voice settings → Browser (on-device) → mic + replay/auto-speak.
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
const OUT =
  process.env.ON_DEVICE_SPEECH_OUT ?? "/opt/cursor/artifacts/live-capabilities/on-device-speech";

const RE_SAVE_SPEECH = /Save Speech Profile|Save speech/i;
const RE_VOICE_SETTINGS = /Speech|Voice|音声|Voix|Voz/i;

const wait = async (page: Page, ms: number): Promise<void> => {
  await page.waitForTimeout(ms);
};

const shot = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({ path: join(OUT, "stills", `${name}.png`), fullPage: false });
};

const installOnDeviceSpeechHooks = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    const g = globalThis as typeof globalThis & {
      __baoOnDeviceSpeech?: {
        recognitionStarts: number;
        synthesisSpeaks: number;
        usedRecognitionPolyfill: boolean;
      };
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    };
    g.__baoOnDeviceSpeech = {
      recognitionStarts: 0,
      synthesisSpeaks: 0,
      usedRecognitionPolyfill: false,
    };

    const hasNativeRecognition = Boolean(g.SpeechRecognition || g.webkitSpeechRecognition);
    if (!hasNativeRecognition) {
      g.__baoOnDeviceSpeech.usedRecognitionPolyfill = true;
      class PolyfillRecognition {
        continuous = false;
        interimResults = false;
        lang = "en-US";
        onresult: ((ev: SpeechRecognitionEvent) => void) | null = null;
        onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null = null;
        onend: (() => void) | null = null;
        start(): void {
          g.__baoOnDeviceSpeech!.recognitionStarts += 1;
          const resultEvent = {
            results: {
              0: { 0: { transcript: "on device stt proof" }, isFinal: true, length: 1 },
              length: 1,
            },
            resultIndex: 0,
          } as unknown as SpeechRecognitionEvent;
          queueMicrotask(() => {
            this.onresult?.(resultEvent);
            this.onend?.();
          });
        }
        stop(): void {
          this.onend?.();
        }
        abort(): void {
          this.onend?.();
        }
      }
      g.SpeechRecognition = PolyfillRecognition as unknown as new () => SpeechRecognition;
      g.webkitSpeechRecognition = g.SpeechRecognition;
    } else {
      const NativeCtor = g.SpeechRecognition ?? g.webkitSpeechRecognition;
      if (NativeCtor) {
        const proto = NativeCtor.prototype as SpeechRecognition & { start: () => void };
        const originalStart = proto.start;
        proto.start = function patchedStart(this: SpeechRecognition): void {
          g.__baoOnDeviceSpeech!.recognitionStarts += 1;
          return originalStart.apply(this);
        };
      }
    }

    if (typeof speechSynthesis !== "undefined") {
      const originalSpeak = speechSynthesis.speak.bind(speechSynthesis);
      speechSynthesis.speak = (utterance: SpeechSynthesisUtterance) => {
        g.__baoOnDeviceSpeech!.synthesisSpeaks += 1;
        originalSpeak(utterance);
      };
    }
  });
};

const readHooks = async (page: Page) =>
  page.evaluate(() => {
    const g = globalThis as typeof globalThis & {
      __baoOnDeviceSpeech?: {
        recognitionStarts: number;
        synthesisSpeaks: number;
        usedRecognitionPolyfill: boolean;
      };
    };
    return (
      g.__baoOnDeviceSpeech ?? {
        recognitionStarts: 0,
        synthesisSpeaks: 0,
        usedRecognitionPolyfill: false,
      }
    );
  });

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  await mkdir(join(OUT, "raw"), { recursive: true });
  const findings: string[] = [];

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
  await installOnDeviceSpeechHooks(page);

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.aiChat}`, { waitUntil: "networkidle" });
  await wait(page, 1_500);

  // Expand voice settings collapse (SpeechModelProfileFields lives here)
  const voiceSummary = page.locator("details.collapse summary").filter({ hasText: RE_VOICE_SETTINGS }).first();
  if ((await voiceSummary.count()) > 0) {
    await voiceSummary.click();
    await wait(page, 600);
  } else {
    await page.locator("details.collapse summary").first().click();
    await wait(page, 600);
  }

  const sttSelect = page.locator("#speech-profile-stt-provider");
  const ttsSelect = page.locator("#speech-profile-tts-provider");
  if ((await sttSelect.count()) === 0 || (await ttsSelect.count()) === 0) {
    findings.push("On-device provider selects missing inside AI Chat voice settings");
  } else {
    await sttSelect.selectOption("browser");
    await ttsSelect.selectOption("browser");
  }

  const hint = page.getByTestId("on-device-speech-hint");
  if ((await hint.count()) === 0) {
    findings.push("on-device speech hint not visible after selecting browser providers");
  }
  await shot(page, "01-ai-chat-on-device-settings");

  const saveBtn = page.getByRole("button", { name: RE_SAVE_SPEECH });
  if ((await saveBtn.count()) > 0) {
    await saveBtn.click();
    await wait(page, 800);
  }

  // On-device STT mic
  const mic = page.getByTestId("on-device-stt-mic");
  if ((await mic.count()) === 0) {
    findings.push("on-device STT mic control missing");
  } else {
    await mic.click();
    await wait(page, 1_200);
  }
  await shot(page, "02-on-device-stt-mic");

  // Prefer auto-speak if exposed; compact mode hides it — open non-compact path via evaluate on useSpeech
  // Send chat then replay
  const input = page.locator("textarea").first();
  if ((await input.count()) > 0) {
    await input.fill("Reply briefly: on-device TTS proof.");
    const send = page.getByRole("button", { name: /Send|Submit/i }).first();
    if ((await send.count()) > 0) {
      await send.click();
      await wait(page, 8_000);
    }
  }

  const testTts = page.getByTestId("on-device-tts-test");
  if ((await testTts.count()) === 0) {
    findings.push("on-device TTS test-speaker control missing");
  } else {
    await testTts.click({ force: true });
    await wait(page, 1_200);
  }
  await shot(page, "03-on-device-tts");

  const hooks = await readHooks(page);
  if (hooks.recognitionStarts < 1) {
    findings.push("On-device STT: SpeechRecognition.start was never invoked");
  }
  if (hooks.synthesisSpeaks < 1) {
    findings.push("On-device TTS: speechSynthesis.speak was never invoked");
  }

  const video = page.video();
  await context.close();
  await browser.close();
  let videoPath: string | null = null;
  if (video) {
    const raw = await video.path();
    videoPath = join(OUT, "on-device-speech.webm");
    await Bun.write(videoPath, Bun.file(raw));
  }

  const report = {
    ok: findings.length === 0,
    mode: "on-device-web-speech",
    hooks,
    findings,
    videoPath,
  };
  await writeFile(join(OUT, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeOutput(
    `on-device-speech: ok=${String(report.ok)} sttStarts=${String(hooks.recognitionStarts)} ttsSpeaks=${String(hooks.synthesisSpeaks)} polyfill=${String(hooks.usedRecognitionPolyfill)}`,
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
