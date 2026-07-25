/**
 * Fail-closed IDE editor surface proof: Vim/minimap/TipTap/Cmd+P markers in DOM.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { APP_ROUTE_BUILDERS, APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import {
  MS_EIGHT_HUNDRED,
  MS_FOUR_HUNDRED,
  MS_ONE_AND_HALF_SECONDS,
  MS_ONE_TWO_HUNDRED,
  MS_SIX_HUNDRED,
  MS_THREE_HUNDRED,
  VIEWPORT_HEIGHT_DESKTOP,
  VIEWPORT_WIDTH_DESKTOP,
} from "./constants/numeric-literals";
import { writeError, writeOutput } from "./utils/cli-output";
import { settlePage } from "./utils/playwright-settle";
import { reportFindingsAndExit } from "./utils/proof-findings";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const OUT = process.env.EDITOR_IDE_OUT ?? "/opt/cursor/artifacts/live-capabilities/editor-ide";
const RE_SEARCH = /Search/i;
const DESKTOP_VIEWPORT = {
  width: VIEWPORT_WIDTH_DESKTOP,
  height: VIEWPORT_HEIGHT_DESKTOP,
} as const;

const wait = settlePage;

const shot = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({ path: join(OUT, "stills", `${name}.png`), fullPage: false });
};

const probeJsonVimMinimap = async (page: Page, findings: string[]): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTE_BUILDERS.settingsSection("jobIntelligence")}`, {
    waitUntil: "domcontentloaded",
  });
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  await page.keyboard.press("Escape");
  await wait(page, MS_THREE_HUNDRED);
  const vimToggle = page.getByTestId("editor-vim-toggle").first();
  if ((await page.getByTestId("editor-vim-toggle").count()) === 0) {
    findings.push("Vim toggle missing on JSON power editor");
  } else {
    await vimToggle.dispatchEvent("click");
    await wait(page, MS_FOUR_HUNDRED);
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
};

const probeCmdPOmniSearch = async (page: Page, findings: string[]): Promise<void> => {
  await page.keyboard.press("Control+p");
  await wait(page, MS_SIX_HUNDRED);
  const search = page.getByRole("searchbox").or(page.getByPlaceholder(RE_SEARCH)).first();
  if ((await search.count()) === 0) {
    await page.keyboard.press("Meta+p");
    await wait(page, MS_SIX_HUNDRED);
  }
  if ((await page.getByRole("searchbox").or(page.getByPlaceholder(RE_SEARCH)).count()) === 0) {
    findings.push("Cmd/Ctrl+P did not open OmniSearch");
  }
  await shot(page, "02-cmd-p-omnisearch");
  await page.keyboard.press("Escape");
  await wait(page, MS_FOUR_HUNDRED);
  await page.keyboard.press("Escape");
  await wait(page, MS_THREE_HUNDRED);
};

const probeTipTapBlocks = async (page: Page, findings: string[]): Promise<void> => {
  const listRes = await settle(
    page.goto(`${CLIENT_BASE}${APP_ROUTES.coverLetter}`, { waitUntil: "domcontentloaded" }),
  );
  if (listRes.status === "rejected") {
    findings.push("cover letter index navigation failed");
  }
  await wait(page, MS_EIGHT_HUNDRED);
  await page.keyboard.press("Escape");
  const href = await page
    .locator(`a[href*='${APP_ROUTES.coverLetter}/']`)
    .first()
    .getAttribute("href");
  if (!href) {
    findings.push("No cover letter detail link to open TipTap editor");
    return;
  }
  await page.goto(`${CLIENT_BASE}${href}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_ONE_TWO_HUNDRED);
  await page.keyboard.press("Escape");
  if ((await page.getByTestId("app-block-editor").count()) === 0) {
    findings.push("TipTap AppBlockEditor not present on cover letter detail");
    return;
  }
  await shot(page, "03-tiptap-blocks");
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
    recordVideo: { dir: join(OUT, "raw"), size: DESKTOP_VIEWPORT },
    viewport: DESKTOP_VIEWPORT,
  });
  const page = await context.newPage();
  await probeJsonVimMinimap(page, findings);
  await probeCmdPOmniSearch(page, findings);
  await probeTipTapBlocks(page, findings);
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
  await reportFindingsAndExit(findings);
};

const run = await settle(main());
if (run.status === "rejected") {
  await writeError(run.reason.message);
  process.exit(1);
}
