/**
 * Headed product demo video — real local AI (OpenAI-compatible endpoint),
 * mock interview, stylized resume / portfolio / cover-letter generation.
 *
 * Requires a live inference server (llama.cpp / Ollama / etc.) at
 * LOCAL_MODEL_ENDPOINT (default http://127.0.0.1:11434/v1). Refuses to run
 * against mocks or deterministic stub providers.
 *
 * Proof: Playwright recordVideo (headed, DISPLAY) → WebM + ffmpeg MP4.
 * Settings configured via Settings UI.
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

  const localDetails = page.locator("details.collapse").filter({ hasText: /Local/i }).first();
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

  const preferred = page.getByLabel(/preferred provider|Select provider for Chat/i).first();
  if ((await preferred.count()) > 0) {
    await settle(preferred.selectOption("local"));
  }

  const saveKeys = page
    .getByRole("button", { name: /Save provider|Save keys|^Save$/i })
    .first();
  await saveKeys.click({ timeout: 8_000 });
  await wait(page, 2_000);

  const savePreferred = page.getByRole("button", { name: /preferred provider|chat by default/i }).first();
  if ((await savePreferred.count()) > 0) {
    await settle(savePreferred.click({ timeout: 5_000 }));
    await wait(page, 1_000);
  }
  const saveRouting = page.getByRole("button", { name: /save routing|save ai routing/i }).first();
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

  const role = page.getByLabel(/role|target/i).or(page.locator("input").first());
  await settle(role.fill("Gameplay Programmer"));
  const experience = page.locator("select").first();
  if ((await experience.count()) > 0) {
    await settle(experience.selectOption({ index: 2 }));
  }

  const generate = page
    .getByRole("button", { name: /generate.*question|start|continue|create/i })
    .first();
  await generate.click({ timeout: 10_000 });
  await wait(page, 8_000);
  await shot(page, "03-resume-questions");

  const textareas = page.locator("textarea, input[type='text']");
  const fieldCount = Math.min(await textareas.count(), 6);
  for (let index = 0; index < fieldCount; index += 1) {
    const field = textareas.nth(index);
    const tag = await field.evaluate((el) => el.tagName.toLowerCase());
    if (tag === "textarea" || (await field.isEditable())) {
      await settle(
        field.fill(
          "Shipped combat pacing systems on a live co-op title using Unreal and TypeScript tooling.",
        ),
      );
    }
  }

  const nextOrSynth = page
    .getByRole("button", { name: /next|synthesize|generate resume|finish|submit|create resume/i })
    .first();
  await settle(nextOrSynth.click({ timeout: 10_000 }));
  await wait(page, 2_000);
  for (let step = 0; step < 8; step += 1) {
    const answerBox = page.locator("textarea:visible").first();
    if ((await answerBox.count()) > 0) {
      await settle(
        answerBox.fill(
          `Demo answer ${String(step + 1)}: shipped player-facing systems with measurable retention impact.`,
        ),
      );
    }
    const next = page.getByRole("button", { name: /next|continue|submit answer/i }).first();
    if ((await next.count()) === 0 || (await next.isDisabled())) {
      break;
    }
    await settle(next.click());
    await wait(page, 800);
  }

  const synthesize = page
    .getByRole("button", { name: /synthesize|generate resume|build resume|finish/i })
    .first();
  if ((await synthesize.count()) > 0) {
    await synthesize.click({ timeout: 10_000 });
  }
  await wait(page, 12_000);
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

  const generate = page
    .getByRole("button", { name: /Generate Cover Letter|Generate/i })
    .first();
  await generate.click({ timeout: 10_000 });
  await wait(page, 1_000);

  await settle(page.getByLabel(/company/i).first().fill("Hitmarker Studios"));
  await settle(page.getByLabel(/position|role/i).first().fill("Gameplay Programmer"));
  const jobDesc = page.getByLabel(/job description|description/i).first();
  if ((await jobDesc.count()) > 0) {
    await settle(
      jobDesc.fill(
        "Looking for a gameplay programmer to own combat systems, work with design, and ship live updates.",
      ),
    );
  }

  const submit = page
    .getByRole("button", { name: /Generate|Create|Submit/i })
    .filter({ hasNot: page.locator("[disabled]") })
    .last();
  await submit.click({ timeout: 10_000 });
  await wait(page, 20_000);
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

  const input = page
    .getByLabel(/message|chat|ask/i)
    .or(page.locator("textarea"))
    .first();
  await settle(
    input.fill(
      "Help me prepare a 60-second pitch for a gameplay programmer role focused on combat systems.",
    ),
  );
  const send = page.getByRole("button", { name: /send|submit/i }).first();
  await settle(send.click({ timeout: 8_000 }));
  await wait(page, 20_000);
  await shot(page, "14-ai-chat-response");
};

const demoInterview = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.interview}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 2_000);
  await shot(page, "15-interview-hub");

  const studio = page.getByRole("button", { name: /Studio Drill|Start Studio/i }).first();
  await studio.click({ timeout: 10_000 });
  await wait(page, 1_500);
  await shot(page, "16-interview-config");

  const studioSelect = page.getByLabel(/studio/i).or(page.locator("select")).first();
  if ((await studioSelect.count()) > 0) {
    await settle(studioSelect.selectOption({ index: 1 }));
  }
  const start = page.getByRole("button", { name: /Start Interview|Start Session|Begin/i }).first();
  await settle(start.click({ timeout: 12_000 }));
  await wait(page, 20_000);
  await shot(page, "17-interview-session");

  const response = page.locator("textarea:visible").first();
  if ((await response.count()) > 0) {
    await settle(
      response.fill(
        "In my last role I owned encounter pacing for a co-op combat sandbox. I partnered with design to define readability goals, shipped iteration tooling that cut balance cycles by half, and validated changes with playtests before live deploy.",
      ),
    );
    const submit = page.getByRole("button", { name: /Submit|Send Response|Continue/i }).first();
    await settle(submit.click({ timeout: 8_000 }));
    await wait(page, 20_000);
    await shot(page, "18-interview-feedback");
  }
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

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-dev-shm-usage", "--window-size=1440,900"],
  });
  const context = await browser.newContext({
    recordVideo: {
      dir: join(OUT, "raw-segments"),
      size: { width: 1440, height: 900 },
    },
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
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

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.dashboard}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 2_000);
  await shot(page, "00-dashboard");

  await configureLocalAiViaUi(page, live.endpoint, live.modelId);
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
    mockUsed: false,
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
    `browser-record-product-demo: stills=${String(stillCount)} webm=${webmPath ?? "none"} (${String(webmBytes)}) mp4=${mp4Path ?? "none"} (${String(mp4Bytes)}) errors=${String(consoleErrors.length)} live=${live.modelId}`,
  );

  if (!webmPath || webmBytes < 50_000) {
    await writeError("Product demo video missing or too small.");
    process.exitCode = 1;
  }
};

await main();
