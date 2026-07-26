import { chromium } from "playwright";

const BASE = process.env.PROBE_BASE ?? "http://127.0.0.1:3101";
const collectHrefs = (): string[] => {
  const anchors = Array.from(document.querySelectorAll("a[href]"));
  const paths = anchors
    .map((anchor) => anchor.getAttribute("href") ?? "")
    .filter((href) => href.startsWith("/") && !href.startsWith("//"));
  return [...new Set(paths)];
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("CONSOLE_ERROR", msg.text().slice(0, 200));
});

await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.locator("body").waitFor({ state: "visible", timeout: 1500 });
const earlyHrefs = await page.evaluate(collectHrefs);
console.log("EARLY_HREFS", JSON.stringify(earlyHrefs));
await page.waitForTimeout(4000);
const lateHrefs = await page.evaluate(collectHrefs);
console.log("LATE_HREFS", JSON.stringify(lateHrefs));

const targets = [...new Set([...earlyHrefs, ...lateHrefs])].filter(
  (href) => href.startsWith("/ai") || href.startsWith("/automation"),
);
console.log("TARGETS", JSON.stringify(targets));

for (const href of targets) {
  await page.goto(`${BASE}${href}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.locator("body").waitFor({ state: "visible", timeout: 2000 });
  await page.waitForTimeout(2500);
  const state = await page.evaluate(() => {
    const dock = document.querySelector("nav.dock");
    if (!dock) return { dock: false as const, path: location.pathname };
    const links = Array.from(dock.querySelectorAll("a")).map((a) => ({
      href: a.getAttribute("href"),
      active: a.classList.contains("dock-active") || a.getAttribute("aria-current") === "page",
    }));
    return { dock: true as const, path: location.pathname, links };
  });
  console.log("ROUTE", href, JSON.stringify(state));
}

await browser.close();
