/**
 * Visual proof for the static docs site (bao.builders) at mobile / tablet / desktop
 * viewports. Confirms no horizontal overflow and that all OS download tabs are
 * visible without scrolling — the two regressions most likely to slip past curl.
 *
 * Usage:
 *   bun run scripts/docs-ui-proof.ts                              # serve dist/docs-site locally, then proof
 *   TARGET=https://bao.builders/ bun run scripts/docs-ui-proof.ts  # proof a live URL
 *
 * Output: <out>/<viewport>-downloads.png + a PASS/FAIL summary.
 */
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright";
import { writeError, writeOutput } from "./utils/cli-output";
import { artifactDir, resolveProofEnv, resolveProofOutDir } from "./utils/proof-script-env";

const NUM_1 = 1;
const NUM_4567 = 4567;
const NUM_10_000 = 10_000;
const NUM_800 = 800;
const NUM_844 = 844;
const NUM_1024 = 1024;
const NUM_1280 = 1280;
const NUM_390 = 390;
const NUM_768 = 768;

const REPO_ROOT = new URL("../", import.meta.url).pathname;
const DIST_ROOT = resolve(REPO_ROOT, "dist/docs-site");
const OUT_DIR = resolveProofOutDir("DOCS_UI_PROOF_OUT", artifactDir("docs-ui-proof"));
const TARGET = resolveProofEnv("TARGET");
const CARD_SELECTOR = '[data-platform="windows"] .card';

type Viewport = { readonly name: string; readonly width: number; readonly height: number };

const VIEWPORTS: readonly Viewport[] = [
  { name: "mobile", width: NUM_390, height: NUM_844 },
  { name: "tablet", width: NUM_768, height: NUM_1024 },
  { name: "desktop", width: NUM_1280, height: NUM_800 },
] as const;

type ViewportProof = {
  readonly viewport: string;
  readonly overflow: boolean;
  readonly documentScrollWidth: number;
  readonly innerWidth: number;
  readonly tabsAllVisible: boolean;
  readonly ok: boolean;
};

const mapSequential = async <Item, Result>(
  items: readonly Item[],
  mapper: (item: Item, index: number) => Promise<Result>,
  index = 0,
): Promise<Result[]> => {
  if (index >= items.length) return [];
  const head = await mapper(items[index], index);
  const rest = await mapSequential(items, mapper, index + NUM_1);
  return [head, ...rest];
};

const startLocalServer = (port: number): { url: string; stop: () => Promise<void> } => {
  const server = Bun.serve({
    port,
    fetch(req) {
      const url = new URL(req.url);
      let path = decodeURIComponent(url.pathname);
      if (path === "/" || path === "") path = "/index.html";
      const file = `${DIST_ROOT}${path}`;
      if (!existsSync(file)) return new Response("not found", { status: 404 });
      return new Response(Bun.file(file));
    },
  });
  return { url: `http://127.0.0.1:${String(port)}/`, stop: () => server.stop() };
};

const waitForCards = async (page: Page): Promise<void> => {
  await page
    .locator(CARD_SELECTOR)
    .first()
    .waitFor({ timeout: NUM_10_000 })
    .then(() => undefined, () => undefined);
};

const proofViewport = async (
  context: BrowserContext,
  viewport: Viewport,
  baseUrl: string,
): Promise<ViewportProof> => {
  const page = await context.newPage();
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: NUM_10_000 });
  await page.locator("body").waitFor({ state: "visible", timeout: NUM_10_000 });
  await waitForCards(page);
  await page
    .locator("#downloads")
    .scrollIntoViewIfNeeded()
    .then(() => undefined, () => undefined);
  await page
    .locator(CARD_SELECTOR)
    .last()
    .waitFor({ timeout: NUM_10_000 })
    .then(() => undefined, () => undefined);
  await page.screenshot({ path: resolve(OUT_DIR, `${viewport.name}-downloads.png`) });

  const metrics = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll(".downloads-tab .tab-label"));
    const tabsAllVisible = labels.every((label) => {
      const rect = label.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= window.innerWidth && rect.width > 0;
    });
    return {
      documentScrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      tabsAllVisible,
    };
  });

  await page.close();
  const overflow = metrics.documentScrollWidth > metrics.innerWidth + NUM_1;
  return {
    viewport: viewport.name,
    overflow,
    documentScrollWidth: metrics.documentScrollWidth,
    innerWidth: metrics.innerWidth,
    tabsAllVisible: metrics.tabsAllVisible,
    ok: !overflow && metrics.tabsAllVisible,
  };
};

const main = async (): Promise<void> => {
  mkdirSync(OUT_DIR, { recursive: true });
  if (!TARGET && !existsSync(DIST_ROOT)) {
    await writeError(`No dist/docs-site at ${DIST_ROOT}. Run "bun run docs-site:bundle" first.`);
    process.exit(1);
  }
  const host = TARGET ? { url: TARGET, stop: () => Promise.resolve() } : startLocalServer(NUM_4567);
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const results = await mapSequential(VIEWPORTS, (viewport) =>
    proofViewport(context, viewport, host.url),
  );
  await browser.close();
  await host.stop();

  const lines = results.map(
    (result) =>
      `${result.viewport}: overflow=${String(result.overflow)} (sw=${String(result.documentScrollWidth)} iw=${String(result.innerWidth)}) tabsAllVisible=${String(result.tabsAllVisible)} ${result.ok ? "PASS" : "FAIL"}`,
  );
  await writeOutput(`${lines.join("\n")}\nscreenshots -> ${OUT_DIR}`);
  const failures = results.filter((result) => !result.ok);
  if (failures.length > 0) {
    await writeError(
      failures
        .map(
          (failure) =>
            `${failure.viewport}: overflow=${String(failure.overflow)} tabsAllVisible=${String(failure.tabsAllVisible)}`,
        )
        .join("\n"),
    );
    process.exitCode = 1;
  }
};

await main();
