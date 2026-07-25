/**
 * Fail-closed IDE editor surface proof: Vim/minimap/TipTap/Cmd+P markers in DOM.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { APP_ROUTE_BUILDERS, APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import { writeError, writeOutput } from "./utils/cli-output";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const OUT = process.env.EDITOR_IDE_OUT ?? "/opt/cursor/artifacts/live-capabilities/editor-ide";

const wait = async (page: Page, ms: number): Promise<void> => {
  await page.waitForTimeout(ms);
};

const shot = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({ path: join(OUT, "stills", `${name}.png`), fullPage: false });
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

  // 1) Settings Job Intelligence JSON — Vim/minimap always visible in AppJsonField
  await page.goto(`${CLIENT_BASE}${APP_ROUTE_BUILDERS.settingsSection("jobIntelligence")}`, {
    waitUntil: "networkidle",
  });
  await wait(page, 1_500);
  await page.keyboard.press("Escape");
  await wait(page, 300);
  const vimToggle = page.getByTestId("editor-vim-toggle").first();
  if ((await page.getByTestId("editor-vim-toggle").count()) === 0) {
    findings.push("Vim toggle missing on JSON power editor");
  } else {
    await vimToggle.dispatchEvent("click");
    await wait(page, 400);
    await vimToggle.dispatchEvent("click");
  }
  if ((await page.getByTestId("editor-minimap-toggle").count()) === 0) {
    findings.push("Minimap toggle missing");
  }
  const cm = page.locator("[data-testid='app-code-editor'] .cm-editor, .cm-editor").first();
  if ((await cm.count()) === 0) {
    findings.push("CodeMirror editor not mounted");
  } else {
    const vimAttr = await page.locator("[data-vim]").first().getAttribute("data-vim");
    if (vimAttr !== "on" && vimAttr !== "off") {
      findings.push("data-vim attribute missing on editor");
    }
  }
  await shot(page, "01-json-vim-minimap");

  // 2) Cmd/Ctrl+P opens OmniSearch
  await page.keyboard.press("Control+p");
  await wait(page, 600);
  const search = page.getByRole("searchbox").or(page.getByPlaceholder(/Search/i)).first();
  if ((await search.count()) === 0) {
    await page.keyboard.press("Meta+p");
    await wait(page, 600);
  }
  if ((await page.getByRole("searchbox").or(page.getByPlaceholder(/Search/i)).count()) === 0) {
    findings.push("Cmd/Ctrl+P did not open OmniSearch");
  }
  await shot(page, "02-cmd-p-omnisearch");
  await page.keyboard.press("Escape");
  await wait(page, 400);
  await page.keyboard.press("Escape");
  await wait(page, 300);

  // 3) Cover letter TipTap blocks — direct detail URL avoids overlay races
  const listRes = await settle(
    page.goto(`${CLIENT_BASE}${APP_ROUTES.coverLetter}`, { waitUntil: "networkidle" }),
  );
  if (listRes.status === "rejected") {
    findings.push("cover letter index navigation failed");
  }
  await wait(page, 800);
  await page.keyboard.press("Escape");
  const href = await page.locator("a[href*='/cover-letter/']").first().getAttribute("href");
  if (!href) {
    findings.push("No cover letter detail link to open TipTap editor");
  } else {
    await page.goto(`${CLIENT_BASE}${href}`, { waitUntil: "networkidle" });
    await wait(page, 1_200);
    await page.keyboard.press("Escape");
    if ((await page.getByTestId("app-block-editor").count()) === 0) {
      findings.push("TipTap AppBlockEditor not present on cover letter detail");
    } else {
      await shot(page, "03-tiptap-blocks");
    }
  }

  const video = page.video();
  await context.close();
  await browser.close();
  let videoPath: string | null = null;
  if (video) {
    const raw = await video.path();
    videoPath = join(OUT, "editor-ide.webm");
    await Bun.write(videoPath, Bun.file(raw));
  }

  const report = { ok: findings.length === 0, findings, videoPath };
  await writeFile(join(OUT, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeOutput(`editor-ide: findings=${String(findings.length)}`);
  if (findings.length > 0) {
    for (const f of findings) {
      await writeError(f);
    }
    process.exit(1);
  }
};

const run = await settle(main());
if (run.status === "rejected") {
  await writeError(run.reason.message);
  process.exit(1);
}
