/**
 * Fail-closed headed proof: resume PDF export via UI download (real pdf-lib bytes).
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Download, type Page } from "playwright";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import { writeError, writeOutput } from "./utils/cli-output";
import { assertRealPdfFile } from "./utils/live-pdf-assert";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const SERVER_BASE = (process.env.PAGE_PROOF_SERVER_BASE ?? "http://127.0.0.1:3000").replace(
  /\/$/u,
  "",
);
const OUT = process.env.PDF_PROOF_OUT ?? "/opt/cursor/artifacts/live-capabilities/pdf-live";

const RE_EXPORT = /Export/i;
const RE_PDF = /PDF/i;
const RE_EDIT = /^Edit$/i;

const wait = async (page: Page, ms: number): Promise<void> => {
  await page.waitForTimeout(ms);
};

const saveDownload = async (download: Download, name: string): Promise<string> => {
  const target = join(OUT, "downloads", name);
  await download.saveAs(target);
  return target;
};

const ensureResume = async (): Promise<string> => {
  const listResponse = await fetch(`${SERVER_BASE}/api/resumes`);
  const listJson = (await listResponse.json()) as Array<{ id?: string }> | { resumes?: Array<{ id?: string }> };
  const resumes = Array.isArray(listJson) ? listJson : (listJson.resumes ?? []);
  const existingId = resumes.find((entry) => typeof entry.id === "string")?.id;
  if (existingId) {
    return existingId;
  }
  const createResponse = await fetch(`${SERVER_BASE}/api/resumes`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Live PDF Proof Resume",
      summary: "Game industry career OS proof resume for real pdf-lib export.",
    }),
  });
  const created = (await createResponse.json()) as { id?: string };
  if (!createResponse.ok || !created.id) {
    throw new Error(`resume create failed: ${JSON.stringify(created)}`);
  }
  return created.id;
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  await mkdir(join(OUT, "downloads"), { recursive: true });
  await ensureResume();

  const browser = await chromium.launch({ headless: false, args: ["--disable-dev-shm-usage"] });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resume}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 1_800);
  const editButton = page.locator("main button", { hasText: RE_EDIT }).first();
  if ((await editButton.count()) > 0) {
    await editButton.click();
    await wait(page, 1_000);
  }
  await page.getByRole("button", { name: RE_EXPORT }).first().click();
  await wait(page, 400);
  const downloadPromise = page.waitForEvent("download", { timeout: 45_000 });
  await page
    .getByRole("menuitem", { name: RE_PDF })
    .or(page.getByRole("button", { name: RE_PDF }))
    .first()
    .click();
  const downloadResult = await settle(downloadPromise);
  if (downloadResult.status === "rejected") {
    await writeError(`PDF download failed: ${downloadResult.reason.message}`);
    await page.screenshot({ path: join(OUT, "stills", "pdf-failed.png") });
    await browser.close();
    process.exit(1);
  }
  const path = await saveDownload(downloadResult.value, "resume-ui.pdf");
  const assertion = await assertRealPdfFile(path);
  await page.screenshot({ path: join(OUT, "stills", "01-pdf-exported.png") });
  await browser.close();

  if (!assertion.ok) {
    process.exit(1);
  }
  await Bun.write(
    join(OUT, "report.json"),
    `${JSON.stringify({ ok: true, pdf: assertion }, null, 2)}\n`,
  );
  await writeOutput(`browser-proof-pdf-live OK → ${OUT}`);
};

await main();
