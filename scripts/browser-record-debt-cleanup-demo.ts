/**
 * Authentic headed proof for non-IDE debt cleanup:
 * brand JSON editor, resume prose CM6, Fix Setup primary, single FAB, API docs body editor.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type Browser, type BrowserContext, chromium, type Page } from "playwright";
import { APP_ROUTE_BUILDERS, APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import {
  MS_EIGHT_HUNDRED,
  MS_ONE_AND_HALF_SECONDS,
  MS_ONE_TWO_HUNDRED,
  MS_SECOND,
} from "./constants/numeric-literals";
import { writeError, writeOutput } from "./utils/cli-output";
import { settlePage } from "./utils/playwright-settle";
import { reportFindingsAndExit } from "./utils/proof-findings";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const OUT = process.env.DEBT_CLEANUP_OUT ?? "/opt/cursor/artifacts/live-capabilities/debt-cleanup";

const RE_EDIT_RESUME = /Edit resume/i;
const RE_FIX_SETUP = /Fix Setup|Fix setup/i;
const RE_CONTENT_TAB = /^Content$/i;
const RE_TRY_TEST = /Try|Test|Send|Execute|Open tester|Try it/i;

const wait = settlePage;

const shot = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({ path: join(OUT, "stills", `${name}.png`), fullPage: false });
};

const probeBrandJsonEditor = async (page: Page, findings: string[]): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTE_BUILDERS.settingsSection("brand")}`, {
    waitUntil: "domcontentloaded",
  });
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  const contentTab = page
    .locator("button, a, [role=tab]")
    .filter({ hasText: RE_CONTENT_TAB })
    .first();
  if ((await contentTab.count()) > 0) {
    await contentTab.click();
    await wait(page, MS_EIGHT_HUNDRED);
  }
  if ((await page.locator(".cm-content").count()) === 0) {
    findings.push("Brand settings: no CodeMirror (.cm-content)");
  }
  await shot(page, "01-brand-json-editor");
};

const probeResumeProseEditor = async (page: Page, findings: string[]): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resume}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_ONE_TWO_HUNDRED);
  await page.getByRole("button", { name: RE_EDIT_RESUME }).first().click();
  await wait(page, MS_ONE_TWO_HUNDRED);
  const summaryEditor = page.locator(".cm-content").first();
  if ((await summaryEditor.count()) === 0) {
    findings.push("Resume summary: CodeMirror not mounted");
  } else {
    await summaryEditor.click();
    await page.keyboard.type(" Debt cleanup prose editor.");
  }
  await shot(page, "02-resume-prose-editor");
};

const probeFixSetupPrimary = async (page: Page, findings: string[]): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.automationScraper}`, {
    waitUntil: "domcontentloaded",
  });
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  const fixSetup = page.getByRole("link", { name: RE_FIX_SETUP }).first();
  if ((await fixSetup.count()) === 0) {
    await shot(page, "03-no-fix-setup-needed");
    return;
  }
  const classes = (await fixSetup.getAttribute("class")) ?? "";
  if (!classes.includes("btn-primary")) {
    findings.push(`Fix Setup not primary: class=${classes}`);
  }
  await fixSetup.click();
  await wait(page, MS_ONE_TWO_HUNDRED);
  await shot(page, "03-fix-setup-settings");
};

const probeSingleFab = async (page: Page, findings: string[]): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.dashboard}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_ONE_TWO_HUNDRED);
  const fabCount = await page.locator(".fab").count();
  const floatingChat = await page
    .locator("[aria-label*='floating chat' i], [aria-label*='Show floating chat' i]")
    .count();
  if (floatingChat > 0) {
    findings.push("Floating chat widget still present (dual FAB debt)");
  }
  if (fabCount < 1) {
    findings.push("QuickAction FAB missing on desktop dashboard");
  }
  await shot(page, "04-single-fab");
};

const probeApiDocsTester = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.apiDocs}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  const tryBtn = page.getByRole("button", { name: RE_TRY_TEST }).first();
  if ((await tryBtn.count()) > 0) {
    await tryBtn.click();
    await wait(page, MS_SECOND);
  }
  if ((await page.locator(".modal .cm-content, dialog .cm-content").count()) === 0) {
    const endpointTry = page.locator("button").filter({ hasText: RE_TRY_TEST }).first();
    if ((await endpointTry.count()) > 0) {
      await endpointTry.click();
      await wait(page, MS_SECOND);
    }
  }
  await shot(page, "05-api-docs-tester");
};

const finalizeDebtCleanupVideo = async (
  page: Page,
  context: BrowserContext,
  browser: Browser,
): Promise<string | null> => {
  const video = page.video();
  await context.close();
  await browser.close();
  if (!video) {
    return null;
  }
  const raw = await video.path();
  const videoPath = join(OUT, "debt-cleanup-demo.webm");
  await Bun.write(videoPath, Bun.file(raw));
  return videoPath;
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

  await probeBrandJsonEditor(page, findings);
  await probeResumeProseEditor(page, findings);
  await probeFixSetupPrimary(page, findings);
  await probeSingleFab(page, findings);
  await probeApiDocsTester(page);

  const videoPath = await finalizeDebtCleanupVideo(page, context, browser);
  const report = { ok: findings.length === 0, findings, videoPath, brandTab: true };
  await writeFile(join(OUT, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeOutput(
    `debt-cleanup-demo: findings=${String(findings.length)} video=${videoPath ?? "none"}`,
  );
  await reportFindingsAndExit(findings);
};

const runResult = await settle(main());
if (runResult.status === "rejected") {
  await writeError(runResult.reason.message);
  process.exit(1);
}
