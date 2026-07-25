/**
 * Headed proof: DOM reactivity + fluidity via real click/type (no API inject).
 * Fail-closed (LDL): any finding → exit 1.
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
const OUT =
  process.env.DOM_REACTIVITY_OUT ?? "/opt/cursor/artifacts/live-capabilities/dom-reactivity";

const RE_EDIT_RESUME = /Edit resume/i;
const RE_SEARCH = /Search|Omni|workspace search/i;

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
  let navCount = 0;
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) {
      navCount += 1;
    }
  });

  // 1) Resume CM6 reactivity — type updates .cm-content without reload
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resume}`, { waitUntil: "networkidle" });
  await wait(page, 1_000);
  const navBeforeEdit = navCount;
  await page.getByRole("button", { name: RE_EDIT_RESUME }).first().click();
  await wait(page, 1_200);
  const cm = page.locator(".cm-content").first();
  if ((await cm.count()) === 0) {
    findings.push("Resume: CodeMirror not mounted");
  } else {
    const marker = ` REACT_${Date.now().toString(36)}`;
    await cm.click();
    await page.keyboard.type(marker);
    await wait(page, 400);
    const text = (await cm.innerText()) ?? "";
    if (!text.includes(marker.trim())) {
      findings.push("Resume CM6: typed text not reflected in DOM");
    }
    if (navCount > navBeforeEdit + 1) {
      findings.push("Resume edit: unexpected full navigation while typing");
    }
  }
  await shot(page, "01-resume-cm6-react");

  // 2) Theme toggle fluidity — data-theme flips
  const themeBefore = await page.locator("html").getAttribute("data-theme");
  const swap = page.locator("label.swap.swap-rotate").first();
  if ((await swap.count()) === 0) {
    findings.push("Theme swap control missing");
  } else {
    await swap.click();
    await wait(page, 500);
    const themeAfter = await page.locator("html").getAttribute("data-theme");
    if (!themeAfter || themeAfter === themeBefore) {
      findings.push(`Theme did not flip (${themeBefore} → ${themeAfter})`);
    }
  }
  await shot(page, "02-theme-flip");

  // 3) OmniSearch reactivity
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.dashboard}`, { waitUntil: "networkidle" });
  await wait(page, 800);
  const metaK = await settle(page.keyboard.press("Meta+k"));
  if (metaK.status === "rejected") {
    const ctrlK = await settle(page.keyboard.press("Control+k"));
    if (ctrlK.status === "rejected") {
      findings.push("OmniSearch shortcut failed (Meta/Control+K)");
    }
  }
  await wait(page, 600);
  const searchInput = page.getByRole("searchbox").or(page.getByPlaceholder(RE_SEARCH)).first();
  if ((await searchInput.count()) > 0) {
    await searchInput.fill("resume");
    await wait(page, 700);
    const value = await searchInput.inputValue();
    if (value !== "resume") {
      findings.push("OmniSearch input not reactive");
    }
    await shot(page, "03-omnisearch");
    await page.keyboard.press("Escape");
  } else {
    findings.push("OmniSearch input not found after shortcut");
    await shot(page, "03-omnisearch-missing");
  }

  // 4) Viewport fluidity: mobile dock vs desktop sidebar
  await page.setViewportSize({ width: 390, height: 844 });
  await wait(page, 600);
  const dock = page.locator("[data-testid='app-dock'], nav.dock, .dock").first();
  let dockVisible = false;
  if ((await dock.count()) > 0) {
    const dockVis = await settle(dock.isVisible());
    dockVisible = dockVis.status === "fulfilled" && dockVis.value;
  }
  await shot(page, "04-mobile-viewport");
  await page.setViewportSize({ width: 1440, height: 900 });
  await wait(page, 600);
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
    // dock may use different selector — warn not fail if drawer-only
    findings.push("Mobile dock not visibly present at 390 (check selector/IA)");
  }

  // 5) Single FAB (no floating chat)
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
  await writeOutput(`dom-reactivity: findings=${String(findings.length)} video=${videoPath ?? "none"}`);
  if (findings.length > 0) {
    for (const finding of findings) {
      await writeError(finding);
    }
    process.exit(1);
  }
};

const runResult = await settle(main());
if (runResult.status === "rejected") {
  await writeError(runResult.reason.message);
  process.exit(1);
}
