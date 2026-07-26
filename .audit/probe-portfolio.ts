import { chromium } from "playwright";

const BASE = process.env.PROBE_BASE ?? "http://127.0.0.1:3001";
const SEQUENCE = ["/", "/jobs", "/resume", "/resume/build", "/resume/preview", "/cover-letter", "/portfolio", "/portfolio/preview"];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 320, height: 720 } });
const bucket: string[] = [];
page.on("console", (msg) => {
  if (msg.type() === "error") bucket.push(msg.text());
});
page.on("pageerror", (error: Error) => bucket.push("PAGEERROR: " + error.message));

for (const route of SEQUENCE) {
  bucket.length = 0;
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.locator("body").waitFor({ state: "visible", timeout: 600 });
  await page.waitForTimeout(600);
  if (route === "/portfolio/preview") {
    console.log("AT_PREVIEW_ERRORS", JSON.stringify(bucket));
    await page.waitForTimeout(2500);
    console.log("LATE_PREVIEW_ERRORS", JSON.stringify(bucket));
  } else {
    console.log("VISITED", route, "errors=" + String(bucket.length));
  }
}
await browser.close();
