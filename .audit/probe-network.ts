import { chromium } from "playwright";

const BASE = process.env.PROBE_BASE ?? "http://127.0.0.1:3101";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

page.on("requestfailed", (req) => {
  console.log("REQ_FAILED", req.url().slice(0, 140), req.failure()?.errorText ?? "");
});
page.on("response", (res) => {
  if (res.status() >= 400) console.log("HTTP_" + String(res.status()), res.url().slice(0, 140));
});
page.on("console", (msg) => {
  if (msg.type() === "error" || msg.type() === "warning") {
    console.log("CONSOLE", msg.type().toUpperCase(), msg.text().slice(0, 160));
  }
});

await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(4000);

const visible = await page.evaluate(() => ({
  path: location.pathname,
  text: document.body.innerText.replace(/\s+/gu, " ").slice(0, 400),
}));
console.log("VISIBLE", JSON.stringify(visible));

await browser.close();
