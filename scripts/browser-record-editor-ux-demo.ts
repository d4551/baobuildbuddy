/**
 * Authentic headed video: CM6 JSON lint + cover letter editor + resume PDF.
 * UI click/type only.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { APP_ROUTE_BUILDERS, APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import { writeError, writeOutput } from "./utils/cli-output";
import { assertRealPdfFile } from "./utils/live-pdf-assert";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const OUT =
  process.env.EDITOR_UX_OUT ?? "/opt/cursor/artifacts/live-capabilities/editor-ux";

const RE_EXPORT = /Export/i;
const RE_EXPORT_PDF = /Export PDF/i;
const RE_EDIT_RESUME = /Edit resume/i;
const RE_EDIT_COVER = /Edit cover letter/i;
const RE_FIND = /^Find$/i;
const RE_GREENHOUSE_SUMMARY = /Greenhouse|Advanced collections|boards/i;

const wait = async (page: Page, ms: number): Promise<void> => {
  await page.waitForTimeout(ms);
};

const shot = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({ path: join(OUT, "stills", `${name}.png`), fullPage: false });
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  await mkdir(join(OUT, "downloads"), { recursive: true });
  await mkdir(join(OUT, "raw"), { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    acceptDownloads: true,
    recordVideo: { dir: join(OUT, "raw"), size: { width: 1440, height: 900 } },
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // 1) Settings JSON editor — open greenhouse boards, inject bad JSON via typing, see lint, fix
  await page.goto(`${CLIENT_BASE}${APP_ROUTE_BUILDERS.settingsSection("jobIntelligence")}`, {
    waitUntil: "networkidle",
  });
  await wait(page, 1_500);
  const advanced = page.locator("summary", { hasText: RE_GREENHOUSE_SUMMARY }).first();
  if ((await advanced.count()) > 0) {
    await advanced.click();
    await wait(page, 800);
  }
  await shot(page, "01-settings-json-editor");
  const cmContent = page.locator(".cm-content").first();
  if ((await cmContent.count()) > 0) {
    await cmContent.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type("{ bad json ");
    await wait(page, 800);
    await shot(page, "02-json-lint-error");
    await page.keyboard.press("Control+a");
    await page.keyboard.type("[]");
    await wait(page, 600);
    await shot(page, "03-json-lint-fixed");
  } else {
    throw new Error("AppCodeEditor (.cm-content) not mounted on Job Intelligence");
  }

  // 2) Cover letter editor — find + split preview
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.coverLetter}`, { waitUntil: "networkidle" });
  await wait(page, 1_200);
  await page.getByRole("button", { name: RE_EDIT_COVER }).first().click();
  await wait(page, 1_500);
  await shot(page, "04-cover-editor-split");
  const findBtn = page.getByRole("button", { name: RE_FIND }).first();
  if ((await findBtn.count()) > 0) {
    await findBtn.click();
    await wait(page, 500);
    await shot(page, "05-cover-find-panel");
  }
  const coverCm = page.locator(".cm-content").first();
  await coverCm.click();
  await page.keyboard.type("\n\nIndustry editor proof line.");
  await wait(page, 500);
  await shot(page, "06-cover-edited-preview");

  // 3) Resume PDF export still works
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resume}`, { waitUntil: "networkidle" });
  await wait(page, 1_000);
  await page.getByRole("button", { name: RE_EDIT_RESUME }).first().click();
  await wait(page, 1_000);
  await page.getByRole("button", { name: RE_EXPORT }).first().click();
  await wait(page, 400);
  const downloadPromise = page.waitForEvent("download", { timeout: 45_000 });
  await page.getByRole("menuitem", { name: RE_EXPORT_PDF }).first().click();
  const download = await settle(downloadPromise);
  if (download.status === "rejected") {
    throw new Error(`PDF failed: ${download.reason.message}`);
  }
  const pdfPath = join(OUT, "downloads", "editor-ux-resume.pdf");
  await download.value.saveAs(pdfPath);
  const pdf = await assertRealPdfFile(pdfPath);
  await shot(page, "07-resume-pdf");

  const video = page.video();
  await context.close();
  await browser.close();

  let videoPath: string | null = null;
  if (video) {
    const raw = await video.path();
    videoPath = join(OUT, "editor-ux-demo.webm");
    await Bun.write(videoPath, Bun.file(raw));
  }

  if (!pdf.ok || !videoPath) {
    throw new Error("Editor UX proof incomplete");
  }

  await writeFile(
    join(OUT, "report.json"),
    `${JSON.stringify({ ok: true, pdf, videoPath, cmMounted: true }, null, 2)}\n`,
  );
  await writeOutput(`browser-record-editor-ux-demo OK video=${videoPath}`);
};

const runResult = await settle(main());
if (runResult.status === "rejected") {
  await writeError(runResult.reason.message);
  process.exit(1);
}
