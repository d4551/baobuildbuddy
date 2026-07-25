const NUM_10000 = 10_000;
const NUM_1400 = 1_400;
const NUM_200 = 200;
const NUM_40 = 40;
const NUM_400 = 400;

/**
 * Helpers for browser-record-visual-proof.ts (complexity split).
 */
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "playwright";
import { settle } from "../packages/shared/src/utils/promise";
import { writeError, writeOutput } from "./utils/cli-output";

const RE_BANNED_BUTTON_LABEL = /save|delete|submit|clear|remove|revoke|reset/i;

export const waitForPageReady = async (page: Page, timeout: number): Promise<void> => {
  // Fail-closed: blank/broken loads must not soft-continue.
  await page.locator("body").waitFor({ state: "visible", timeout });
  await page.waitForLoadState("domcontentloaded", { timeout });
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
      // Prefer documentElement (useTheme SSOT) over nested shells.
      document.documentElement.getAttribute("data-theme") ||
      document.querySelector("[data-theme]")?.getAttribute("data-theme") ||
      null,
  );

const THEME_TOGGLE_NAME = /toggle theme/i;
const THEME_FLIP_ATTEMPTS = 5;
const THEME_FLIP_OBSERVE_MS = 2_000;

const themeToggleLocator = (page: Page) =>
  page.getByRole("button", { name: THEME_TOGGLE_NAME }).first();

const attemptThemeFlip = async (
  page: Page,
  beforeTheme: string,
  attemptsLeft: number,
): Promise<string | null> => {
  if (attemptsLeft <= 0) {
    return readDataTheme(page);
  }
  await themeToggleLocator(page).click({ timeout: 5_000 });
  const changedResult = await settle(
    page.waitForFunction(
      (previous) => {
        const current =
          document.documentElement.getAttribute("data-theme") ||
          document.querySelector("[data-theme]")?.getAttribute("data-theme");
        return Boolean(current && current !== previous);
      },
      beforeTheme,
      { timeout: THEME_FLIP_OBSERVE_MS },
    ),
  );
  if (changedResult.status === "fulfilled") {
    return readDataTheme(page);
  }
  return attemptThemeFlip(page, beforeTheme, attemptsLeft - 1);
};

const flipUntilThemeChanges = async (page: Page, beforeTheme: string): Promise<string | null> => {
  await themeToggleLocator(page).waitFor({ state: "visible", timeout: 5_000 });
  return attemptThemeFlip(page, beforeTheme, THEME_FLIP_ATTEMPTS);
};

export const proveDashboardTheme = async (page: Page, viewportName: string): Promise<void> => {
  // Wait for hydrated data-theme + Vue app (SSR can paint theme before click handlers attach).
  await page.waitForFunction(
    () => {
      const theme =
        document.documentElement.getAttribute("data-theme") ||
        document.querySelector("[data-theme]")?.getAttribute("data-theme");
      const nuxtRoot = document.querySelector("#__nuxt") as { __vue_app__?: unknown } | null;
      return Boolean(theme && nuxtRoot?.__vue_app__);
    },
    undefined,
    { timeout: NUM_10000 },
  );
  const beforeTheme = await readDataTheme(page);
  if (!beforeTheme) {
    await writeError(`Theme missing before flip on ${viewportName}`);
    process.exitCode = 1;
    return;
  }
  const afterTheme = await flipUntilThemeChanges(page, beforeTheme);
  await writeOutput(`theme ${viewportName}: ${String(beforeTheme)} → ${String(afterTheme)}`);
  if (!afterTheme || beforeTheme === afterTheme) {
    await writeError(`Theme failed to flip on ${viewportName}`);
    process.exitCode = 1;
    return;
  }
  // Restore prior theme so subsequent stills stay consistent.
  const restored = await flipUntilThemeChanges(page, afterTheme);
  if (restored !== beforeTheme) {
    await writeError(
      `Theme failed to restore on ${viewportName}: ${String(afterTheme)} → ${String(restored)} (wanted ${beforeTheme})`,
    );
    process.exitCode = 1;
  }
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
