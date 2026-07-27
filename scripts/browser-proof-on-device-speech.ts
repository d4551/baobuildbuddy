/**
 * Fail-closed headed proof for **on-device** TTS/STT (browser Web Speech API).
 * Opens AI Chat voice settings → Browser (on-device) → mic + replay/auto-speak.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import {
  MS_EIGHT_HUNDRED,
  MS_EIGHT_SECONDS,
  MS_ONE_AND_HALF_SECONDS,
  MS_ONE_TWO_HUNDRED,
  MS_SIX_HUNDRED,
  VIEWPORT_HEIGHT_DESKTOP,
  VIEWPORT_WIDTH_DESKTOP,
} from "./constants/numeric-literals";
import { writeError, writeOutput } from "./utils/cli-output";
import { settlePage } from "./utils/playwright-settle";
import { reportFindingsAndExit } from "./utils/proof-findings";
import { artifactDir, resolveProofClientBase, resolveProofOutDir } from "./utils/proof-script-env";

const CLIENT_BASE = resolveProofClientBase("http://127.0.0.1:3001");
const OUT = resolveProofOutDir(
  "ON_DEVICE_SPEECH_OUT",
  artifactDir("live-capabilities", "on-device-speech"),
);

const RE_SAVE_SPEECH = /Save Speech Profile|Save speech/i;
const RE_VOICE_SETTINGS = /Speech|Voice|音声|Voix|Voz/i;
const RE_SEND = /Send|Submit/i;
const DESKTOP_VIEWPORT = {
  width: VIEWPORT_WIDTH_DESKTOP,
  height: VIEWPORT_HEIGHT_DESKTOP,
} as const;

/**
 * The result surface this proof constructs and the app under test reads. Modelling it
 * explicitly avoids asserting the fabricated event *is* a DOM `SpeechRecognitionEvent` —
 * that claim was a lazy cast over a shape with no real overlap (no `item()`, no
 * `SpeechRecognitionResultList`), so the compiler could not check either side of it.
 */
interface SpeechProofResultEvent extends Event {
  readonly results: {
    readonly 0: {
      readonly 0: { readonly transcript: string };
      readonly isFinal: boolean;
      readonly length: number;
    };
    readonly length: number;
  };
  readonly resultIndex: number;
}

/**
 * `lib.dom` declares the Web Speech *event* types but not the recognition interface, so the
 * page-context script below has no name for what it constructs and patches. Declared here
 * with exactly the members this proof touches rather than widened away.
 */
interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: SpeechProofResultEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
}

type SpeechHooks = {
  recognitionStarts: number;
  synthesisSpeaks: number;
  usedRecognitionPolyfill: boolean;
};

const wait = settlePage;

const shot = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({ path: join(OUT, "stills", `${name}.png`), fullPage: false });
};

/** Runs in the page; must stay self-contained for Playwright addInitScript. */
const onDeviceSpeechInitScript = (): void => {
  const g = globalThis as typeof globalThis & {
    __baoOnDeviceSpeech?: SpeechHooks;
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  };
  g.__baoOnDeviceSpeech = {
    recognitionStarts: 0,
    synthesisSpeaks: 0,
    usedRecognitionPolyfill: false,
  };
  const hooksState = g.__baoOnDeviceSpeech;
  const hasNativeRecognition = Boolean(g.SpeechRecognition || g.webkitSpeechRecognition);
  if (!hasNativeRecognition) {
    hooksState.usedRecognitionPolyfill = true;
    class PolyfillRecognition {
      continuous = false;
      interimResults = false;
      lang = "en-US";
      onresult: ((ev: SpeechProofResultEvent) => void) | null = null;
      onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null = null;
      onend: (() => void) | null = null;
      start(): void {
        const state = g.__baoOnDeviceSpeech;
        if (state) {
          state.recognitionStarts += 1;
        }
        const resultEvent = Object.assign(new Event("result"), {
          results: {
            0: { 0: { transcript: "on device stt proof" }, isFinal: true, length: 1 },
            length: 1,
          },
          resultIndex: 0,
        });
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
    g.SpeechRecognition = PolyfillRecognition;
    g.webkitSpeechRecognition = PolyfillRecognition;
  } else {
    const NativeCtor = g.SpeechRecognition ?? g.webkitSpeechRecognition;
    if (NativeCtor) {
      type StartFn = (this: SpeechRecognition) => void;
      const originalStart = Reflect.get(NativeCtor.prototype, "start") as StartFn;
      Reflect.set(
        NativeCtor.prototype,
        "start",
        function patchedStart(this: SpeechRecognition): void {
          const state = g.__baoOnDeviceSpeech;
          if (state) {
            state.recognitionStarts += 1;
          }
          Reflect.apply(originalStart, this, []);
        },
      );
    }
  }
  if (typeof speechSynthesis !== "undefined") {
    const originalSpeak = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (utterance: SpeechSynthesisUtterance) => {
      const state = g.__baoOnDeviceSpeech;
      if (state) {
        state.synthesisSpeaks += 1;
      }
      originalSpeak(utterance);
    };
  }
};

const installOnDeviceSpeechHooks = async (page: Page): Promise<void> => {
  await page.addInitScript(onDeviceSpeechInitScript);
};

const readHooks = async (page: Page): Promise<SpeechHooks> =>
  page.evaluate(() => {
    const g = globalThis as typeof globalThis & { __baoOnDeviceSpeech?: SpeechHooks };
    return (
      g.__baoOnDeviceSpeech ?? {
        recognitionStarts: 0,
        synthesisSpeaks: 0,
        usedRecognitionPolyfill: false,
      }
    );
  });

const configureBrowserProviders = async (page: Page, findings: string[]): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.aiChat}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  const voiceSummary = page
    .locator("details.collapse summary")
    .filter({ hasText: RE_VOICE_SETTINGS })
    .first();
  if ((await voiceSummary.count()) > 0) {
    await voiceSummary.click();
    await wait(page, MS_SIX_HUNDRED);
  } else {
    await page.locator("details.collapse summary").first().click();
    await wait(page, MS_SIX_HUNDRED);
  }
  const sttSelect = page.locator("#speech-profile-stt-provider");
  const ttsSelect = page.locator("#speech-profile-tts-provider");
  if ((await sttSelect.count()) === 0 || (await ttsSelect.count()) === 0) {
    findings.push("On-device provider selects missing inside AI Chat voice settings");
  } else {
    await sttSelect.selectOption("browser");
    await ttsSelect.selectOption("browser");
  }
  if ((await page.getByTestId("on-device-speech-hint").count()) === 0) {
    findings.push("on-device speech hint not visible after selecting browser providers");
  }
  await shot(page, "01-ai-chat-on-device-settings");
  const saveBtn = page.getByRole("button", { name: RE_SAVE_SPEECH });
  if ((await saveBtn.count()) > 0) {
    await saveBtn.click();
    await wait(page, MS_EIGHT_HUNDRED);
  }
};

const exerciseMicAndTts = async (page: Page, findings: string[]): Promise<void> => {
  const mic = page.getByTestId("on-device-stt-mic");
  if ((await mic.count()) === 0) {
    findings.push("on-device STT mic control missing");
  } else {
    await mic.click();
    await wait(page, MS_ONE_TWO_HUNDRED);
  }
  await shot(page, "02-on-device-stt-mic");
  const input = page.locator("textarea").first();
  if ((await input.count()) > 0) {
    await input.fill("Reply briefly: on-device TTS proof.");
    const send = page.getByRole("button", { name: RE_SEND }).first();
    if ((await send.count()) > 0) {
      await send.click();
      await wait(page, MS_EIGHT_SECONDS);
    }
  }
  const testTts = page.getByTestId("on-device-tts-test");
  if ((await testTts.count()) === 0) {
    findings.push("on-device TTS test-speaker control missing");
  } else {
    await testTts.click();
    await wait(page, MS_ONE_TWO_HUNDRED);
  }
  await shot(page, "03-on-device-tts");
};

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
    recordVideo: { dir: join(OUT, "raw"), size: DESKTOP_VIEWPORT },
    viewport: DESKTOP_VIEWPORT,
  });
  const page = await context.newPage();
  await installOnDeviceSpeechHooks(page);
  await configureBrowserProviders(page, findings);
  await exerciseMicAndTts(page, findings);
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
    `on-device-speech: ok=${String(report.ok)} sttStarts=${String(hooks.recognitionStarts)} ttsSpeaks=${String(hooks.synthesisSpeaks)} recognitionBridge=${String(hooks.usedRecognitionPolyfill)}`,
  );
  await reportFindingsAndExit(findings);
};

const run = await settle(main());
if (run.status === "rejected") {
  await writeError(run.reason.message);
  process.exit(1);
}
