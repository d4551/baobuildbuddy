/**
 * Headed proof: DOM reactivity + fluidity via real click/type (no API inject).
 * Fail-closed (LDL): any finding → exit 1.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import {
  COUNT_FIVE_HUNDRED,
  COUNT_THIRTY_SIX,
  MS_EIGHT_HUNDRED,
  MS_FOUR_HUNDRED,
  MS_ONE_TWO_HUNDRED,
  MS_SECOND,
  MS_SEVEN_HUNDRED,
  MS_SIX_HUNDRED,
  VIEWPORT_HEIGHT_DESKTOP,
  VIEWPORT_HEIGHT_MOBILE_PROOF,
  VIEWPORT_WIDTH_DESKTOP,
  VIEWPORT_WIDTH_MOBILE_PROOF,
} from "./constants/numeric-literals";
import { writeError, writeOutput } from "./utils/cli-output";
import { settlePage } from "./utils/playwright-settle";
import { reportFindingsAndExit } from "./utils/proof-findings";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const OUT =
  process.env.DOM_REACTIVITY_OUT ?? "/opt/cursor/artifacts/live-capabilities/dom-reactivity";

const RE_EDIT_RESUME = /Edit resume/i;
const RE_SEARCH = /Search|Omni|workspace search/i;
const DESKTOP_VIEWPORT = {
  width: VIEWPORT_WIDTH_DESKTOP,
  height: VIEWPORT_HEIGHT_DESKTOP,
} as const;

const wait = settlePage;

const shot = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({ path: join(OUT, "stills", `${name}.png`), fullPage: false });
};

const probeResumeCm6 = async (
  page: Page,
  findings: string[],
  navCount: () => number,
): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resume}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_SECOND);
  const navBeforeEdit = navCount();
  await page.getByRole("button", { name: RE_EDIT_RESUME }).first().click();
  await wait(page, MS_ONE_TWO_HUNDRED);
  const cm = page.locator(".cm-content").first();
  if ((await cm.count()) === 0) {
    findings.push("Resume: CodeMirror not mounted");
  } else {
    const marker = ` REACT_${Date.now().toString(COUNT_THIRTY_SIX)}`;
    await cm.click();
    await page.keyboard.type(marker);
    await wait(page, MS_FOUR_HUNDRED);
    const text = (await cm.innerText()) ?? "";
    if (!text.includes(marker.trim())) {
      findings.push("Resume CM6: typed text not reflected in DOM");
    }
    if (navCount() > navBeforeEdit + 1) {
      findings.push("Resume edit: unexpected full navigation while typing");
    }
  }
  await shot(page, "01-resume-cm6-react");
};

const probeThemeFlip = async (page: Page, findings: string[]): Promise<void> => {
  const themeBefore = await page.locator("html").getAttribute("data-theme");
  const swap = page.locator("label.swap.swap-rotate").first();
  if ((await swap.count()) === 0) {
    findings.push("Theme swap control missing");
  } else {
    await swap.click();
    await wait(page, COUNT_FIVE_HUNDRED);
    const themeAfter = await page.locator("html").getAttribute("data-theme");
    if (!themeAfter || themeAfter === themeBefore) {
      findings.push(`Theme did not flip (${themeBefore} → ${themeAfter})`);
    }
  }
  await shot(page, "02-theme-flip");
};

const probeOmniSearch = async (page: Page, findings: string[]): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.dashboard}`, { waitUntil: "domcontentloaded" });
  await wait(page, MS_EIGHT_HUNDRED);
  const metaK = await settle(page.keyboard.press("Meta+k"));
  if (metaK.status === "rejected") {
    const ctrlK = await settle(page.keyboard.press("Control+k"));
    if (ctrlK.status === "rejected") {
      findings.push("OmniSearch shortcut failed (Meta/Control+K)");
    }
  }
  await wait(page, MS_SIX_HUNDRED);
  const searchInput = page.getByRole("searchbox").or(page.getByPlaceholder(RE_SEARCH)).first();
  if ((await searchInput.count()) > 0) {
    await searchInput.fill("resume");
    await wait(page, MS_SEVEN_HUNDRED);
    const value = await searchInput.inputValue();
    if (value !== "resume") {
      findings.push("OmniSearch input not reactive");
    }
    await shot(page, "03-omnisearch");
    await page.keyboard.press("Escape");
    return;
  }
  findings.push("OmniSearch input not found after shortcut");
  await shot(page, "03-omnisearch-missing");
};

const probeViewports = async (
  page: Page,
  findings: string[],
): Promise<{ dockVisible: boolean; sidebarVisible: boolean }> => {
  await page.setViewportSize({
    width: VIEWPORT_WIDTH_MOBILE_PROOF,
    height: VIEWPORT_HEIGHT_MOBILE_PROOF,
  });
  await wait(page, MS_SIX_HUNDRED);
  const dock = page.locator("[data-testid='app-dock'], nav.dock, .dock").first();
  let dockVisible = false;
  if ((await dock.count()) > 0) {
    const dockVis = await settle(dock.isVisible());
    dockVisible = dockVis.status === "fulfilled" && dockVis.value;
  }
  await shot(page, "04-mobile-viewport");
  await page.setViewportSize(DESKTOP_VIEWPORT);
  await wait(page, MS_SIX_HUNDRED);
  const sidebar = page.locator("aside").first();
  let sidebarVisible = false;
  if ((await sidebar.count()) > 0) {
    const sideVis = await settle(sidebar.isVisible());
    sidebarVisible = sideVis.status === "fulfilled" && sideVis.value;
  }
  if (!sidebarVisible) {
    findings.push("Desktop sidebar not visible at 1440");
  }
  await shot(page, "05-desktop-viewport");
  if (!dockVisible) {
    findings.push("Mobile dock not visibly present at 390 (check selector/IA)");
  }
  return { dockVisible, sidebarVisible };
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
  let navCount = 0;
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) {
      navCount += 1;
    }
  });
  await probeResumeCm6(page, findings, () => navCount);
  await probeThemeFlip(page, findings);
  await probeOmniSearch(page, findings);
  const { dockVisible, sidebarVisible } = await probeViewports(page, findings);
  const floatingChat = await page
    .locator("[aria-label*='floating chat' i], [aria-label*='Show floating chat' i]")
    .count();
  if (floatingChat > 0) {
    findings.push("Floating chat still present — dual chrome");
  }
  const video = page.video();
  await context.close();
  await browser.close();
  let videoPath: string | null = null;
  if (video) {
    const raw = await video.path();
    videoPath = join(OUT, "dom-reactivity.webm");
    await Bun.write(videoPath, Bun.file(raw));
  }
  const report = { ok: findings.length === 0, findings, videoPath, dockVisible, sidebarVisible };
  await writeFile(join(OUT, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeOutput(
    `dom-reactivity: findings=${String(findings.length)} video=${videoPath ?? "none"}`,
  );
  await reportFindingsAndExit(findings);
};

const runResult = await settle(main());
if (runResult.status === "rejected") {
  await writeError(runResult.reason.message);
  process.exit(1);
}
