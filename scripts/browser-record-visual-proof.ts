const NUM_240 = 240;
const NUM_400 = 400;
/**
 * Headed visual proof recorder (no curl, no headless).
 * Tours primary routes at mobile → tablet → desktop and writes WebM + stills.
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { type ConsoleMessage, chromium } from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import {
  finalizeVisualProof,
  mapSequential,
  tourRoute,
  waitForPageReady,
} from "./browser-record-visual-proof-helpers";

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

const main = async (): Promise<void> => {
  await mkdir(OUT_DIR, { recursive: true });
  const stillsDir = join(OUT_DIR, "stills");
  await mkdir(stillsDir, { recursive: true });
  await mkdir(join(OUT_DIR, "raw-segments"), { recursive: true });

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
  const page = await context.newPage();
  page.on("console", (message: ConsoleMessage) => {
    if (message.type() === "error") {
      consoleErrors.push(`[${new Date().toISOString()}] ${message.text().slice(0, NUM_240)}`);
    }
  });
  page.on("pageerror", (error: Error) => {
    consoleErrors.push(`[pageerror] ${error.message.slice(0, NUM_240)}`);
  });

  await mapSequential(VIEWPORTS, async (viewport) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await waitForPageReady(page, NUM_400);
    await mapSequential(ROUTES, async (route) => {
      await tourRoute(page, stillsDir, consoleErrors, CLIENT_BASE, viewport, route);
    });
  });

  const video = page.video();
  await context.close();
  await browser.close();
  const videoPath = video ? await video.path() : null;
  await finalizeVisualProof({
    outDir: OUT_DIR,
    stillsDir,
    clientBase: CLIENT_BASE,
    videoPath,
    consoleErrors,
    viewports: VIEWPORTS,
    routes: ROUTES,
    display: null,
  });
};

await main();
