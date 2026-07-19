/**
 * Headed visual proof recorder (no curl, no headless).
 * Tours primary routes at mobile → tablet → desktop and writes WebM + stills.
 */
import { mkdir, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type ConsoleMessage } from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { writeError, writeOutput } from "./utils/cli-output";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://localhost:3001").replace(
  /\/$/u,
  "",
);
const OUT_DIR =
  process.env.BROWSER_PROOF_OUT ?? join("/opt/cursor/artifacts/baseline/browser-video-proof");

const ROUTES: readonly { readonly slug: string; readonly path: string }[] = [
  { slug: "dashboard", path: APP_ROUTES.dashboard },
  { slug: "jobs", path: APP_ROUTES.jobs },
  { slug: "resume", path: APP_ROUTES.resume },
  { slug: "interview", path: APP_ROUTES.interview },
  { slug: "skills", path: APP_ROUTES.skills },
  { slug: "studios", path: APP_ROUTES.studios },
  { slug: "ai-dashboard", path: APP_ROUTES.aiDashboard },
  { slug: "ai-chat", path: APP_ROUTES.aiChat },
  { slug: "automation", path: APP_ROUTES.automation },
  { slug: "settings", path: APP_ROUTES.settings },
  { slug: "setup", path: APP_ROUTES.setup },
];

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

const mapSequential = async <TItem>(
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

const main = async (): Promise<void> => {
  await mkdir(OUT_DIR, { recursive: true });
  const stillsDir = join(OUT_DIR, "stills");
  await mkdir(stillsDir, { recursive: true });

  const consoleErrors: string[] = [];
  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: join(OUT_DIR, "raw-segments"),
      size: { width: 1440, height: 900 },
    },
    viewport: { width: 1440, height: 900 },
  });
  await mkdir(join(OUT_DIR, "raw-segments"), { recursive: true });

  const page = await context.newPage();
  page.on("console", (message: ConsoleMessage) => {
    if (message.type() === "error") {
      consoleErrors.push(`[${new Date().toISOString()}] ${message.text().slice(0, 240)}`);
    }
  });
  page.on("pageerror", (error: Error) => {
    consoleErrors.push(`[pageerror] ${error.message.slice(0, 240)}`);
  });

  await mapSequential(VIEWPORTS, async (viewport) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(400);
    await mapSequential(ROUTES, async (route) => {
      await page.goto(`${CLIENT_BASE}${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      await page.waitForTimeout(1_400);
      // Theme proof once per viewport (label.swap — not the hidden checkbox alone).
      if (route.slug === "dashboard") {
        const beforeTheme = await page.evaluate(
          () =>
            document.querySelector("[data-theme]")?.getAttribute("data-theme") ??
            document.documentElement.getAttribute("data-theme"),
        );
        await page.locator("label.swap").first().click({ timeout: 5_000 });
        await page.waitForTimeout(500);
        const afterTheme = await page.evaluate(
          () =>
            document.querySelector("[data-theme]")?.getAttribute("data-theme") ??
            document.documentElement.getAttribute("data-theme"),
        );
        await writeOutput(`theme ${viewport.name}: ${String(beforeTheme)} → ${String(afterTheme)}`);
        if (!beforeTheme || !afterTheme || beforeTheme === afterTheme) {
          await writeError(`Theme failed to flip on ${viewport.name}`);
          process.exitCode = 1;
        }
        // Flip back so subsequent pages stay on default light for visual consistency.
        await page.locator("label.swap").first().click({ timeout: 5_000 });
        await page.waitForTimeout(300);
      }

      // Safe interaction: skip Save/Delete/Submit/Clear destructive actions.
      const clicked = await page.evaluate(() => {
        const main = document.querySelector("main");
        if (!main) {
          return false;
        }
        const banned = /save|delete|submit|clear|remove|revoke|reset/i;
        const button = Array.from(main.querySelectorAll("button")).find((candidate) => {
          if (!(candidate instanceof HTMLButtonElement)) {
            return false;
          }
          if (candidate.disabled || candidate.classList.contains("absolute")) {
            return false;
          }
          const label = `${candidate.getAttribute("aria-label") ?? ""} ${candidate.textContent ?? ""}`;
          if (banned.test(label)) {
            return false;
          }
          const style = window.getComputedStyle(candidate);
          return style.display !== "none" && style.visibility !== "hidden";
        });
        if (!button) {
          return false;
        }
        button.scrollIntoView({ block: "center" });
        button.click();
        return true;
      });
      await page.waitForTimeout(400);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);

      const hasDevtools = await page.evaluate(() => {
        const el = document.getElementById("nuxt-devtools-container");
        if (!el) {
          return false;
        }
        const style = window.getComputedStyle(el);
        return style.display !== "none" && style.visibility !== "hidden" && el.childElementCount > 0;
      });
      if (hasDevtools) {
        await writeError(`Nuxt DevTools HUD still visible on ${viewport.name}/${route.slug}`);
        process.exitCode = 1;
      }
      await page.screenshot({
        path: join(stillsDir, `${viewport.name}-${route.slug}.png`),
        fullPage: false,
      });
      await writeOutput(
        `shot ${viewport.name}/${route.slug} click=${String(clicked)} consoleErrors=${String(consoleErrors.length)}`,
      );
    });
  });

  const video = page.video();
  await context.close();
  await browser.close();

  let videoPath: string | null = null;
  if (video) {
    videoPath = await video.path();
  }

  // Copy/rename primary segment to a stable artifact name when present.
  const segmentsDir = join(OUT_DIR, "raw-segments");
  const segmentNames = await readdir(segmentsDir);
  const webm = segmentNames.find((name) => name.endsWith(".webm"));
  const stableVideo = join(OUT_DIR, "ui-visual-proof-mobile-tablet-desktop.webm");
  if (webm) {
    const source = join(segmentsDir, webm);
    await Bun.write(stableVideo, Bun.file(source));
    videoPath = stableVideo;
  }

  const stillCount = (await readdir(stillsDir)).filter((name) => name.endsWith(".png")).length;
  const videoStats = videoPath ? await stat(videoPath) : null;
  const report = {
    CLIENT_BASE,
    headless: false,
    display: process.env.DISPLAY ?? null,
    viewports: VIEWPORTS.map((viewport) => viewport.name),
    routes: ROUTES.map((route) => route.path),
    stillCount,
    videoPath,
    videoBytes: videoStats?.size ?? 0,
    consoleErrorCount: consoleErrors.length,
    consoleErrors: consoleErrors.slice(0, 40),
  };
  await Bun.write(join(OUT_DIR, "proof-report.json"), JSON.stringify(report, null, 2));

  await writeOutput(
    `browser-record-visual-proof: stills=${String(stillCount)} video=${videoPath ?? "none"} bytes=${String(report.videoBytes)} consoleErrors=${String(consoleErrors.length)}`,
  );
  if (!videoPath || report.videoBytes < 10_000) {
    await writeError("Video proof missing or too small — headed recording failed.");
    process.exitCode = 1;
  }
  if (consoleErrors.some((line) => line.includes("TypeError") || line.includes("500"))) {
    await writeError("Console contains TypeError/500 during headed tour.");
    process.exitCode = 1;
  }
};

await main();
