#!/usr/bin/env bun
/**
 * Headed visual + binary proof for resume / cover-letter / portfolio exports.
 * Creates entities via API, downloads PDF/DOCX, validates signatures, then
 * opens UI pages and exercises AppExportMenu with screenshots + one UI download.
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import {
  API_ENDPOINTS,
  buildCoverLetterExportEndpoint,
  buildResumeExportEndpoint,
} from "../packages/shared/src/constants/endpoints";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { writeError, writeOutput } from "./utils/cli-output";

const API_BASE = (process.env.PAGE_PROOF_API_BASE ?? "http://127.0.0.1:3000").replace(/\/$/u, "");
const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const OUT_DIR = process.env.EXPORT_PROOF_OUT ?? join("/opt/cursor/artifacts/exports", "proof");
const VIEWPORT = { width: 1440, height: 900 } as const;
const NAV_TIMEOUT_MS = 60_000;
const MENU_TIMEOUT_MS = 10_000;

const PDF_MAGIC = "%PDF";
const DOCX_MAGIC_0 = 0x50; // P
const DOCX_MAGIC_1 = 0x4b; // K

type ProofRow = {
  surface: string;
  format: "pdf" | "docx";
  ok: boolean;
  bytes: number;
  path?: string;
  reason?: string;
};

const apiJson = async <T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: T; raw: string }> => {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const raw = await response.text();
  let parsed: T;
  try {
    parsed = JSON.parse(raw) as T;
  } catch {
    throw new Error(`${method} ${path} non-JSON (${String(response.status)}): ${raw.slice(0, 200)}`);
  }
  return { status: response.status, body: parsed, raw };
};

const apiBinary = async (
  method: string,
  path: string,
  body: unknown,
): Promise<{ status: number; contentType: string | null; bytes: Uint8Array }> => {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const buffer = new Uint8Array(await response.arrayBuffer());
  return {
    status: response.status,
    contentType: response.headers.get("content-type"),
    bytes: buffer,
  };
};

const isPdf = (bytes: Uint8Array): boolean => {
  if (bytes.length < 4) return false;
  return String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === PDF_MAGIC;
};

const isDocxZip = (bytes: Uint8Array): boolean =>
  bytes.length >= 2 && bytes[0] === DOCX_MAGIC_0 && bytes[1] === DOCX_MAGIC_1;

const saveExport = async (
  rows: ProofRow[],
  surface: string,
  format: "pdf" | "docx",
  path: string,
  body: Record<string, unknown>,
): Promise<void> => {
  const result = await apiBinary("POST", path, body);
  const filePath = join(OUT_DIR, `${surface}.${format}`);
  const magicOk = format === "pdf" ? isPdf(result.bytes) : isDocxZip(result.bytes);
  const ok = result.status === 200 && result.bytes.length > 0 && magicOk;
  if (ok) {
    await Bun.write(filePath, result.bytes);
  }
  rows.push({
    surface,
    format,
    ok,
    bytes: result.bytes.length,
    path: ok ? filePath : undefined,
    reason: ok
      ? undefined
      : `status=${String(result.status)} type=${result.contentType ?? "none"} magic=${String(magicOk)}`,
  });
};

const seedEntities = async (): Promise<{
  resumeId: string;
  coverLetterId: string;
}> => {
  const resume = await apiJson<{ id: string }>("POST", API_ENDPOINTS.resumes, {
    name: "Export Visual Resume",
    summary: "Shipped multiplayer combat systems for AAA titles.",
    personalInfo: {
      name: "Alex Rivera",
      email: "alex.rivera@example.com",
      location: "Remote",
      github: "https://github.com/example",
    },
    experience: [
      {
        company: "Pixel Forge",
        title: "Gameplay Engineer",
        startDate: "2022-01",
        endDate: "Present",
        description: "Owned combat netcode and tools for designers.",
      },
    ],
    skills: { technical: ["C++", "Unreal Engine", "TypeScript"] },
  });
  if (resume.status !== 201) {
    throw new Error(`resume create failed: ${String(resume.status)}`);
  }

  const cover = await apiJson<{ id: string }>("POST", API_ENDPOINTS.coverLetters, {
    company: "Indie Studio",
    position: "Gameplay Engineer",
    content: {
      introduction: "Dear Hiring Manager,",
      body: "I am excited to apply for the Gameplay Engineer role at your studio.",
      conclusion: "Sincerely,",
    },
  });
  if (cover.status !== 201 || !cover.body.id) {
    throw new Error(`cover letter create failed: ${String(cover.status)}`);
  }

  const portfolioGet = await apiJson<{ id: string }>("GET", API_ENDPOINTS.portfolio);
  if (portfolioGet.status !== 200) {
    throw new Error(`portfolio get failed: ${String(portfolioGet.status)}`);
  }
  const portfolioPut = await apiJson("PUT", API_ENDPOINTS.portfolio, {
    metadata: {
      title: "Alex Rivera Portfolio",
      summary: "Selected shipped work across combat and tools.",
      tagline: "Gameplay systems that ship",
    },
  });
  if (portfolioPut.status !== 200) {
    throw new Error(`portfolio put failed: ${String(portfolioPut.status)}`);
  }

  await apiJson("POST", API_ENDPOINTS.portfolioProjects, {
    title: "Netcode Arena",
    description: "Rollback-friendly multiplayer combat prototype.",
    technologies: ["Unreal", "C++"],
    url: "https://example.com/netcode-arena",
  });

  return { resumeId: resume.body.id, coverLetterId: cover.body.id };
};

const openExportMenuAndShot = async (
  page: Page,
  route: string,
  slug: string,
  options?: { downloadPdf?: boolean },
): Promise<{ ok: boolean; reason?: string; downloadBytes?: number }> => {
  await page.goto(`${CLIENT_BASE}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: NAV_TIMEOUT_MS,
  });
  await page.locator("main").waitFor({ state: "visible", timeout: 30_000 });
  await page.waitForLoadState("networkidle").catch(() => undefined);

  const trigger = page
    .locator('button[aria-haspopup="menu"]')
    .filter({ hasText: /export/i })
    .first();
  const visible = await trigger.isVisible().catch(() => false);
  if (!visible) {
    await page.screenshot({
      path: join(OUT_DIR, `${slug}-missing-export.png`),
      fullPage: true,
    });
    return { ok: false, reason: "export menu trigger not visible" };
  }

  await trigger.click();
  await expectExpanded(trigger);

  const pdfItem = page.getByRole("menuitem", { name: /pdf/i }).first();
  const docxItem = page.getByRole("menuitem", { name: /docx/i }).first();
  await pdfItem.waitFor({ state: "visible", timeout: MENU_TIMEOUT_MS }).catch(() => undefined);
  const menuOk =
    (await pdfItem.isVisible().catch(() => false)) &&
    (await docxItem.isVisible().catch(() => false));

  await page.screenshot({
    path: join(OUT_DIR, `${slug}-menu-open.png`),
    fullPage: true,
  });

  if (!menuOk) {
    return { ok: false, reason: "pdf/docx menuitems missing" };
  }

  if (!options?.downloadPdf) {
    return { ok: true };
  }

  // UI uses blob ObjectURL + <a download>. Prefer Playwright download event
  // (response.body() can be empty after the page consumes the stream).
  const exportResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      /\/export/u.test(response.url()) &&
      response.status() === 200,
    { timeout: MENU_TIMEOUT_MS },
  );
  const downloadPromise = page.waitForEvent("download", { timeout: MENU_TIMEOUT_MS }).catch(
    () => null,
  );
  await pdfItem.click();
  try {
    const exportResponse = await exportResponsePromise;
    const download = await downloadPromise;
    const filePath = join(OUT_DIR, `${slug}-ui-download.pdf`);
    let bytes: Uint8Array;
    if (download) {
      await download.saveAs(filePath);
      bytes = new Uint8Array(await Bun.file(filePath).arrayBuffer());
    } else {
      bytes = new Uint8Array(await exportResponse.body());
      await Bun.write(filePath, bytes);
    }
    if (!isPdf(bytes)) {
      return {
        ok: false,
        reason: "ui pdf download failed magic check",
        downloadBytes: bytes.length,
      };
    }
    return { ok: true, downloadBytes: bytes.length };
  } catch (error) {
    return {
      ok: false,
      reason: `ui pdf download failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

const expectExpanded = async (trigger: ReturnType<Page["locator"]>): Promise<void> => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const expanded = await trigger.getAttribute("aria-expanded");
    if (expanded === "true") {
      return;
    }
    await Bun.sleep(100);
  }
};

const main = async (): Promise<void> => {
  await mkdir(OUT_DIR, { recursive: true });
  const rows: ProofRow[] = [];
  const uiRows: Array<{ slug: string; ok: boolean; reason?: string; downloadBytes?: number }> = [];

  const { resumeId, coverLetterId } = await seedEntities();

  await saveExport(rows, "resume", "pdf", buildResumeExportEndpoint(resumeId), {
    format: "pdf",
  });
  await saveExport(rows, "resume", "docx", buildResumeExportEndpoint(resumeId), {
    format: "docx",
  });
  await saveExport(
    rows,
    "cover-letter",
    "pdf",
    buildCoverLetterExportEndpoint(coverLetterId),
    { format: "pdf" },
  );
  await saveExport(
    rows,
    "cover-letter",
    "docx",
    buildCoverLetterExportEndpoint(coverLetterId),
    { format: "docx" },
  );
  await saveExport(rows, "portfolio", "pdf", `${API_ENDPOINTS.portfolio}/export`, {
    format: "pdf",
  });
  await saveExport(rows, "portfolio", "docx", `${API_ENDPOINTS.portfolio}/export`, {
    format: "docx",
  });

  const hasDisplay = Boolean(process.env.DISPLAY && process.env.DISPLAY.length > 0);
  const forceHeadless = process.env.PAGE_PROOF_HEADLESS === "true";
  const browser = await chromium.launch(
    !forceHeadless && hasDisplay
      ? { headless: false, channel: "chrome" }
      : { headless: true },
  );
  const page = await browser.newPage({ viewport: VIEWPORT, acceptDownloads: true });

  // Library list has no Export control — preview/detail surfaces own the menu.
  for (const entry of [
    {
      slug: "resume-preview",
      route: `${APP_ROUTES.resumePreview}?id=${encodeURIComponent(resumeId)}`,
      downloadPdf: true,
    },
    { slug: "portfolio", route: APP_ROUTES.portfolio, downloadPdf: false },
    { slug: "portfolio-preview", route: APP_ROUTES.portfolioPreview, downloadPdf: false },
    {
      slug: "cover-letter-detail",
      route: `${APP_ROUTES.coverLetter}/${encodeURIComponent(coverLetterId)}`,
      downloadPdf: false,
    },
  ] as const) {
    const result = await openExportMenuAndShot(page, entry.route, entry.slug, {
      downloadPdf: entry.downloadPdf,
    });
    uiRows.push({ slug: entry.slug, ...result });
  }

  await browser.close();

  const report = { API_BASE, CLIENT_BASE, binary: rows, ui: uiRows };
  const reportPath = join(OUT_DIR, "export-proof-report.json");
  await Bun.write(reportPath, JSON.stringify(report, null, 2));

  const binaryFails = rows.filter((row) => !row.ok);
  const uiFails = uiRows.filter((row) => !row.ok);
  await writeOutput(
    `export-proof: binary ${String(rows.length - binaryFails.length)}/${String(rows.length)} ok; ui ${String(uiRows.length - uiFails.length)}/${String(uiRows.length)} ok → ${reportPath}`,
  );
  if (binaryFails.length > 0 || uiFails.length > 0) {
    await writeError(
      [
        ...binaryFails.map(
          (fail) => `- binary ${fail.surface}.${fail.format}: ${fail.reason ?? "fail"}`,
        ),
        ...uiFails.map((fail) => `- ui ${fail.slug}: ${fail.reason ?? "fail"}`),
      ].join("\n"),
    );
    process.exitCode = 1;
  }
};

await main();
