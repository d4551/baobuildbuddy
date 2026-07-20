/**
 * Headed product demo video — real local AI + Whisper STT, mock interview,
 * stylized resume / portfolio / cover-letter generation.
 *
 * Requires:
 * - Live OpenAI-compatible LLM at LOCAL_MODEL_ENDPOINT (default :11434/v1)
 * - Live Whisper STT at WHISPER_ENDPOINT (default http://127.0.0.1:8090/v1)
 * Refuses mocks / deterministic stub providers.
 *
 * Proof: Playwright recordVideo (headed, DISPLAY, fake mic WAV) → WebM/MP4.
 */
import { mkdir, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { APP_ROUTE_BUILDERS, APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import { writeError, writeOutput } from "./utils/cli-output";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const OUT =
  process.env.PRODUCT_DEMO_OUT ?? join("/opt/cursor/artifacts/baseline/product-demo-video");
const LOCAL_ENDPOINT = (
  process.env.LOCAL_MODEL_ENDPOINT ??
  process.env.PRODUCT_DEMO_LOCAL_ENDPOINT ??
  "http://127.0.0.1:11434/v1"
).replace(/\/$/u, "");
const WHISPER_ENDPOINT = (
  process.env.WHISPER_ENDPOINT ??
  process.env.PRODUCT_DEMO_WHISPER_ENDPOINT ??
  "http://127.0.0.1:8090/v1"
).replace(/\/$/u, "");
const FAKE_AUDIO_WAV =
  process.env.PRODUCT_DEMO_FAKE_AUDIO ??
  join(OUT, "fixtures", "interview-answer.wav");
const SERVER_BASE = (process.env.PAGE_PROOF_SERVER_BASE ?? "http://127.0.0.1:3000").replace(
  /\/$/u,
  "",
);

const wait = async (page: Page, ms: number): Promise<void> => {
  await page.waitForTimeout(ms);
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
  const banned = [/bao-demo-deterministic/i, /buildDeterministicContent/i, /DETERMINISTIC_AI/i];
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
  // Warm resume questions so UI demo is not the cold path.
  await settle(
    fetch(`${SERVER_BASE}/api/resumes/from-questions/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetRole: "Gameplay Programmer",
        experienceLevel: "Mid",
        studioId: "epic-games",
      }),
      signal: AbortSignal.timeout(180_000),
    }),
  );
  await writeOutput("seeded speech STT=local/whisper-tiny + local AI + warmed resume questions");
};

const configureLocalAiViaUi = async (
  page: Page,
  endpoint: string,
  modelId: string,
): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTE_BUILDERS.settingsSection("aiProviders")}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 2_000);

  const localDetails = page
    .locator("details")
    .filter({ hasText: /Local Model/i })
    .first();
  await localDetails.waitFor({ state: "attached", timeout: 15_000 });
  const localOpen = await localDetails.evaluate((el) => (el as HTMLDetailsElement).open);
  if (!localOpen) {
    await localDetails.locator("summary").first().click();
    await wait(page, 600);
  }

  const endpointInput = page.getByLabel("Endpoint URL", { exact: true });
  await endpointInput.waitFor({ state: "visible", timeout: 15_000 });
  await endpointInput.fill(endpoint);

  const modelInput = page.getByLabel("Local model name", { exact: true });
  if ((await modelInput.count()) > 0) {
    await modelInput.fill(modelId);
  }

  const preferred = page
    .getByLabel(/preferred provider|Select provider for Chat|AI preferred/i)
    .first();
  if ((await preferred.count()) > 0) {
    await settle(preferred.selectOption("local"));
  }

  // Accessible name can omit visible label text; match on button text content.
  const saveKeys = page.locator("button", { hasText: /Save API Keys/i }).first();
  await saveKeys.click({ timeout: 12_000 });
  await wait(page, 2_000);

  const savePreferred = page.locator("button", { hasText: /Save chat default/i }).first();
  if ((await savePreferred.count()) > 0) {
    await settle(savePreferred.click({ timeout: 5_000 }));
    await wait(page, 1_000);
  }
  const saveRouting = page.locator("button", { hasText: /Save routing/i }).first();
  if ((await saveRouting.count()) > 0) {
    await settle(saveRouting.click({ timeout: 5_000 }));
    await wait(page, 1_000);
  }

  await shot(page, "01-ai-providers-configured");
  await writeOutput(`configured local AI via UI endpoint=${endpoint} model=${modelId}`);
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

  const generate = page.locator("button", { hasText: /Generate Questions/i }).first();
  await generate.waitFor({ state: "visible", timeout: 10_000 });
  for (let attempt = 0; attempt < 20 && (await generate.isDisabled()); attempt += 1) {
    await wait(page, 250);
  }

  const answerBox = page.locator("textarea:visible").first();
  let questionsReady = false;
  for (let attempt = 0; attempt < 2 && !questionsReady; attempt += 1) {
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/resumes/from-questions/generate") &&
        response.request().method() === "POST",
      { timeout: 180_000 },
    );
    await generate.click({ timeout: 10_000 });
    const responseResult = await settle(responsePromise);
    if (responseResult.status === "rejected") {
      await writeError(`resume questions request missing (attempt ${String(attempt + 1)})`);
      await shot(page, `03-resume-questions-timeout-${String(attempt + 1)}`);
      continue;
    }
    const bodyText = await responseResult.value.text();
    await writeOutput(
      `resume questions HTTP ${String(responseResult.value.status())} body=${bodyText.slice(0, 180)}`,
    );
    const waitResult = await settle(answerBox.waitFor({ state: "visible", timeout: 30_000 }));
    questionsReady = waitResult.status === "fulfilled";
    if (!questionsReady) {
      await shot(page, `03-resume-questions-missing-${String(attempt + 1)}`);
    }
  }
  if (!questionsReady) {
    throw new Error("Resume guided build: AI questions never appeared after live generate.");
  }
  await shot(page, "03-resume-questions");

  for (let step = 0; step < 10; step += 1) {
    const visibleAnswer = page.locator("textarea:visible").first();
    if ((await visibleAnswer.count()) === 0) {
      break;
    }
    await visibleAnswer.fill(
      `Alex Rivera, Gameplay Programmer — shipped combat pacing on a live co-op title (Unreal + TypeScript). Answer ${String(step + 1)}.`,
    );
    await wait(page, 400);

    const synthesize = page
      .locator("button", { hasText: /synthesize|generate resume|build resume|finish/i })
      .filter({ hasNot: page.locator("[disabled]") })
      .first();
    if ((await synthesize.count()) > 0 && !(await synthesize.isDisabled())) {
      await synthesize.click({ timeout: 10_000 });
      break;
    }

    const next = page.locator("button", { hasText: /^Next$/i }).first();
    if ((await next.count()) === 0) {
      break;
    }
    for (let attempt = 0; attempt < 20 && (await next.isDisabled()); attempt += 1) {
      await wait(page, 200);
    }
    if (await next.isDisabled()) {
      break;
    }
    await next.click();
    await wait(page, 600);
  }

  // Wait for synthesis / completion UI
  await wait(page, 15_000);
  const lateSynth = page
    .locator("button", { hasText: /synthesize|generate resume|build resume|finish/i })
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
  const edit = page.getByRole("button", { name: /^Edit$/i }).first();
  if ((await edit.count()) > 0) {
    await edit.click();
    await wait(page, 1_200);
  }
  const exportBtn = page.getByRole("button", { name: /Export/i }).first();
  if ((await exportBtn.count()) > 0) {
    await exportBtn.click();
    await wait(page, 400);
    const downloadPromise = page.waitForEvent("download", { timeout: 45_000 });
    await page
      .getByRole("menuitem", { name: /PDF/i })
      .or(page.getByRole("button", { name: /PDF/i }))
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

  const add = page.getByRole("button", { name: /Add Project|Add Mapping|Add/i }).first();
  await settle(add.click({ timeout: 8_000 }));
  await wait(page, 1_000);

  const title = page.getByLabel(/title/i).or(page.locator('input[name*="title" i]')).first();
  await settle(title.fill("Combat Sandbox Prototype"));
  const description = page
    .getByLabel(/description|bio/i)
    .or(page.locator("textarea"))
    .first();
  await settle(
    description.fill(
      "Encounter pacing lab for co-op readability — Unreal + TypeScript tooling, featured on portfolio.",
    ),
  );
  const tech = page.getByLabel(/technolog/i).or(page.locator('input[placeholder*="tech" i]')).first();
  if ((await tech.count()) > 0) {
    await settle(tech.fill("Unreal Engine"));
    const addTech = page.getByRole("button", { name: /add technology|add/i }).first();
    await settle(addTech.click());
  }

  const save = page.getByRole("button", { name: /Save|Create|Add Project/i }).last();
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

  const generate = page.locator("button", { hasText: /Generate Cover Letter|Generate/i }).first();
  await generate.click({ timeout: 10_000 });
  await wait(page, 1_200);

  await page.getByLabel(/company/i).first().fill("Hitmarker Studios");
  await page.getByLabel(/position|role/i).first().fill("Gameplay Programmer");
  const jobDesc = page.getByLabel(/job description|description/i).first();
  if ((await jobDesc.count()) > 0) {
    await jobDesc.fill(
      "Looking for a gameplay programmer to own combat systems, work with design, and ship live updates.",
    );
  }

  const submit = page.locator("button", { hasText: /Generate|Create|Submit/i }).last();
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
  const send = page.locator("button", { hasText: /send|submit/i }).first();
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

  const studio = page.locator("button", { hasText: /Studio Drill|Start Studio/i }).first();
  await studio.click({ timeout: 10_000 });
  await wait(page, 1_500);
  await shot(page, "16-interview-config");

  const studioSelect = page.getByLabel(/studio/i).or(page.locator("select")).first();
  if ((await studioSelect.count()) > 0) {
    await settle(studioSelect.selectOption({ index: 1 }));
  }
  // Enable voice mode when the config checkbox exists.
  const voiceToggle = page.getByLabel(/voice|microphone|enable voice/i).first();
  if ((await voiceToggle.count()) > 0) {
    await settle(voiceToggle.check({ force: true }));
  }

  const start = page
    .locator("button", { hasText: /Start Interview|Start Session|Begin/i })
    .first();
  await start.click({ timeout: 12_000 });
  await page.locator("textarea:visible").first().waitFor({ state: "visible", timeout: 90_000 });
  await shot(page, "17-interview-session");

  // Whisper STT via fake mic capture → MediaRecorder → /api/speech/transcribe.
  const micStart = page
    .locator("button", { hasText: /Start listening|Start voice|Listen/i })
    .or(page.getByRole("button", { name: /start listening|start voice|listen/i }))
    .first();
  if ((await micStart.count()) > 0) {
    await micStart.click({ timeout: 8_000 });
    await wait(page, 6_500);
    const micStop = page
      .locator("button", { hasText: /Stop listening|Stop voice|Stop/i })
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
    .locator("button", { hasText: /Submit|Send Response|Continue/i })
    .first();
  await submit.click({ timeout: 8_000 });
  await wait(page, 45_000);
  await shot(page, "18-interview-feedback");
};

const encodeMp4 = async (webmPath: string): Promise<string | null> => {
  const mp4Path = join(OUT, "bao-product-demo.mp4");
  const proc = Bun.spawn(
    [
      "ffmpeg",
      "-y",
      "-i",
      webmPath,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      mp4Path,
    ],
    { stdout: "pipe", stderr: "pipe" },
  );
  const code = await proc.exited;
  if (code !== 0) {
    const err = await new Response(proc.stderr).text();
    await writeError(`ffmpeg failed: ${err.slice(0, 400)}`);
    return null;
  }
  return mp4Path;
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  await mkdir(join(OUT, "downloads"), { recursive: true });
  await mkdir(join(OUT, "raw-segments"), { recursive: true });

  const live = await assertLiveInference();
  const whisper = await assertLiveWhisper();
  await seedSpeechAndAiSettings(live.modelId);

  const browser = await chromium.launch({
    headless: false,
    args: [
      "--disable-dev-shm-usage",
      "--window-size=1440,900",
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-audio-capture=${FAKE_AUDIO_WAV}`,
    ],
  });
  const context = await browser.newContext({
    recordVideo: {
      dir: join(OUT, "raw-segments"),
      size: { width: 1440, height: 900 },
    },
    viewport: { width: 1440, height: 900 },
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

    await configureLocalAiViaUi(page, live.endpoint, live.modelId);
    await writeOutput(`whisper fixture configured endpoint=${whisper.endpoint}`);
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

  const video = page.video();
  await context.close();
  await browser.close();

  let webmPath: string | null = null;
  if (video) {
    webmPath = await video.path();
  }
  const segments = await readdir(join(OUT, "raw-segments"));
  const webmName = segments.find((name) => name.endsWith(".webm"));
  const stableWebm = join(OUT, "bao-product-demo.webm");
  if (webmName) {
    const source = join(OUT, "raw-segments", webmName);
    await Bun.write(stableWebm, Bun.file(source));
    webmPath = stableWebm;
  }

  let mp4Path: string | null = null;
  if (webmPath) {
    mp4Path = await encodeMp4(webmPath);
  }

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

  if (!webmPath || webmBytes < 50_000 || tourError) {
    await writeError("Product demo incomplete (missing/small video or tour error).");
    process.exitCode = 1;
  }
};

await main();
