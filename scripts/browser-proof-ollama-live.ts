/**
 * Fail-closed headed proof: configure Ollama + chat via UI clicks/typing only.
 * No settings/chat API injection — raw Ollama probe is infrastructure preflight only.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { APP_ROUTE_BUILDERS, APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import {
  COUNT_THIRTY_SIX,
  MS_EIGHT_HUNDRED,
  MS_ONE_TWO_HUNDRED,
  MS_SIXTY_SECONDS,
  MS_TWELVE_SECONDS,
  MS_TWO_SECONDS,
} from "./constants/numeric-literals";
import { writeError, writeOutput } from "./utils/cli-output";
import { assertLiveInference } from "./utils/live-ai-probe";
import { settlePage } from "./utils/playwright-settle";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const OUT =
  process.env.OLLAMA_PROOF_OUT ?? "/opt/cursor/artifacts/live-capabilities/ollama-live-ui";
const SEND_BUTTON_PATTERN = /send/iu;
const LOCAL_PROVIDER_PATTERN = /Local Model/i;
const TEST_ARIA_PATTERN = /Test AI provider connection/i;
const SAVE_KEYS_ARIA_PATTERN = /Save AI provider credentials/i;
const CONNECTED_PATTERN = /Connected/i;
const ENDPOINT_LABEL_PATTERN = /Endpoint URL/i;
const MODEL_LABEL_PATTERN = /Local model name/i;
const ENDPOINT =
  process.env.LOCAL_MODEL_ENDPOINT?.replace(/\/$/u, "") ?? "http://127.0.0.1:11434/v1";
const MODEL = process.env.LOCAL_MODEL_NAME?.trim() || "llama3.2:1b";

const wait = settlePage;

const configureLocalViaUi = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTE_BUILDERS.settingsSection("aiProviders")}`, {
    waitUntil: "domcontentloaded",
  });
  await wait(page, MS_ONE_TWO_HUNDRED);

  await page
    .locator("summary, .collapse-title")
    .filter({ hasText: LOCAL_PROVIDER_PATTERN })
    .first()
    .click();
  await wait(page, MS_EIGHT_HUNDRED);

  const keyInput = page.getByLabel(ENDPOINT_LABEL_PATTERN);
  await keyInput.click();
  await keyInput.fill("");
  await keyInput.pressSequentially(ENDPOINT, { delay: 15 });

  const modelInput = page.getByLabel(MODEL_LABEL_PATTERN);
  await modelInput.click();
  await modelInput.fill("");
  await modelInput.pressSequentially(MODEL, { delay: 15 });

  const endpointJoin = page
    .locator(".join")
    .filter({ has: page.getByLabel(ENDPOINT_LABEL_PATTERN) });
  await endpointJoin.getByRole("button", { name: TEST_ARIA_PATTERN }).click();
  await wait(page, MS_TWELVE_SECONDS);
  await page.screenshot({ path: join(OUT, "stills", "01-settings-test-clicked.png") });

  const connected = page.getByText(CONNECTED_PATTERN).first();
  if ((await connected.count()) === 0 || !(await connected.isVisible())) {
    throw new Error("Settings UI Test did not show Connected badge for Local provider");
  }

  await page.getByRole("button", { name: SAVE_KEYS_ARIA_PATTERN }).click();
  await wait(page, MS_TWO_SECONDS);
  await page.screenshot({ path: join(OUT, "stills", "02-settings-saved.png") });
};

const chatViaUi = async (page: Page): Promise<string> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.aiChat}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_ONE_TWO_HUNDRED);
  const uiNonce = `BAO_UI_${Date.now().toString(COUNT_THIRTY_SIX)}`;
  const composer = page.locator("textarea").first();
  await composer.click();
  await composer.fill("");
  await composer.pressSequentially(
    `Reply with ONLY this exact token and nothing else: ${uiNonce}`,
    { delay: 10 },
  );
  await page.getByRole("button", { name: SEND_BUTTON_PATTERN }).first().click();
  await wait(page, MS_SIXTY_SECONDS);
  const bodyText = await page.locator("main").innerText();
  await page.screenshot({ path: join(OUT, "stills", "03-ai-chat-live.png") });
  if (!bodyText.includes(uiNonce)) {
    throw new Error(`AI Chat UI missing nonce ${uiNonce}`);
  }
  return uiNonce;
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  const probe = await assertLiveInference({ modelId: MODEL, endpoint: ENDPOINT });
  await writeFile(join(OUT, "raw-probe.json"), `${JSON.stringify(probe, null, 2)}\n`);

  const browser = await chromium.launch({ headless: false, args: ["--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await configureLocalViaUi(page);
  const uiNonce = await chatViaUi(page);
  await browser.close();

  await writeFile(
    join(OUT, "report.json"),
    `${JSON.stringify(
      {
        ok: true,
        mode: "ui-click-type",
        probe,
        endpoint: ENDPOINT,
        model: MODEL,
        uiNonce,
      },
      null,
      2,
    )}\n`,
  );
  await writeOutput(`browser-proof-ollama-live OK (UI) → ${OUT}`);
};

const runResult = await settle(main());
if (runResult.status === "rejected") {
  await writeError(runResult.reason.message);
  process.exit(1);
}
