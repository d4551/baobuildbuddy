/**
 * Fail-closed headed proof: Ollama via Settings test + AI Chat UI + API nonce.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import { APP_ROUTE_BUILDERS, APP_ROUTES } from "../packages/shared/src/constants/routes";
import { writeError, writeOutput } from "./utils/cli-output";
import { assertLiveInference } from "./utils/live-ai-probe";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const SERVER_BASE = (process.env.PAGE_PROOF_SERVER_BASE ?? "http://127.0.0.1:3000").replace(
  /\/$/u,
  "",
);
const OUT = process.env.OLLAMA_PROOF_OUT ?? "/opt/cursor/artifacts/live-capabilities/ollama-live";
const SEND_BUTTON_PATTERN = /send/iu;

const wait = async (ms: number): Promise<void> => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  const probe = await assertLiveInference({ modelId: process.env.LOCAL_MODEL_NAME ?? "llama3.2:1b" });
  await writeFile(join(OUT, "raw-probe.json"), `${JSON.stringify(probe, null, 2)}\n`);

  // Ensure app settings point at live Ollama
  const keysResponse = await fetch(`${SERVER_BASE}/api/settings/api-keys`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      localModelEndpoint: probe.endpoint,
      localModelName: probe.modelId,
    }),
  });
  if (!keysResponse.ok) {
    throw new Error(`settings api-keys PUT failed: ${String(keysResponse.status)}`);
  }

  const settingsGet = await fetch(`${SERVER_BASE}/api/settings`);
  const settingsJson = (await settingsGet.json()) as {
    aiRouting: Record<string, { provider: string; model?: string | null }>;
  };
  const aiRouting = Object.fromEntries(
    Object.entries(settingsJson.aiRouting).map(([purpose]) => [
      purpose,
      { provider: "local", model: probe.modelId },
    ]),
  );
  const routingResponse = await fetch(`${SERVER_BASE}/api/settings`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ preferredProvider: "local", aiRouting }),
  });
  if (!routingResponse.ok) {
    throw new Error(`settings routing PUT failed: ${String(routingResponse.status)}`);
  }

  const testResponse = await fetch(`${SERVER_BASE}/api/settings/test-api-key`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ provider: "local", key: probe.endpoint, model: probe.modelId }),
  });
  const testJson = (await testResponse.json()) as { valid?: boolean; selectedModel?: string };
  if (!testResponse.ok || testJson.valid !== true) {
    throw new Error(`settings test-api-key failed: ${JSON.stringify(testJson)}`);
  }
  await writeFile(join(OUT, "settings-test.json"), `${JSON.stringify(testJson, null, 2)}\n`);

  const apiNonce = `BAO_APP_${Date.now().toString(36)}`;
  const chatApi = await fetch(`${SERVER_BASE}/api/ai/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message: `Reply with ONLY this exact token and nothing else: ${apiNonce}`,
    }),
  });
  const chatApiJson = (await chatApi.json()) as { message?: string; provider?: string; model?: string };
  if (!chatApi.ok || !chatApiJson.message?.includes(apiNonce)) {
    throw new Error(`app /api/ai/chat failed: ${JSON.stringify(chatApiJson).slice(0, 400)}`);
  }
  await writeFile(join(OUT, "app-chat-api.json"), `${JSON.stringify(chatApiJson, null, 2)}\n`);

  const browser = await chromium.launch({ headless: false, args: ["--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`${CLIENT_BASE}${APP_ROUTE_BUILDERS.settingsSection("aiProviders")}`, {
    waitUntil: "networkidle",
  });
  await wait(1_200);
  await page.screenshot({ path: join(OUT, "stills", "01-settings-ai-providers.png") });

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.aiChat}`, { waitUntil: "networkidle" });
  await wait(1_200);
  const uiNonce = `BAO_UI_${Date.now().toString(36)}`;
  const composer = page.locator("textarea, [contenteditable=true]").first();
  await composer.fill(`Reply with ONLY this exact token and nothing else: ${uiNonce}`);
  await page.getByRole("button", { name: SEND_BUTTON_PATTERN }).first().click();
  await wait(45_000);
  const bodyText = await page.locator("main").innerText();
  await page.screenshot({ path: join(OUT, "stills", "02-ai-chat-live.png") });
  await browser.close();

  if (!bodyText.includes(uiNonce)) {
    await writeError(`AI Chat UI missing nonce ${uiNonce}`);
    process.exit(1);
  }

  await writeFile(
    join(OUT, "report.json"),
    `${JSON.stringify(
      {
        ok: true,
        probe,
        settingsTest: testJson,
        chatApi: { provider: chatApiJson.provider, model: chatApiJson.model, nonce: apiNonce },
        uiNonce,
      },
      null,
      2,
    )}\n`,
  );
  await writeOutput(`browser-proof-ollama-live OK → ${OUT}`);
};

await main();
