/**
 * Headed product demo video — real local AI + Whisper STT, mock interview,
 * stylized resume / portfolio / cover-letter generation.
 *
 * Requires:
 * - Live OpenAI-compatible LLM at LOCAL_MODEL_ENDPOINT (default :11434/v1)
 * - Live Whisper STT at WHISPER_ENDPOINT (default http://127.0.0.1:8090/v1)
 * Refuses mocks / deterministic stub providers.
 *
 * Proof: headed Chromium on DISPLAY + ffmpeg x11grab (not Playwright recordVideo —
 * in-process VP8 encoding starves local llama.cpp during long AI calls).
 */
import { mkdir, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { API_ENDPOINTS } from "../packages/shared/src/constants/endpoints";
import { APP_ROUTE_BUILDERS, APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import { writeError, writeOutput } from "./utils/cli-output";
import { assertLiveInference } from "./utils/live-ai-probe";

const RESUME_FROM_QUESTIONS_GENERATE_PATH = API_ENDPOINTS.resumeFromQuestionsGenerate;

const DEMO_LOCATOR_RE_0 = /Generate Questions/i;
const DEMO_LOCATOR_RE_1 = /Question\s+\d+\s+of\s+\d+/i;
const DEMO_LOCATOR_RE_2 = /synthesize|generate resume|build resume|finish/i;
const DEMO_LOCATOR_RE_3 = /^Next$/i;
const DEMO_LOCATOR_RE_4 = /^Edit$/i;
const DEMO_LOCATOR_RE_5 = /Export/i;
const DEMO_LOCATOR_RE_6 = /PDF/i;
const DEMO_LOCATOR_RE_7 = /Add Project|Add Mapping|Add/i;
const DEMO_LOCATOR_RE_8 = /title/i;
const DEMO_LOCATOR_RE_9 = /description|bio/i;
const DEMO_LOCATOR_RE_10 = /technolog/i;
const DEMO_LOCATOR_RE_11 = /add technology|add/i;
const DEMO_LOCATOR_RE_12 = /Save|Create|Add Project/i;
const DEMO_LOCATOR_RE_13 = /Generate Cover Letter|Generate/i;
const DEMO_LOCATOR_RE_14 = /company/i;
const DEMO_LOCATOR_RE_15 = /position|role/i;
const DEMO_LOCATOR_RE_16 = /job description|description/i;
const DEMO_LOCATOR_RE_17 = /Generate|Create|Submit/i;
const DEMO_LOCATOR_RE_18 = /send|submit/i;
const DEMO_LOCATOR_RE_19 = /Studio Drill|Start Studio/i;
const DEMO_LOCATOR_RE_20 = /Open studio selector/i;
const DEMO_LOCATOR_RE_21 = /Riot Games/i;
const DEMO_LOCATOR_RE_22 = /voice|microphone|enable voice/i;
const DEMO_LOCATOR_RE_23 = /Start interview session/i;
const DEMO_LOCATOR_RE_24 = /Start listening|Start voice|Listen/i;
const DEMO_LOCATOR_RE_25 = /start listening|start voice|listen/i;
const DEMO_LOCATOR_RE_26 = /Stop listening|Stop voice|Stop/i;
const DEMO_LOCATOR_RE_27 = /Submit|Send Response|Continue/i;
const TRAILING_SLASH_PATTERN = /\/$/u;
const INPUT_NAME_TITLE_SELECTOR = `input[name*="${"title"}" i]`;
const INPUT_PLACEHOLDER_TECH_SELECTOR = `input[placeholder*="${"tech"}" i]`;

const DEMO_VIEWPORT = { width: 1440, height: 900 } as const;
const DEMO_CAPTURE_FPS = 12;

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  TRAILING_SLASH_PATTERN,
  "",
);
const OUT =
  process.env.PRODUCT_DEMO_OUT ?? join("/opt/cursor/artifacts/baseline/product-demo-video");
const LOCAL_ENDPOINT = (
  process.env.LOCAL_MODEL_ENDPOINT ??
  process.env.PRODUCT_DEMO_LOCAL_ENDPOINT ??
  "http://127.0.0.1:11434/v1"
).replace(TRAILING_SLASH_PATTERN, "");
const WHISPER_ENDPOINT = (
  process.env.WHISPER_ENDPOINT ??
  process.env.PRODUCT_DEMO_WHISPER_ENDPOINT ??
  "http://127.0.0.1:8090/v1"
).replace(TRAILING_SLASH_PATTERN, "");
const FAKE_AUDIO_WAV =
  process.env.PRODUCT_DEMO_FAKE_AUDIO ??
  join(OUT, "fixtures", "interview-answer.wav");
const SERVER_BASE = (process.env.PAGE_PROOF_SERVER_BASE ?? "http://127.0.0.1:3000").replace(TRAILING_SLASH_PATTERN, "");

const wait = async (page: Page, ms: number): Promise<void> => {
  await page.waitForTimeout(ms);
};

const waitWhile = async (
  predicate: () => Promise<boolean>,
  options: { readonly attempts: number; readonly delayMs: number; readonly page: Page },
): Promise<void> => {
  let attempt = 0;
  while (attempt < options.attempts && (await predicate())) {
    await wait(options.page, options.delayMs);
    attempt += 1;
  }
};


const shot = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({ path: join(OUT, "stills", `${name}.png`), fullPage: false });
};

type LiveWhisperProbe = {
  endpoint: string;
  text: string;
};

const assertLiveWhisper = async (): Promise<LiveWhisperProbe> => {
  const wavPath = FAKE_AUDIO_WAV;
  const wavFile = Bun.file(wavPath);
  if (!(await wavFile.exists())) {
    throw new Error(`Whisper fixture missing: ${wavPath}`);
  }
  const form = new FormData();
  form.append("file", new File([await wavFile.arrayBuffer()], "interview-answer.wav", { type: "audio/wav" }));
  form.append("model", "whisper-tiny");
  const response = await fetch(`${WHISPER_ENDPOINT}/audio/transcriptions`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) {
    throw new Error(`Live Whisper probe failed: ${String(response.status)}`);
  }
  const json = (await response.json()) as { text?: string };
  const text = json.text?.trim() ?? "";
  if (text.length < 8) {
    throw new Error("Live Whisper probe failed: empty transcript");
  }
  await writeOutput(`live Whisper ok endpoint=${WHISPER_ENDPOINT} text=${text.slice(0, 120)}`);
  return { endpoint: WHISPER_ENDPOINT, text };
};

const seedSpeechAndAiSettings = async (modelId: string): Promise<void> => {
  const settingsResponse = await fetch(`${SERVER_BASE}/api/settings`);
  const settings = (await settingsResponse.json()) as {
    automationSettings?: {
      speech?: {
        locale?: string;
        stt?: { provider?: string; model?: string; endpoint?: string };
        tts?: Record<string, unknown>;
      };
    };
  };
  const speech = settings.automationSettings?.speech ?? {};
  await fetch(`${SERVER_BASE}/api/settings/api-keys`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      localModelEndpoint: LOCAL_ENDPOINT,
      localModelName: modelId,
    }),
  });
  await fetch(`${SERVER_BASE}/api/settings`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      preferredProvider: "local",
      preferredModel: modelId,
      automationSettings: {
        speech: {
          locale: speech.locale ?? "en-US",
          stt: {
            provider: "local",
            model: "whisper-tiny",
            endpoint: WHISPER_ENDPOINT,
          },
          tts: speech.tts ?? {
            provider: "browser",
            model: "browser-default",
            endpoint: "",
            voice: "default",
            format: "mp3",
          },
        },
      },
    }),
  });
  await writeOutput("seeded speech STT=local/whisper-tiny + local AI");
};

const demoResumeGuidedBuild = async (page: Page): Promise<boolean> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resumeBuild}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 1_800);
  await shot(page, "02-resume-build-target");

  await page.getByLabel("Target role", { exact: true }).fill("Gameplay Programmer");
  const experience = page.getByLabel("Experience level", { exact: true });
  if ((await experience.count()) > 0) {
    await settle(experience.selectOption("Mid"));
  }
  const studio = page.getByLabel("Studio selection", { exact: true });
  if ((await studio.count()) > 0) {
    await settle(studio.selectOption("epic-games"));
  }

  const generate = page.locator("button", { hasText: DEMO_LOCATOR_RE_0 }).first();
  await generate.waitFor({ state: "visible", timeout: 10_000 });
  await waitWhile(() => generate.isDisabled(), { attempts: 20, delayMs: 250, page });

  const answerBox = page.locator("textarea:visible").first();
  let sawGenerateRequest = false;
  const onGenerateRequest = (request: { url: () => string; method: () => string }): void => {
    if (
      request.url().includes(RESUME_FROM_QUESTIONS_GENERATE_PATH) &&
      request.method() === "POST"
    ) {
      sawGenerateRequest = true;
    }
  };
  page.on("request", onGenerateRequest);
  const generateStarted = Date.now();
  const generateResponse = page.waitForResponse(
    (response) =>
      response.url().includes(RESUME_FROM_QUESTIONS_GENERATE_PATH) &&
      response.request().method() === "POST",
    { timeout: 300_000 },
  );
  await generate.click({ timeout: 10_000 });
  await writeOutput("clicked Generate Questions; waiting for AI question UI");
  const generateResult = await settle(generateResponse);
  page.off("request", onGenerateRequest);
  if (generateResult.status === "rejected") {
    await shot(page, "03-resume-questions-timeout");
    throw new Error(
      sawGenerateRequest
        ? "Resume guided build: generate request never completed."
        : "Resume guided build: generate request never fired.",
    );
  }
  await writeOutput(
    `resume generate HTTP ${String(generateResult.value.status())} in ${String(Date.now() - generateStarted)}ms`,
  );
  await page
    .getByText(DEMO_LOCATOR_RE_1)
    .first()
    .waitFor({ state: "visible", timeout: 30_000 });
  await answerBox.waitFor({ state: "visible", timeout: 15_000 });
  await shot(page, "03-resume-questions");

  let step = 0;
  while (step < 10) {
    const visibleAnswer = page.locator("textarea:visible").first();
    const answerCount = await visibleAnswer.count();
    if (answerCount === 0) {
      break;
    }
    await visibleAnswer.fill(
      `Alex Rivera, Gameplay Programmer — shipped combat pacing on a live co-op title (Unreal + TypeScript). Answer ${String(step + 1)}.`,
    );
    await wait(page, 400);

    const synthesize = page
      .locator("button", { hasText: DEMO_LOCATOR_RE_2 })
      .filter({ hasNot: page.locator("[disabled]") })
      .first();
    const synthesizeCount = await synthesize.count();
    const synthesizeDisabled = synthesizeCount > 0 ? await synthesize.isDisabled() : true;
    if (synthesizeCount > 0 && !synthesizeDisabled) {
      await synthesize.click({ timeout: 10_000 });
      break;
    }

    const next = page.locator("button", { hasText: DEMO_LOCATOR_RE_3 }).first();
    const nextCount = await next.count();
    if (nextCount === 0) {
      break;
    }
    await waitWhile(() => next.isDisabled(), { attempts: 20, delayMs: 200, page });
    const nextDisabled = await next.isDisabled();
    if (nextDisabled) {
      break;
    }
    await next.click();
    await wait(page, 600);
    step += 1;
  }

  // Wait for synthesis / completion UI
  await wait(page, 15_000);
  const lateSynth = page
    .locator("button", { hasText: DEMO_LOCATOR_RE_2 })
    .first();
  if ((await lateSynth.count()) > 0 && !(await lateSynth.isDisabled())) {
    await settle(lateSynth.click({ timeout: 10_000 }));
    await wait(page, 15_000);
  }
  await shot(page, "04-resume-synthesized");

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resumePreview}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 2_000);
  await shot(page, "05-resume-preview-styled");

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resume}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 1_800);
  const edit = page.getByRole("button", { name: DEMO_LOCATOR_RE_4 }).first();
  if ((await edit.count()) > 0) {
    await edit.click();
    await wait(page, 1_200);
  }
  const exportBtn = page.getByRole("button", { name: DEMO_LOCATOR_RE_5 }).first();
  if ((await exportBtn.count()) > 0) {
    await exportBtn.click();
    await wait(page, 400);
    const downloadPromise = page.waitForEvent("download", { timeout: 45_000 });
    await page
      .getByRole("menuitem", { name: DEMO_LOCATOR_RE_6 })
      .or(page.getByRole("button", { name: DEMO_LOCATOR_RE_6 }))
      .first()
      .click();
    const downloadResult = await settle(downloadPromise);
    if (downloadResult.status === "fulfilled") {
      const path = join(OUT, "downloads", "demo-resume.pdf");
      await downloadResult.value.saveAs(path);
      await writeOutput(`resume PDF saved ${path}`);
    }
  }
  await shot(page, "06-resume-exported");
  return true;
};

const demoPortfolio = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.portfolio}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 1_800);
  await shot(page, "07-portfolio-empty-or-list");

  const add = page.getByRole("button", { name: DEMO_LOCATOR_RE_7 }).first();
  await settle(add.click({ timeout: 8_000 }));
  await wait(page, 1_000);

  const title = page.getByLabel(DEMO_LOCATOR_RE_8).or(page.locator(INPUT_NAME_TITLE_SELECTOR)).first();
  await settle(title.fill("Combat Sandbox Prototype"));
  const description = page
    .getByLabel(DEMO_LOCATOR_RE_9)
    .or(page.locator("textarea"))
    .first();
  await settle(
    description.fill(
      "Encounter pacing lab for co-op readability — Unreal + TypeScript tooling, featured on portfolio.",
    ),
  );
  const tech = page
    .getByLabel(DEMO_LOCATOR_RE_10)
    .or(page.locator(INPUT_PLACEHOLDER_TECH_SELECTOR))
    .first();
  if ((await tech.count()) > 0) {
    await settle(tech.fill("Unreal Engine"));
    const addTech = page.getByRole("button", { name: DEMO_LOCATOR_RE_11 }).first();
    await settle(addTech.click());
  }

  const save = page.getByRole("button", { name: DEMO_LOCATOR_RE_12 }).last();
  await settle(save.click({ timeout: 8_000 }));
  await wait(page, 2_500);
  await shot(page, "08-portfolio-project-added");

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.portfolioPreview}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 2_000);
  await shot(page, "09-portfolio-preview-styled");
};

const demoCoverLetter = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.coverLetter}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 1_800);
  await shot(page, "10-cover-letter-hub");

  const generate = page.locator("button", { hasText: DEMO_LOCATOR_RE_13 }).first();
  await generate.click({ timeout: 10_000 });
  await wait(page, 1_200);

  await page.getByLabel(DEMO_LOCATOR_RE_14).first().fill("Hitmarker Studios");
  await page.getByLabel(DEMO_LOCATOR_RE_15).first().fill("Gameplay Programmer");
  const jobDesc = page.getByLabel(DEMO_LOCATOR_RE_16).first();
  if ((await jobDesc.count()) > 0) {
    await jobDesc.fill(
      "Looking for a gameplay programmer to own combat systems, work with design, and ship live updates.",
    );
  }

  const submit = page.locator("button", { hasText: DEMO_LOCATOR_RE_17 }).last();
  await submit.click({ timeout: 10_000 });
  await wait(page, 45_000);
  await shot(page, "11-cover-letter-generated");

  const card = page.locator("main a.card, main .card a, main a[href*='cover-letter']").first();
  if ((await card.count()) > 0) {
    await card.click();
    await wait(page, 2_000);
    await shot(page, "12-cover-letter-detail-styled");
  }
};

const demoAiChat = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.aiChat}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 2_000);
  await shot(page, "13-ai-chat");

  const input = page.locator("main textarea").first();
  await input.fill(
    "Help me prepare a 60-second pitch for a gameplay programmer role focused on combat systems.",
  );
  const send = page.locator("button", { hasText: DEMO_LOCATOR_RE_18 }).first();
  await send.click({ timeout: 8_000 });
  await wait(page, 45_000);
  await shot(page, "14-ai-chat-response");
};

const demoInterview = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.interview}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 2_000);
  await shot(page, "15-interview-hub");

  const studio = page.locator("button", { hasText: DEMO_LOCATOR_RE_19 }).first();
  await studio.click({ timeout: 10_000 });
  await wait(page, 1_500);
  await shot(page, "16-interview-config");

  // StudioSelector is a custom combobox (not a native <select>).
  const studioToggle = page.getByRole("button", { name: DEMO_LOCATOR_RE_20 }).first();
  await studioToggle.waitFor({ state: "visible", timeout: 10_000 });
  await studioToggle.click({ timeout: 8_000 });
  const studioOption = page
    .getByRole("option", { name: DEMO_LOCATOR_RE_21 })
    .or(page.getByRole("option").nth(1))
    .first();
  await studioOption.waitFor({ state: "visible", timeout: 10_000 });
  await studioOption.click({ timeout: 8_000 });
  await wait(page, 800);

  // Enable voice mode when the config checkbox exists.
  const voiceToggle = page.getByLabel(DEMO_LOCATOR_RE_22).first();
  if ((await voiceToggle.count()) > 0) {
    await settle(voiceToggle.check({ force: true }));
  }

  const start = page.getByRole("button", { name: DEMO_LOCATOR_RE_23 }).first();
  await start.waitFor({ state: "visible", timeout: 10_000 });
  await waitWhile(() => start.isDisabled(), { attempts: 40, delayMs: 250, page });
  if (await start.isDisabled()) {
    throw new Error("Interview start stayed disabled after studio selection.");
  }
  await start.click({ timeout: 12_000 });
  await page.locator("textarea:visible").first().waitFor({ state: "visible", timeout: 90_000 });
  await shot(page, "17-interview-session");

  // Whisper STT via fake mic capture → MediaRecorder → /api/speech/transcribe.
  const micStart = page
    .locator("button", { hasText: DEMO_LOCATOR_RE_24 })
    .or(page.getByRole("button", { name: DEMO_LOCATOR_RE_25 }))
    .first();
  if ((await micStart.count()) > 0) {
    await micStart.click({ timeout: 8_000 });
    await wait(page, 6_500);
    const micStop = page
      .locator("button", { hasText: DEMO_LOCATOR_RE_26 })
      .first();
    if ((await micStop.count()) > 0) {
      await micStop.click({ timeout: 8_000 });
      await wait(page, 12_000);
    }
    await shot(page, "17b-interview-whisper-stt");
  }

  const response = page.locator("textarea:visible").first();
  const current = (await response.inputValue()).trim();
  if (current.length < 12) {
    await response.fill(
      "In my last role I owned encounter pacing for a co-op combat sandbox. I partnered with design to define readability goals, shipped iteration tooling that cut balance cycles by half, and validated changes with playtests before live deploy.",
    );
  }
  const submit = page
    .locator("button", { hasText: DEMO_LOCATOR_RE_27 })
    .first();
  await submit.click({ timeout: 8_000 });
  await wait(page, 45_000);
  await shot(page, "18-interview-feedback");
};

type DisplayRecorder = {
  stop: () => Promise<{ mp4Path: string | null; webmPath: string | null }>;
};

const startDisplayRecorder = async (): Promise<DisplayRecorder> => {
  const display = process.env.DISPLAY ?? ":1";
  const mp4Path = join(OUT, "bao-product-demo.mp4");
  const webmPath = join(OUT, "bao-product-demo.webm");
  const rawPath = join(OUT, "raw-segments", "display-capture.mp4");

  // Low FPS + ultrafast x264 keeps CPU free for llama.cpp during AI steps.
  const proc = Bun.spawn(
    [
      "ffmpeg",
      "-y",
      "-loglevel",
      "error",
      "-f",
      "x11grab",
      "-video_size",
      `${String(DEMO_VIEWPORT.width)}x${String(DEMO_VIEWPORT.height)}`,
      "-framerate",
      String(DEMO_CAPTURE_FPS),
      "-i",
      `${display}.0+0,0`,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      "28",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      rawPath,
    ],
    { stdout: "ignore", stderr: "pipe" },
  );
  await writeOutput(
    `x11grab started display=${display} ${String(DEMO_VIEWPORT.width)}x${String(DEMO_VIEWPORT.height)}@${String(DEMO_CAPTURE_FPS)}`,
  );

  return {
    stop: async () => {
      if (proc.exitCode === null) {
        proc.kill("SIGINT");
      }
      const code = await proc.exited;
      if (code !== 0 && code !== 255) {
        const err = await new Response(proc.stderr).text();
        await writeError(`x11grab failed (${String(code)}): ${err.slice(0, 400)}`);
        return { mp4Path: null, webmPath: null };
      }
      const rawFile = Bun.file(rawPath);
      const rawExists = await rawFile.exists();
      if (!rawExists || rawFile.size < 50_000) {
        await writeError("x11grab produced missing/small capture");
        return { mp4Path: null, webmPath: null };
      }
      await Bun.write(mp4Path, Bun.file(rawPath));

      // WebM re-encode is optional (libvpx is slow); MP4 is the primary deliverable.
      if (process.env.PRODUCT_DEMO_WEBM !== "1") {
        await writeOutput("skipping webm encode (set PRODUCT_DEMO_WEBM=1 to enable)");
        return { mp4Path, webmPath: null };
      }
      const webmProc = Bun.spawn(
        [
          "ffmpeg",
          "-y",
          "-loglevel",
          "error",
          "-i",
          mp4Path,
          "-c:v",
          "libvpx",
          "-b:v",
          "1M",
          "-an",
          webmPath,
        ],
        { stdout: "ignore", stderr: "pipe" },
      );
      const webmCode = await webmProc.exited;
      if (webmCode !== 0) {
        const err = await new Response(webmProc.stderr).text();
        await writeError(`webm encode failed: ${err.slice(0, 240)}`);
        return { mp4Path, webmPath: null };
      }
      return { mp4Path, webmPath };
    },
  };
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  await mkdir(join(OUT, "downloads"), { recursive: true });
  await mkdir(join(OUT, "raw-segments"), { recursive: true });

  const live = await assertLiveInference({ endpoint: LOCAL_ENDPOINT });
  const whisper = await assertLiveWhisper();
  await seedSpeechAndAiSettings(live.modelId);

  const recorder = await startDisplayRecorder();

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
      consoleErrors.push(message.text().slice(0, 240));
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(`PAGE:${error.message.slice(0, 240)}`);
  });

  let tourError: string | null = null;
  const tourSettled = await settle(
    (async () => {
    await page.goto(`${CLIENT_BASE}${APP_ROUTES.dashboard}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await wait(page, 2_000);
    await shot(page, "00-dashboard");

    // Settings already seeded via API (LLM + Whisper). Visit UI for visual proof only —
    // avoid Save/Test actions that flood /v1/models while resume generation needs the GPU/CPU.
    await page.goto(`${CLIENT_BASE}${APP_ROUTE_BUILDERS.settingsSection("aiProviders")}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await wait(page, 2_000);
    await shot(page, "01-ai-providers-configured");
    await writeOutput(
      `settings shown; live LLM=${live.modelId} whisper=${whisper.endpoint}`,
    );
    await demoResumeGuidedBuild(page);
    await demoPortfolio(page);
    await demoCoverLetter(page);
    await demoAiChat(page);
    await demoInterview(page);

    await page.goto(`${CLIENT_BASE}${APP_ROUTES.dashboard}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await wait(page, 2_000);
    await shot(page, "19-dashboard-complete");
    })(),
  );
  if (tourSettled.status === "rejected") {
    tourError = tourSettled.reason.message;
    await writeError(`product demo tour failed: ${tourError}`);
    await settle(shot(page, "99-tour-failed"));
  }

  await context.close();
  await browser.close();
  const { mp4Path, webmPath } = await recorder.stop();

  const stillCount = (await readdir(join(OUT, "stills"))).filter((name) =>
    name.endsWith(".png"),
  ).length;
  const webmBytes = webmPath ? (await stat(webmPath)).size : 0;
  const mp4Bytes = mp4Path ? (await stat(mp4Path)).size : 0;

  const report = {
    CLIENT_BASE,
    liveEndpoint: live.endpoint,
    liveModelId: live.modelId,
    liveSample: live.sample.slice(0, 240),
    whisperEndpoint: whisper.endpoint,
    whisperSample: whisper.text.slice(0, 240),
    mockUsed: false,
    capture: "ffmpeg-x11grab",
    tourError,
    stillCount,
    webmPath,
    webmBytes,
    mp4Path,
    mp4Bytes,
    consoleErrorCount: consoleErrors.length,
    consoleErrors: consoleErrors.slice(0, 30),
    display: process.env.DISPLAY ?? null,
  };
  await Bun.write(join(OUT, "demo-report.json"), JSON.stringify(report, null, 2));
  await writeOutput(
    `browser-record-product-demo: stills=${String(stillCount)} webm=${webmPath ?? "none"} (${String(webmBytes)}) mp4=${mp4Path ?? "none"} (${String(mp4Bytes)}) errors=${String(consoleErrors.length)} live=${live.modelId} tourError=${tourError ?? "none"}`,
  );

  if ((!mp4Path || mp4Bytes < 50_000) && (!webmPath || webmBytes < 50_000)) {
    await writeError("Product demo incomplete (missing/small video).");
    process.exitCode = 1;
  } else if (tourError) {
    await writeError("Product demo incomplete (tour error).");
    process.exitCode = 1;
  }
};

await main();
