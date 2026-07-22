#!/usr/bin/env bun
/**
 * Headed visual + binary proof for resume / cover-letter / portfolio exports.
 * Creates entities via API, downloads PDF/DOCX, validates signatures, then
 * opens UI pages and exercises AppExportMenu with screenshots + one UI download.
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Download, type Locator, type Page, type Response } from "playwright";
import {
  API_ENDPOINTS,
  buildCoverLetterExportEndpoint,
  buildResumeExportEndpoint,
} from "../packages/shared/src/constants/endpoints";
import { HTTP_STATUS_CREATED, HTTP_STATUS_OK } from "../packages/shared/src/constants/http";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { safeParseJson } from "../packages/shared/src/utils/json";
import { settle } from "../packages/shared/src/utils/promise";
import {
  COUNT_FOUR,
  COUNT_TWO,
  COUNT_TWO_HUNDRED,
  MS_ONE_HUNDRED,
} from "./constants/numeric-literals";
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
const MAIN_WAIT_MS = 30_000;
const EXPAND_POLL_ATTEMPTS = 20;
const PDF_HEADER_BYTES = COUNT_FOUR;
const ERROR_SNIPPET_LENGTH = COUNT_TWO_HUNDRED;

const PDF_MAGIC = "%PDF";
const DOCX_MAGIC_0 = 0x50;
const DOCX_MAGIC_1 = 0x4b;
const EXPORT_LABEL_PATTERN = /export/iu;
const PDF_MENU_PATTERN = /pdf/iu;
const DOCX_MENU_PATTERN = /docx/iu;
const EXPORT_PATH_PATTERN = /\/export/u;

type ProofRow = {
  surface: string;
  format: "pdf" | "docx";
  ok: boolean;
  bytes: number;
  path?: string;
  reason?: string;
};

type UiProofRow = {
  slug: string;
  ok: boolean;
  reason?: string;
  downloadBytes?: number;
};

type UiSurface = {
  slug: string;
  route: string;
  downloadPdf: boolean;
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
  const parsed = safeParseJson(raw);
  if (parsed === null) {
    throw new Error(
      `${method} ${path} non-JSON (${String(response.status)}): ${raw.slice(0, ERROR_SNIPPET_LENGTH)}`,
    );
  }
  return { status: response.status, body: parsed as T, raw };
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
  if (bytes.length < PDF_HEADER_BYTES) {
    return false;
  }
  return String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === PDF_MAGIC;
};

const isDocxZip = (bytes: Uint8Array): boolean =>
  bytes.length >= COUNT_TWO && bytes[0] === DOCX_MAGIC_0 && bytes[1] === DOCX_MAGIC_1;

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
  const ok = result.status === HTTP_STATUS_OK && result.bytes.length > 0 && magicOk;
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
  if (resume.status !== HTTP_STATUS_CREATED) {
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
  if (cover.status !== HTTP_STATUS_CREATED || !cover.body.id) {
    throw new Error(`cover letter create failed: ${String(cover.status)}`);
  }

  const portfolioGet = await apiJson<{ id: string }>("GET", API_ENDPOINTS.portfolio);
  if (portfolioGet.status !== HTTP_STATUS_OK) {
    throw new Error(`portfolio get failed: ${String(portfolioGet.status)}`);
  }
  const portfolioPut = await apiJson("PUT", API_ENDPOINTS.portfolio, {
    metadata: {
      title: "Alex Rivera Portfolio",
      summary: "Selected shipped work across combat and tools.",
      tagline: "Gameplay systems that ship",
    },
  });
  if (portfolioPut.status !== HTTP_STATUS_OK) {
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

const expectExpanded = async (trigger: Locator): Promise<void> => {
  const poll = async (attempt: number): Promise<void> => {
    if (attempt >= EXPAND_POLL_ATTEMPTS) {
      return;
    }
    const expanded = await trigger.getAttribute("aria-expanded");
    if (expanded === "true") {
      return;
    }
    await Bun.sleep(MS_ONE_HUNDRED);
    await poll(attempt + 1);
  };
  await poll(0);
};

const isExportPostOk = (response: Response): boolean =>
  response.request().method() === "POST" &&
  EXPORT_PATH_PATTERN.test(response.url()) &&
  response.status() === HTTP_STATUS_OK;

const readDownloadBytes = async (
  download: Download | null,
  exportResponse: Response,
  filePath: string,
): Promise<Uint8Array> => {
  if (download) {
    await download.saveAs(filePath);
    return new Uint8Array(await Bun.file(filePath).arrayBuffer());
  }
  const bytes = new Uint8Array(await exportResponse.body());
  await Bun.write(filePath, bytes);
  return bytes;
};

const downloadPdfFromMenu = async (
  page: Page,
  pdfItem: Locator,
  slug: string,
): Promise<{ ok: boolean; reason?: string; downloadBytes?: number }> => {
  const exportResponsePromise = page.waitForResponse(isExportPostOk, {
    timeout: MENU_TIMEOUT_MS,
  });
  const downloadPromise = page.waitForEvent("download", { timeout: MENU_TIMEOUT_MS });
  await pdfItem.click();
  const exportSettled = await settle(exportResponsePromise);
  const downloadSettled = await settle(downloadPromise);
  if (exportSettled.status === "rejected") {
    return {
      ok: false,
      reason: `ui pdf download failed: ${exportSettled.reason.message}`,
    };
  }
  const filePath = join(OUT_DIR, `${slug}-ui-download.pdf`);
  const download =
    downloadSettled.status === "fulfilled" ? downloadSettled.value : null;
  const bytes = await readDownloadBytes(download, exportSettled.value, filePath);
  if (!isPdf(bytes)) {
    return {
      ok: false,
      reason: "ui pdf download failed magic check",
      downloadBytes: bytes.length,
    };
  }
  return { ok: true, downloadBytes: bytes.length };
};

const openExportMenuAndShot = async (
  page: Page,
  route: string,
  slug: string,
  options?: { downloadPdf?: boolean },
): Promise<UiProofRow> => {
  await page.goto(`${CLIENT_BASE}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: NAV_TIMEOUT_MS,
  });
  await page.locator("main").waitFor({ state: "visible", timeout: MAIN_WAIT_MS });

  const trigger = page
    .locator('button[aria-haspopup="menu"]')
    .filter({ hasText: EXPORT_LABEL_PATTERN })
    .first();
  const visibleResult = await settle(trigger.isVisible());
  const visible = visibleResult.status === "fulfilled" && visibleResult.value;
  if (!visible) {
    await page.screenshot({
      path: join(OUT_DIR, `${slug}-missing-export.png`),
      fullPage: true,
    });
    return { slug, ok: false, reason: "export menu trigger not visible" };
  }

  await trigger.click();
  await expectExpanded(trigger);

  const pdfItem = page.getByRole("menuitem", { name: PDF_MENU_PATTERN }).first();
  const docxItem = page.getByRole("menuitem", { name: DOCX_MENU_PATTERN }).first();
  await settle(pdfItem.waitFor({ state: "visible", timeout: MENU_TIMEOUT_MS }));
  const pdfVisible = await settle(pdfItem.isVisible());
  const docxVisible = await settle(docxItem.isVisible());
  const menuOk =
    pdfVisible.status === "fulfilled" &&
    pdfVisible.value &&
    docxVisible.status === "fulfilled" &&
    docxVisible.value;

  await page.screenshot({
    path: join(OUT_DIR, `${slug}-menu-open.png`),
    fullPage: true,
  });

  if (!menuOk) {
    return { slug, ok: false, reason: "pdf/docx menuitems missing" };
  }

  if (!options?.downloadPdf) {
    return { slug, ok: true };
  }

  const downloadResult = await downloadPdfFromMenu(page, pdfItem, slug);
  return { slug, ...downloadResult };
};

const runUiSurfaces = async (
  page: Page,
  surfaces: readonly UiSurface[],
): Promise<UiProofRow[]> => {
  const [head, ...tail] = surfaces;
  if (!head) {
    return [];
  }
  const first = await openExportMenuAndShot(page, head.route, head.slug, {
    downloadPdf: head.downloadPdf,
  });
  const rest = await runUiSurfaces(page, tail);
  return [first, ...rest];
};

const persistBinaryExports = async (
  rows: ProofRow[],
  resumeId: string,
  coverLetterId: string,
): Promise<void> => {
  await saveExport(rows, "resume", "pdf", buildResumeExportEndpoint(resumeId), {
    format: "pdf",
  });
  await saveExport(rows, "resume", "docx", buildResumeExportEndpoint(resumeId), {
    format: "docx",
  });
  await saveExport(rows, "cover-letter", "pdf", buildCoverLetterExportEndpoint(coverLetterId), {
    format: "pdf",
  });
  await saveExport(rows, "cover-letter", "docx", buildCoverLetterExportEndpoint(coverLetterId), {
    format: "docx",
  });
  await saveExport(rows, "portfolio", "pdf", `${API_ENDPOINTS.portfolio}/export`, {
    format: "pdf",
  });
  await saveExport(rows, "portfolio", "docx", `${API_ENDPOINTS.portfolio}/export`, {
    format: "docx",
  });
};

const main = async (): Promise<void> => {
  await mkdir(OUT_DIR, { recursive: true });
  const rows: ProofRow[] = [];
  const { resumeId, coverLetterId } = await seedEntities();
  await persistBinaryExports(rows, resumeId, coverLetterId);

  const hasDisplay = Boolean(process.env.DISPLAY && process.env.DISPLAY.length > 0);
  const forceHeadless = process.env.PAGE_PROOF_HEADLESS === "true";
  const browser = await chromium.launch(
    !forceHeadless && hasDisplay
      ? { headless: false, channel: "chrome" }
      : { headless: true },
  );
  const page = await browser.newPage({ viewport: VIEWPORT, acceptDownloads: true });

  const surfaces: readonly UiSurface[] = [
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
  ];
  const uiRows = await runUiSurfaces(page, surfaces);
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
