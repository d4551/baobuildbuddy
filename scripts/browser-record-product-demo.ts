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
import { chromium, type Locator, type Page } from "playwright";
import { APP_ROUTE_BUILDERS, APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import { writeError, writeOutput } from "./utils/cli-output";

const DEMO_VIEWPORT = { width: 1440, height: 900 } as const;
const DEMO_CAPTURE_FPS = 12;
const TRAILING_SLASH_RE = /\/$/u;
const RE_BAO_DEMO_DETERMINISTIC = /bao-demo-deterministic/i;
const RE_BUILD_DETERMINISTIC_CONTENT = /buildDeterministicContent/i;
const RE_DETERMINISTIC_AI = /DETERMINISTIC_AI/i;
const RE_GENERATE_QUESTIONS = /Generate Questions/i;
const RE_QUESTION_PROGRESS = /Question\s+\d+\s+of\s+\d+/i;
const RE_SYNTHESIZE_RESUME = /synthesize|generate resume|build resume|finish/i;
const RE_NEXT = /^Next$/i;
const RE_EDIT = /^Edit$/i;
const RE_EXPORT = /Export/i;
const RE_PDF = /PDF/i;
const RE_ADD_PROJECT = /Add Project|Add Mapping|Add/i;
const RE_TITLE = /title/i;
const RE_DESCRIPTION_BIO = /description|bio/i;
const RE_TECHNOLOGY = /technolog/i;
const RE_ADD_TECHNOLOGY = /add technology|add/i;
const RE_SAVE_CREATE_PROJECT = /Save|Create|Add Project/i;
const RE_GENERATE_COVER_LETTER = /Generate Cover Letter|Generate/i;
const RE_COMPANY = /company/i;
const RE_POSITION_ROLE = /position|role/i;
const RE_JOB_DESCRIPTION = /job description|description/i;
const RE_GENERATE_CREATE_SUBMIT = /Generate|Create|Submit/i;
const RE_SEND_SUBMIT = /send|submit/i;
const RE_STUDIO_DRILL = /Studio Drill|Start Studio/i;
const RE_OPEN_STUDIO_SELECTOR = /Open studio selector/i;
const RE_RIOT_GAMES = /Riot Games/i;
const RE_VOICE_MODE = /voice|microphone|enable voice/i;
const RE_START_INTERVIEW_SESSION = /Start interview session/i;
const RE_START_LISTENING = /Start listening|Start voice|Listen/i;
const RE_START_LISTENING_ROLE = /start listening|start voice|listen/i;
const RE_STOP_LISTENING = /Stop listening|Stop voice|Stop/i;
const RE_SUBMIT_RESPONSE = /Submit|Send Response|Continue/i;

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  TRAILING_SLASH_RE,
  "",
);
const OUT =
  process.env.PRODUCT_DEMO_OUT ?? join("/opt/cursor/artifacts/baseline/product-demo-video");
const LOCAL_ENDPOINT = (
  process.env.LOCAL_MODEL_ENDPOINT ??
  process.env.PRODUCT_DEMO_LOCAL_ENDPOINT ??
  "http://127.0.0.1:11434/v1"
).replace(TRAILING_SLASH_RE, "");
const WHISPER_ENDPOINT = (
  process.env.WHISPER_ENDPOINT ??
  process.env.PRODUCT_DEMO_WHISPER_ENDPOINT ??
  "http://127.0.0.1:8090/v1"
).replace(TRAILING_SLASH_RE, "");
const FAKE_AUDIO_WAV =
  process.env.PRODUCT_DEMO_FAKE_AUDIO ??
  join(OUT, "fixtures", "interview-answer.wav");
const SERVER_BASE = (process.env.PAGE_PROOF_SERVER_BASE ?? "http://127.0.0.1:3000").replace(
  TRAILING_SLASH_RE,
  "",
);

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

const waitForEnabled = async (
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

const shot = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({ path: join(OUT, "stills", `${name}.png`), fullPage: false });
};

type LiveModelProbe = {
  endpoint: string;
  modelId: string;
  sample: string;
};

const assertLiveInference = async (): Promise<LiveModelProbe> => {
  const modelsUrl = `${LOCAL_ENDPOINT}/models`;
  const modelsResponse = await fetch(modelsUrl, { signal: AbortSignal.timeout(10_000) });
  if (!modelsResponse.ok) {
    throw new Error(`Live AI probe failed: GET ${modelsUrl} → ${String(modelsResponse.status)}`);
  }
  const modelsJson = (await modelsResponse.json()) as {
    data?: Array<{ id?: string }>;
  };
  const modelId =
    process.env.LOCAL_MODEL_NAME?.trim() ||
    process.env.PRODUCT_DEMO_MODEL?.trim() ||
    modelsJson.data?.find((entry) => typeof entry.id === "string" && entry.id.length > 0)?.id;
  if (!modelId) {
    throw new Error(`Live AI probe failed: no model id at ${modelsUrl}`);
  }

  const nonce = `BAO_LIVE_${Date.now().toString(36)}`;
  const chatResponse = await fetch(`${LOCAL_ENDPOINT}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal: AbortSignal.timeout(120_000),
    body: JSON.stringify({
      model: modelId,
      temperature: 0.2,
      max_tokens: 48,
      messages: [
        {
          role: "user",
          content: `Reply with one short sentence that includes the token ${nonce}.`,
        },
      ],
    }),
  });
  if (!chatResponse.ok) {
    const body = await chatResponse.text();
    throw new Error(
      `Live AI probe failed: chat/completions → ${String(chatResponse.status)} ${body.slice(0, 240)}`,
    );
  }
  const chatJson = (await chatResponse.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const sample = chatJson.choices?.[0]?.message?.content?.trim() ?? "";
  if (sample.length < 3) {
    throw new Error("Live AI probe failed: empty completion (refusing mock/empty provider).");
  }
  // Deterministic stub historically echoed canned resume/cover text — reject known markers.
  const banned = [
    RE_BAO_DEMO_DETERMINISTIC,
    RE_BUILD_DETERMINISTIC_CONTENT,
    RE_DETERMINISTIC_AI,
  ];
  if (banned.some((pattern) => pattern.test(sample))) {
    throw new Error("Live AI probe failed: response looks like a mock/deterministic stub.");
  }
  await writeOutput(`live AI ok endpoint=${LOCAL_ENDPOINT} model=${modelId} sample=${sample.slice(0, 120)}`);
  return { endpoint: LOCAL_ENDPOINT, modelId, sample };
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

const completeResumeQuestionSteps = async (page: Page, step = 0): Promise<void> => {
  if (step >= 10) {
    return;
  }

  const visibleAnswer = page.locator("textarea:visible").first();
  if ((await visibleAnswer.count()) === 0) {
    return;
  }
  await visibleAnswer.fill(
    `Alex Rivera, Gameplay Programmer — shipped combat pacing on a live co-op title (Unreal + TypeScript). Answer ${String(step + 1)}.`,
  );
  await wait(page, 400);

  const synthesize = page
    .locator("button", { hasText: RE_SYNTHESIZE_RESUME })
    .filter({ hasNot: page.locator("[disabled]") })
    .first();
  if ((await synthesize.count()) > 0 && !(await synthesize.isDisabled())) {
    await synthesize.click({ timeout: 10_000 });
    return;
  }

  const next = page.locator("button", { hasText: RE_NEXT }).first();
  if ((await next.count()) === 0) {
    return;
  }
  await waitForEnabled(page, next, 20, 200);
  if (await next.isDisabled()) {
    return;
  }
  await next.click();
  await wait(page, 600);
  return completeResumeQuestionSteps(page, step + 1);
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

  const generate = page.locator("button", { hasText: RE_GENERATE_QUESTIONS }).first();
  await generate.waitFor({ state: "visible", timeout: 10_000 });
  await waitForEnabled(page, generate, 20, 250);

  const answerBox = page.locator("textarea:visible").first();
  let sawGenerateRequest = false;
  const onGenerateRequest = (request: { url: () => string; method: () => string }): void => {
    if (
      request.url().includes("/resumes/from-questions/generate") &&
      request.method() === "POST"
    ) {
      sawGenerateRequest = true;
    }
  };
  page.on("request", onGenerateRequest);
  const generateStarted = Date.now();
  const generateResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/resumes/from-questions/generate") &&
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
    .getByText(RE_QUESTION_PROGRESS)
    .first()
    .waitFor({ state: "visible", timeout: 30_000 });
  await answerBox.waitFor({ state: "visible", timeout: 15_000 });
  await shot(page, "03-resume-questions");

  await completeResumeQuestionSteps(page);

  // Wait for synthesis / completion UI
  await wait(page, 15_000);
  const lateSynth = page
    .locator("button", { hasText: RE_SYNTHESIZE_RESUME })
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
  const edit = page.getByRole("button", { name: RE_EDIT }).first();
  if ((await edit.count()) > 0) {
    await edit.click();
    await wait(page, 1_200);
  }
  const exportBtn = page.getByRole("button", { name: RE_EXPORT }).first();
  if ((await exportBtn.count()) > 0) {
    await exportBtn.click();
    await wait(page, 400);
    const downloadPromise = page.waitForEvent("download", { timeout: 45_000 });
    await page
      .getByRole("menuitem", { name: RE_PDF })
      .or(page.getByRole("button", { name: RE_PDF }))
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

  const add = page.getByRole("button", { name: RE_ADD_PROJECT }).first();
  await settle(add.click({ timeout: 8_000 }));
  await wait(page, 1_000);

  const title = page.getByLabel(RE_TITLE).or(page.locator('input[name*="title" i]')).first();
  await settle(title.fill("Combat Sandbox Prototype"));
  const description = page
    .getByLabel(RE_DESCRIPTION_BIO)
    .or(page.locator("textarea"))
    .first();
  await settle(
    description.fill(
      "Encounter pacing lab for co-op readability — Unreal + TypeScript tooling, featured on portfolio.",
    ),
  );
  const tech = page.getByLabel(RE_TECHNOLOGY).or(page.locator('input[placeholder*="tech" i]')).first();
  if ((await tech.count()) > 0) {
    await settle(tech.fill("Unreal Engine"));
    const addTech = page.getByRole("button", { name: RE_ADD_TECHNOLOGY }).first();
    await settle(addTech.click());
  }

  const save = page.getByRole("button", { name: RE_SAVE_CREATE_PROJECT }).last();
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

  const generate = page.locator("button", { hasText: RE_GENERATE_COVER_LETTER }).first();
  await generate.click({ timeout: 10_000 });
  await wait(page, 1_200);

  await page.getByLabel(RE_COMPANY).first().fill("Hitmarker Studios");
  await page.getByLabel(RE_POSITION_ROLE).first().fill("Gameplay Programmer");
  const jobDesc = page.getByLabel(RE_JOB_DESCRIPTION).first();
  if ((await jobDesc.count()) > 0) {
    await jobDesc.fill(
      "Looking for a gameplay programmer to own combat systems, work with design, and ship live updates.",
    );
  }

  const submit = page.locator("button", { hasText: RE_GENERATE_CREATE_SUBMIT }).last();
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
  const send = page.locator("button", { hasText: RE_SEND_SUBMIT }).first();
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

  const studio = page.locator("button", { hasText: RE_STUDIO_DRILL }).first();
  await studio.click({ timeout: 10_000 });
  await wait(page, 1_500);
  await shot(page, "16-interview-config");

  // StudioSelector is a custom combobox (not a native <select>).
  const studioToggle = page.getByRole("button", { name: RE_OPEN_STUDIO_SELECTOR }).first();
  await studioToggle.waitFor({ state: "visible", timeout: 10_000 });
  await studioToggle.click({ timeout: 8_000 });
  const studioOption = page
    .getByRole("option", { name: RE_RIOT_GAMES })
    .or(page.getByRole("option").nth(1))
    .first();
  await studioOption.waitFor({ state: "visible", timeout: 10_000 });
  await studioOption.click({ timeout: 8_000 });
  await wait(page, 800);

  // Enable voice mode when the config checkbox exists.
  const voiceToggle = page.getByLabel(RE_VOICE_MODE).first();
  if ((await voiceToggle.count()) > 0) {
    await settle(voiceToggle.check());
  }

  const start = page.getByRole("button", { name: RE_START_INTERVIEW_SESSION }).first();
  await start.waitFor({ state: "visible", timeout: 10_000 });
  await waitForEnabled(page, start, 40, 250);
  if (await start.isDisabled()) {
    throw new Error("Interview start stayed disabled after studio selection.");
  }
  await start.click({ timeout: 12_000 });
  await page.locator("textarea:visible").first().waitFor({ state: "visible", timeout: 90_000 });
  await shot(page, "17-interview-session");

  // Whisper STT via fake mic capture → MediaRecorder → /api/speech/transcribe.
  const micStart = page
    .locator("button", { hasText: RE_START_LISTENING })
    .or(page.getByRole("button", { name: RE_START_LISTENING_ROLE }))
    .first();
  if ((await micStart.count()) > 0) {
    await micStart.click({ timeout: 8_000 });
    await wait(page, 6_500);
    const micStop = page
      .locator("button", { hasText: RE_STOP_LISTENING })
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
    .locator("button", { hasText: RE_SUBMIT_RESPONSE })
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
      try {
        proc.kill("SIGINT");
      } catch {
        // already exited
      }
      const code = await proc.exited;
      if (code !== 0 && code !== 255) {
        const err = await new Response(proc.stderr).text();
        await writeError(`x11grab failed (${String(code)}): ${err.slice(0, 400)}`);
        return { mp4Path: null, webmPath: null };
      }
      const rawExists = await Bun.file(rawPath).exists();
      if (!rawExists || (await Bun.file(rawPath).size) < 50_000) {
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

  const live = await assertLiveInference();
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
  try {
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
  } catch (error) {
    tourError = error instanceof Error ? error.message : String(error);
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
