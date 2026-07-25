/**
 * Headed TTS proof — click Replay/speak in AI Chat; fail-closed if synthesis never engages.
 * Exit 1 when voices missing (BLOCKED) — never false-green.
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
const OUT = process.env.TTS_PROOF_OUT ?? "/opt/cursor/artifacts/live-capabilities/tts-live";

const wait = async (page: Page, ms: number): Promise<void> => {
  await page.waitForTimeout(ms);
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  await mkdir(join(OUT, "raw"), { recursive: true });
  const findings: string[] = [];

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    recordVideo: { dir: join(OUT, "raw"), size: { width: 1440, height: 900 } },
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.aiChat}`, { waitUntil: "networkidle" });
  await wait(page, 1_500);

  const voiceCount = await page.evaluate(async () => {
    if (typeof speechSynthesis === "undefined") {
      return 0;
    }
    const ready = new Promise<number>((resolve) => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices.length);
        return;
      }
      speechSynthesis.onvoiceschanged = () => {
        resolve(speechSynthesis.getVoices().length);
      };
      setTimeout(() => resolve(speechSynthesis.getVoices().length), 2_000);
    });
    return ready;
  });

  if (voiceCount === 0) {
    findings.push("BLOCKED: speechSynthesis has 0 voices in this environment");
  }

  const input = page.getByRole("textbox").or(page.locator("textarea")).first();
  if ((await input.count()) > 0) {
    await input.fill("Say hello for TTS proof.");
    const send = page.getByRole("button", { name: /Send|Submit/i }).first();
    if ((await send.count()) > 0) {
      await send.click();
      await wait(page, 4_000);
    }
  }

  const replay = page
    .getByRole("button", { name: /Replay|Speak|Read aloud|Play/i })
    .first();
  if ((await replay.count()) === 0) {
    findings.push("TTS replay/speak control not found in AI Chat UI");
  } else if (voiceCount > 0) {
    await replay.click();
    await wait(page, 800);
    const speaking = await page.evaluate(
      () => speechSynthesis.speaking || speechSynthesis.pending,
    );
    if (!speaking) {
      findings.push("speechSynthesis did not enter speaking/pending after Replay click");
    }
  }

  await page.screenshot({ path: join(OUT, "stills", "01-tts-chat.png"), fullPage: false });

  const video = page.video();
  await context.close();
  await browser.close();
  let videoPath: string | null = null;
  if (video) {
    const raw = await video.path();
    videoPath = join(OUT, "tts-live.webm");
    await Bun.write(videoPath, Bun.file(raw));
  }

  const blocked = findings.some((f) => f.startsWith("BLOCKED:"));
  const report = {
    ok: findings.length === 0,
    blocked,
    findings,
    voiceCount,
    videoPath,
  };
  await writeFile(join(OUT, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeOutput(
    `tts-live: ok=${String(report.ok)} blocked=${String(blocked)} voices=${String(voiceCount)}`,
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
