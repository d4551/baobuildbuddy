/**
 * Shared helpers/constants for product demo recording modules.
 */
import { join } from "node:path";
import type { Locator, Page } from "playwright";
import {
  artifactDir,
  resolveProofClientBase,
  resolveProofEnv,
  resolveProofOutDir,
} from "./utils/proof-script-env";

export const DEMO_VIEWPORT = { width: 1440, height: 900 } as const;
export const DEMO_CAPTURE_FPS = 12;
export const TRAILING_SLASH_RE = /\/$/u;

export const RE_BAO_DEMO_DETERMINISTIC = /bao-demo-deterministic/i;
export const RE_BUILD_DETERMINISTIC_CONTENT = /buildDeterministicContent/i;
export const RE_DETERMINISTIC_AI = /DETERMINISTIC_AI/i;
export const RE_GENERATE_QUESTIONS = /Generate Questions/i;
export const RE_QUESTION_PROGRESS = /Question\s+\d+\s+of\s+\d+/i;
// The guided build labels its final step "Create Resume" (resumeBuildPage.questions.createResumeButton);
// without that alternative the last question falls through to the "Next" branch, which does not exist
// on the final step, and the run ends having never persisted a resume.
export const RE_SYNTHESIZE_RESUME = /synthesize|generate resume|build resume|create resume|finish/i;
export const RE_NEXT = /^Next$/i;
export const RE_EDIT = /^Edit$/i;
export const RE_EXPORT = /Export/i;
export const RE_PDF = /PDF/i;
export const RE_SEND_SUBMIT = /send|submit/i;
export const RE_STUDIO_DRILL = /Studio Drill|Start Studio/i;
export const RE_OPEN_STUDIO_SELECTOR = /Open studio selector/i;
export const RE_RIOT_GAMES = /Riot Games/i;
export const RE_VOICE_MODE = /voice|microphone|enable voice/i;
export const RE_START_INTERVIEW_SESSION = /Start interview session/i;
export const RE_SUBMIT_RESPONSE = /Submit|Send Response|Continue/i;

export const CLIENT_BASE = resolveProofClientBase("http://127.0.0.1:3001");
export const OUT = resolveProofOutDir(
  "PRODUCT_DEMO_OUT",
  artifactDir("baseline", "product-demo-video"),
);
export const LOCAL_ENDPOINT = (
  resolveProofEnv("LOCAL_MODEL_ENDPOINT") ??
  resolveProofEnv("PRODUCT_DEMO_LOCAL_ENDPOINT") ??
  "http://127.0.0.1:11434/v1"
).replace(TRAILING_SLASH_RE, "");
export const WHISPER_ENDPOINT = (
  resolveProofEnv("WHISPER_ENDPOINT") ??
  resolveProofEnv("PRODUCT_DEMO_WHISPER_ENDPOINT") ??
  "http://127.0.0.1:8090/v1"
).replace(TRAILING_SLASH_RE, "");
export const FAKE_AUDIO_WAV =
  resolveProofEnv("PRODUCT_DEMO_FAKE_AUDIO") ?? join(OUT, "fixtures", "interview-answer.wav");
export const SERVER_BASE = (
  resolveProofEnv("PAGE_PROOF_SERVER_BASE") ?? "http://127.0.0.1:3000"
).replace(TRAILING_SLASH_RE, "");

export type DemoRuntime = {
  readonly clientBase: string;
  readonly out: string;
  readonly localEndpoint: string;
  readonly whisperEndpoint: string;
  readonly serverBase: string;
  readonly fakeAudioWav: string;
};

export const wait = async (page: Page, ms: number): Promise<void> => {
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

export const waitForEnabled = async (
  page: Page,
  locator: Locator,
  attempts: number,
  pollMs: number,
): Promise<void> => {
  if (attempts <= 0 || !(await locator.isDisabled())) {
    return;
  }
  await wait(page, pollMs);
  return waitForEnabled(page, locator, attempts - 1, pollMs);
};

export const shot = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({ path: join(OUT, "stills", `${name}.png`), fullPage: false });
};

/**
 * Type into a field that may be either a native control or an `AppCodeEditor`.
 *
 * `AppProseField` renders a real `<textarea>` only as its SSR fallback; once
 * `ClientOnly` hydrates, the labelled element is the outer `.cm-editor` host —
 * a `role="textbox"` div that is not itself `[contenteditable]`, so Playwright's
 * `fill()` rejects it. The editable surface is the inner `.cm-content`.
 */
export const fillFieldOrEditor = async (
  page: Page,
  locator: Locator,
  value: string,
): Promise<void> => {
  const editor = locator.locator(".cm-content");
  if ((await editor.count()) === 0) {
    await locator.fill(value);
    return;
  }
  await editor.first().click();
  await page.keyboard.press("Control+a");
  await page.keyboard.type(value);
};
