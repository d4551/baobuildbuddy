const NUM_10000 = 10_000;
const NUM_1400 = 1_400;
const NUM_200 = 200;
const NUM_300 = 300;
const NUM_40 = 40;
const NUM_400 = 400;
const NUM_500 = 500;

/**
 * Helpers for browser-record-visual-proof.ts (complexity split).
 */
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "playwright";
import { writeError, writeOutput } from "./utils/cli-output";

const RE_BANNED_BUTTON_LABEL = /save|delete|submit|clear|remove|revoke|reset/i;

export const waitForPageReady = async (page: Page, timeout: number): Promise<void> => {
  await page
    .locator("body")
    .waitFor({ state: "visible", timeout })
    .then(
      () => undefined,
      () => undefined,
    );
  await page.waitForLoadState("domcontentloaded", { timeout }).then(
    () => undefined,
    () => undefined,
  );
};

export const mapSequential = async <TItem>(
  items: readonly TItem[],
  mapper: (item: TItem) => Promise<void>,
  index = 0,
): Promise<void> => {
  const item = items[index];
  if (item === undefined) {
    return;
  }
  await mapper(item);
  await mapSequential(items, mapper, index + 1);
};

const readDataTheme = async (page: Page): Promise<string | null> =>
  page.evaluate(
    () =>
      document.querySelector("[data-theme]")?.getAttribute("data-theme") ??
      document.documentElement.getAttribute("data-theme"),
  );

export const proveDashboardTheme = async (page: Page, viewportName: string): Promise<void> => {
  const beforeTheme = await readDataTheme(page);
  await page.locator("label.swap").first().click({ timeout: 5_000 });
  await waitForPageReady(page, NUM_500);
  const afterTheme = await readDataTheme(page);
  await writeOutput(`theme ${viewportName}: ${String(beforeTheme)} → ${String(afterTheme)}`);
  if (!beforeTheme || !afterTheme || beforeTheme === afterTheme) {
    await writeError(`Theme failed to flip on ${viewportName}`);
    process.exitCode = 1;
  }
  await page.locator("label.swap").first().click({ timeout: 5_000 });
  await waitForPageReady(page, NUM_300);
};

export const clickSafeMainButton = async (page: Page): Promise<boolean> =>
  page.evaluate((bannedSource) => {
    const mainEl = document.querySelector("main");
    if (!mainEl) return false;
    const banned = new RegExp(bannedSource, "i");
    const button = Array.from(mainEl.querySelectorAll("button")).find((candidate) => {
      if (!(candidate instanceof HTMLButtonElement)) return false;
      if (candidate.disabled || candidate.classList.contains("absolute")) return false;
      const label = `${candidate.getAttribute("aria-label") ?? ""} ${candidate.textContent ?? ""}`;
      if (banned.test(label)) return false;
      const style = window.getComputedStyle(candidate);
      return style.display !== "none" && style.visibility !== "hidden";
    });
    if (!button) return false;
    button.scrollIntoView({ block: "center" });
    button.click();
    return true;
  }, RE_BANNED_BUTTON_LABEL.source);

export const assertNoDevtoolsHud = async (
  page: Page,
  viewportName: string,
  routeSlug: string,
): Promise<void> => {
  const hasDevtools = await page.evaluate(() => {
    const el = document.getElementById("nuxt-devtools-container");
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden" && el.childElementCount > 0;
  });
  if (!hasDevtools) return;
  await writeError(`Nuxt DevTools HUD still visible on ${viewportName}/${routeSlug}`);
  process.exitCode = 1;
};

export type VisualRoute = { readonly slug: string; readonly path: string };
export type VisualViewport = {
  readonly name: string;
  readonly width: number;
  readonly height: number;
};

export const tourRoute = async (
  page: Page,
  stillsDir: string,
  consoleErrors: string[],
  clientBase: string,
  viewport: VisualViewport,
  route: VisualRoute,
): Promise<void> => {
  await page.goto(`${clientBase}${route.path}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await waitForPageReady(page, NUM_1400);
  if (route.slug === "dashboard") {
    await proveDashboardTheme(page, viewport.name);
  }
  const clicked = await clickSafeMainButton(page);
  await waitForPageReady(page, NUM_400);
  await page.keyboard.press("Escape");
  await waitForPageReady(page, NUM_200);
  await assertNoDevtoolsHud(page, viewport.name, route.slug);
  await page.screenshot({
    path: join(stillsDir, `${viewport.name}-${route.slug}.png`),
    fullPage: false,
  });
  await writeOutput(
    `shot ${viewport.name}/${route.slug} click=${String(clicked)} consoleErrors=${String(consoleErrors.length)}`,
  );
};

export const finalizeVisualProof = async (input: {
  readonly outDir: string;
  readonly stillsDir: string;
  readonly clientBase: string;
  readonly videoPath: string | null;
  readonly consoleErrors: readonly string[];
  readonly viewports: readonly VisualViewport[];
  readonly routes: readonly VisualRoute[];
  readonly display: string | null;
}): Promise<void> => {
  let resolvedVideo = input.videoPath;
  const segmentsDir = join(input.outDir, "raw-segments");
  const segmentNames = await readdir(segmentsDir);
  const webm = segmentNames.find((name) => name.endsWith(".webm"));
  const stableVideo = join(input.outDir, "ui-visual-proof-mobile-tablet-desktop.webm");
  if (webm) {
    await Bun.write(stableVideo, Bun.file(join(segmentsDir, webm)));
    resolvedVideo = stableVideo;
  }
  const stillCount = (await readdir(input.stillsDir)).filter((name) =>
    name.endsWith(".png"),
  ).length;
  const videoStats = resolvedVideo ? await stat(resolvedVideo) : null;
  const report = {
    CLIENT_BASE: input.clientBase,
    headless: false,
    display: input.display,
    viewports: input.viewports.map((viewport) => viewport.name),
    routes: input.routes.map((route) => route.path),
    stillCount,
    videoPath: resolvedVideo,
    videoBytes: videoStats?.size ?? 0,
    consoleErrorCount: input.consoleErrors.length,
    consoleErrors: input.consoleErrors.slice(0, NUM_40),
  };
  await Bun.write(join(input.outDir, "proof-report.json"), JSON.stringify(report, null, 2));
  await writeOutput(
    `browser-record-visual-proof: stills=${String(stillCount)} video=${resolvedVideo ?? "none"} bytes=${String(report.videoBytes)} consoleErrors=${String(input.consoleErrors.length)}`,
  );
  if (!resolvedVideo || report.videoBytes < NUM_10000) {
    await writeError("Video proof missing or too small — headed recording failed.");
    process.exitCode = 1;
  }
  if (input.consoleErrors.some((line) => line.includes("TypeError") || line.includes("500"))) {
    await writeError("Console contains TypeError/500 during headed tour.");
    process.exitCode = 1;
  }
};
