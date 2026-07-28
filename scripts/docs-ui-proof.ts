/**
 * Visual proof for the static docs site (bao.builders) at mobile / tablet / desktop
 * viewports. Confirms no horizontal overflow and that all OS download tabs are
 * visible without scrolling — the two regressions most likely to slip past curl.
 *
 * Usage:
 *   bun run scripts/docs-ui-proof.ts                 # serve dist/docs-site locally, then proof
 *   TARGET=https://bao.builders/ bun run scripts/docs-ui-proof.ts   # proof a live URL
 *
 * Output: artifacts/docs-ui-proof/<viewport>-downloads.png + a pass/fail summary.
 */
import { chromium } from "playwright";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = new URL("../", import.meta.url).pathname;
const DIST_ROOT = resolve(REPO_ROOT, "dist/docs-site");
const OUT = resolve(REPO_ROOT, "artifacts/docs-ui-proof");
mkdirSync(OUT, { recursive: true });

const target = process.env.TARGET;
let baseUrl: string;
let server: { stop: () => void } | null = null;

if (target) {
  baseUrl = target;
} else {
  if (!existsSync(DIST_ROOT)) {
    console.error(`No dist/docs-site at ${DIST_ROOT}. Run "bun run docs-site:bundle" first.`);
    process.exit(1);
  }
  const port = 4567;
  server = Bun.serve({
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
  baseUrl = `http://127.0.0.1:${port}/`;
}

const browser = await chromium.launch();
const ctx = await browser.newContext();
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
];
const results: string[] = [];
for (const vp of viewports) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page
    .waitForSelector('[data-platform="windows"] .card', { timeout: 10000 })
    .catch(() => {});
  await page.locator("#downloads").scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${vp.name}-downloads.png` });
  const ov = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    iw: window.innerWidth,
  }));
  const tabsVisible = await page.$$eval(".downloads-tab .tab-label", (els) =>
    els.every((e) => {
      const r = (e as HTMLElement).getBoundingClientRect();
      return r.left >= 0 && r.right <= window.innerWidth && r.width > 0;
    }),
  );
  const overflow = ov.sw > ov.iw + 1;
  results.push(`${vp.name}: overflow=${overflow} (sw=${ov.sw} iw=${ov.iw}) tabsAllVisible=${tabsVisible} ${overflow || !tabsVisible ? "FAIL" : "PASS"}`);
  await page.close();
}
await browser.close();
server?.stop();
console.log(results.join("\n"));
console.log("screenshots ->", OUT);
if (results.some((r) => r.endsWith("FAIL"))) process.exit(1);
