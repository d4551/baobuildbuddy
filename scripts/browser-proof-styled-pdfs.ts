/**
 * Fail-closed headed proof: export every resume/cover-letter/portfolio PDF style,
 * open each file in Chromium's PDF viewer, screenshot non-fake styled pages.
 * Asserts real %PDF- magic + pairwise-distinct content hashes per template.
 */
import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, type Browser, type Page } from "playwright";
import {
  COVER_LETTER_TEMPLATE_OPTIONS,
  type CoverLetterTemplate,
} from "../packages/shared/src/constants/cover-letter";
import {
  PORTFOLIO_EXPORT_TEMPLATE_OPTIONS,
  type PortfolioExportTemplate,
} from "../packages/shared/src/constants/export-document-theme";
import {
  RESUME_TEMPLATE_OPTIONS,
  type ResumeTemplate,
} from "../packages/shared/src/constants/resume";
import {
  API_ENDPOINTS,
  buildCoverLetterDetailEndpoint,
  buildCoverLetterExportEndpoint,
  buildResumeDetailEndpoint,
  buildResumeExportEndpoint,
} from "../packages/shared/src/constants/endpoints";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import {
  COUNT_FIVE_HUNDRED,
  MS_EIGHT_HUNDRED,
  MS_ONE_AND_HALF_SECONDS,
  MS_ONE_TWO_HUNDRED,
  MS_TWO_SECONDS,
} from "./constants/numeric-literals";
import { writeError, writeOutput } from "./utils/cli-output";
import { assertRealPdfFile } from "./utils/live-pdf-assert";
import { settlePage } from "./utils/playwright-settle";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const API_BASE = (process.env.PAGE_PROOF_API_BASE ?? "http://127.0.0.1:3000").replace(/\/$/u, "");
const OUT =
  process.env.STYLED_PDF_PROOF_OUT ?? "/opt/cursor/artifacts/baseline/styled-pdfs";

const wait = settlePage;
const RE_EDIT_RESUME = /Edit resume/i;
const RE_CREATE_ARIA = /^Create a new resume$/i;
const RE_CREATE_SUBMIT = /^Create resume$/i;
const RE_FULL_NAME = /Full Name|Name/i;
const RE_SAVE = /^Save$/i;
const RE_OPEN_COVER = /Open cover-letter generation dialog|Edit cover letter/i;
const RE_COVER_GENERATE = /^Generate cover letter$/i;
const RE_TARGET_COMPANY = /Target company/i;
const RE_TARGET_POSITION = /Target position/i;
const RE_OPEN_PROJECT = /Open project creation dialog/i;
const RE_PROJECT_TITLE = /Project title/i;
const RE_PROJECT_DESCRIPTION = /Project description/i;
const RE_TECH_INPUT = /Technology input/i;
const RE_ADD_TECH = /Add technology to project/i;
const RE_SAVE_PROJECT = /Save project changes/i;
const COVER_DETAIL_URL = /\/cover-letter\/[^/]+/u;

type PdfStyleResult = {
  readonly kind: "resume" | "cover-letter" | "portfolio";
  readonly template: string;
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly viewerShot: string;
};

const sha256File = async (path: string): Promise<string> => {
  const bytes = Buffer.from(await Bun.file(path).arrayBuffer());
  return createHash("sha256").update(bytes).digest("hex");
};

const apiJson = async <T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: T }> => {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const parsed = text.length > 0 ? (JSON.parse(text) as T) : ({} as T);
  return { status: response.status, body: parsed };
};

const downloadPdf = async (path: string, body: unknown, outFile: string): Promise<string> => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`PDF export failed ${path} status=${String(response.status)}`);
  }
  const target = join(OUT, "downloads", outFile);
  await Bun.write(target, Buffer.from(await response.arrayBuffer()));
  return target;
};

const screenshotPdfInChrome = async (
  browser: Browser,
  pdfPath: string,
  shotName: string,
): Promise<string> => {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
  const fileUrl = pathToFileURL(pdfPath).href;
  await page.goto(fileUrl, { waitUntil: "load", timeout: 60_000 });
  await settlePage(page, MS_ONE_AND_HALF_SECONDS);
  const shotPath = join(OUT, "stills", `${shotName}.png`);
  await page.screenshot({ path: shotPath, fullPage: false });
  await page.close();
  return shotPath;
};

const ensureResumeId = async (page: Page): Promise<string> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resume}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  const edit = page.getByRole("button", { name: RE_EDIT_RESUME }).first();
  if ((await edit.count()) > 0 && (await edit.isVisible())) {
    await edit.click();
    await wait(page, MS_ONE_TWO_HUNDRED);
  } else {
    await page.getByRole("button", { name: RE_CREATE_ARIA }).click();
    await wait(page, MS_EIGHT_HUNDRED);
    const name = page.getByLabel(RE_FULL_NAME).first();
    if ((await name.count()) > 0) {
      await name.fill("Bao Style Proof");
    }
    await page.getByRole("button", { name: RE_CREATE_SUBMIT }).click();
    await wait(page, MS_ONE_AND_HALF_SECONDS);
    const save = page.getByRole("button", { name: RE_SAVE }).first();
    if ((await save.count()) > 0) {
      await save.click();
      await wait(page, MS_ONE_AND_HALF_SECONDS);
    }
  }
  await page.screenshot({ path: join(OUT, "stills", "00-resume-editor.png") });
  const list = await apiJson<{ id?: string }[] | { data?: { id?: string }[] }>(
    "GET",
    API_ENDPOINTS.resumes,
  );
  const resumes = Array.isArray(list.body)
    ? list.body
    : Array.isArray((list.body as { data?: { id?: string }[] }).data)
      ? (list.body as { data: { id?: string }[] }).data
      : [];
  const id = resumes[0]?.id;
  if (!id) {
    throw new Error("No resume id after UI ensure");
  }
  return id;
};

const ensureCoverLetterId = async (page: Page): Promise<string> => {
  const existing = await apiJson<{ id?: string }[] | { data?: { id?: string }[] }>(
    "GET",
    API_ENDPOINTS.coverLetters,
  );
  const letters = Array.isArray(existing.body)
    ? existing.body
    : Array.isArray((existing.body as { data?: { id?: string }[] }).data)
      ? (existing.body as { data: { id?: string }[] }).data
      : [];
  let id = letters[0]?.id;
  if (!id) {
    const created = await apiJson<{ id?: string; coverLetter?: { id?: string } }>(
      "POST",
      API_ENDPOINTS.coverLetters,
      {
        company: "Riot Games",
        position: "Gameplay Engineer",
        template: "professional",
        content: {
          opening:
            "I am excited to apply for the Gameplay Engineer role at Riot Games and bring systems craft to player-facing combat.",
          body: "I have shipped networked gameplay features, profiling tools, and live-ops hooks used by production teams across multiple titles.",
          closing: "I would welcome the chance to discuss how I can contribute to your next ship.",
        },
      },
    );
    id = created.body.id ?? created.body.coverLetter?.id;
  }
  if (!id) {
    throw new Error("Cover letter id missing after create");
  }
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.coverLetter}/${id}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  await page.screenshot({ path: join(OUT, "stills", "00-cover-letter-detail.png") });
  return id;
};

const ensurePortfolioProject = async (page: Page): Promise<void> => {
  const portfolio = await apiJson<{
    projects?: Array<{ id?: string }>;
  }>("GET", API_ENDPOINTS.portfolio);
  const projectCount = portfolio.body.projects?.length ?? 0;
  if (projectCount === 0) {
    const created = await apiJson("POST", API_ENDPOINTS.portfolioProjects, {
      title: "Bao Style Showcase",
      description:
        "Styled portfolio PDF proof project with networked combat systems and live-ops tooling.",
      technologies: ["TypeScript", "Playwright"],
      featured: true,
      role: "Gameplay Engineer",
    });
    if (created.status >= 400) {
      throw new Error(`Portfolio project create failed status=${String(created.status)}`);
    }
  }
  const nav = await settle(
    page.goto(`${CLIENT_BASE}${APP_ROUTES.portfolio}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    }),
  );
  if (nav.status === "rejected") {
    await page.goto(`${CLIENT_BASE}${APP_ROUTES.portfolio}`, {
      waitUntil: "load",
      timeout: 60_000,
    });
  }
  await wait(page, MS_ONE_AND_HALF_SECONDS);
  await page.screenshot({ path: join(OUT, "stills", "00-portfolio-ready.png") });
};

const enrichResumeContent = async (resumeId: string): Promise<void> => {
  const put = await apiJson("PUT", buildResumeDetailEndpoint(resumeId), {
    name: "Bao Style Proof CV",
    personalInfo: {
      name: "Bao Style Proof",
      email: "bao.proof@example.com",
      phone: "+1-555-0100",
      location: "Remote / Los Angeles",
      github: "https://github.com/baobuildbuddy",
      portfolio: "https://bao.example.com",
    },
    summary:
      "Gameplay engineer shipping networked combat systems, live-ops tooling, and player-facing polish for competitive multiplayer titles.",
    experience: [
      {
        company: "Indie Ship Studio",
        title: "Senior Gameplay Engineer",
        startDate: "2021-03",
        endDate: "Present",
        description:
          "Owned combat netcode, ability systems, and telemetry dashboards used across two shipped titles and a live service season pipeline.",
        achievements: [
          "Cut rollback desync incidents by 40% with deterministic simulation fixes",
          "Built tooling for designers to author combat curves without engineering gates",
        ],
      },
      {
        company: "Prototype Lab",
        title: "Gameplay Engineer",
        startDate: "2018-06",
        endDate: "2021-02",
        description:
          "Prototyped multiplayer dungeon crawlers and shipped vertical slices with Unreal/Unity hybrid pipelines.",
      },
    ],
    skills: {
      technical: ["TypeScript", "C++", "Unreal", "Unity", "Playwright"],
      soft: ["Systems design", "Mentorship", "Live ops collaboration"],
    },
    education: [
      {
        school: "State University",
        degree: "B.S. Computer Science",
        field: "Computer Science",
        year: "2018",
      },
    ],
  });
  if (put.status >= 400) {
    throw new Error(
      `Enrich resume failed status=${String(put.status)} body=${JSON.stringify(put.body).slice(0, 240)}`,
    );
  }
};

const proveResumeStyles = async (
  browser: Browser,
  resumeId: string,
): Promise<PdfStyleResult[]> => {
  await enrichResumeContent(resumeId);
  const results: PdfStyleResult[] = [];
  for (const template of RESUME_TEMPLATE_OPTIONS) {
    const put = await apiJson("PUT", buildResumeDetailEndpoint(resumeId), { template });
    if (put.status >= 400) {
      throw new Error(`PUT resume template ${template} failed status=${String(put.status)}`);
    }
    const pdfPath = await downloadPdf(
      buildResumeExportEndpoint(resumeId),
      { format: "pdf", template },
      `resume-${template}.pdf`,
    );
    const assertion = await assertRealPdfFile(pdfPath);
    if (!assertion.ok) {
      throw new Error(`Resume PDF fake/invalid for template=${template}`);
    }
    const hash = await sha256File(pdfPath);
    const viewerShot = await screenshotPdfInChrome(browser, pdfPath, `resume-${template}-viewer`);
    results.push({
      kind: "resume",
      template,
      path: pdfPath,
      bytes: assertion.bytes,
      sha256: hash,
      viewerShot,
    });
    await writeOutput(`resume style ${template} bytes=${String(assertion.bytes)} sha=${hash.slice(0, 12)}`);
  }
  return results;
};

const proveCoverLetterStyles = async (
  browser: Browser,
  coverLetterId: string,
): Promise<PdfStyleResult[]> => {
  const results: PdfStyleResult[] = [];
  for (const template of COVER_LETTER_TEMPLATE_OPTIONS) {
    const put = await apiJson("PUT", buildCoverLetterDetailEndpoint(coverLetterId), { template });
    if (put.status >= 400) {
      throw new Error(`PUT cover template ${template} failed status=${String(put.status)}`);
    }
    const pdfPath = await downloadPdf(
      buildCoverLetterExportEndpoint(coverLetterId),
      { format: "pdf" },
      `cover-${template}.pdf`,
    );
    const assertion = await assertRealPdfFile(pdfPath);
    if (!assertion.ok) {
      throw new Error(`Cover PDF fake/invalid for template=${template}`);
    }
    const hash = await sha256File(pdfPath);
    const viewerShot = await screenshotPdfInChrome(browser, pdfPath, `cover-${template}-viewer`);
    results.push({
      kind: "cover-letter",
      template,
      path: pdfPath,
      bytes: assertion.bytes,
      sha256: hash,
      viewerShot,
    });
    await writeOutput(`cover style ${template} bytes=${String(assertion.bytes)} sha=${hash.slice(0, 12)}`);
  }
  return results;
};

const provePortfolioStyles = async (browser: Browser): Promise<PdfStyleResult[]> => {
  const results: PdfStyleResult[] = [];
  for (const template of PORTFOLIO_EXPORT_TEMPLATE_OPTIONS) {
    const pdfPath = await downloadPdf(
      `${API_ENDPOINTS.portfolio}/export`,
      { format: "pdf", template },
      `portfolio-${template}.pdf`,
    );
    const assertion = await assertRealPdfFile(pdfPath);
    if (!assertion.ok) {
      throw new Error(`Portfolio PDF fake/invalid for template=${template}`);
    }
    const hash = await sha256File(pdfPath);
    const viewerShot = await screenshotPdfInChrome(
      browser,
      pdfPath,
      `portfolio-${template}-viewer`,
    );
    results.push({
      kind: "portfolio",
      template,
      path: pdfPath,
      bytes: assertion.bytes,
      sha256: hash,
      viewerShot,
    });
    await writeOutput(
      `portfolio style ${template} bytes=${String(assertion.bytes)} sha=${hash.slice(0, 12)}`,
    );
  }
  return results;
};

const assertDistinctHashes = (label: string, results: readonly PdfStyleResult[]): void => {
  const hashes = new Set(results.map((entry) => entry.sha256));
  if (hashes.size !== results.length) {
    throw new Error(
      `${label} PDF styles are not distinct — got ${String(hashes.size)} unique of ${String(results.length)} (fake/identical templates)`,
    );
  }
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  await mkdir(join(OUT, "downloads"), { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-dev-shm-usage", "--allow-file-access-from-files"],
  });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  const resumeId = await ensureResumeId(page);
  const coverLetterId = await ensureCoverLetterId(page);
  await ensurePortfolioProject(page);

  const resumeStyles = await proveResumeStyles(browser, resumeId);
  const coverStyles = await proveCoverLetterStyles(browser, coverLetterId);
  const portfolioStyles = await provePortfolioStyles(browser);

  assertDistinctHashes("resume", resumeStyles);
  assertDistinctHashes("cover-letter", coverStyles);
  assertDistinctHashes("portfolio", portfolioStyles);

  await context.close();
  await browser.close();

  const report = {
    ok: true,
    mode: "chrome-pdf-viewer+api-export",
    resumeTemplates: RESUME_TEMPLATE_OPTIONS as readonly ResumeTemplate[],
    coverLetterTemplates: COVER_LETTER_TEMPLATE_OPTIONS as readonly CoverLetterTemplate[],
    portfolioTemplates: PORTFOLIO_EXPORT_TEMPLATE_OPTIONS as readonly PortfolioExportTemplate[],
    resumeStyles,
    coverStyles,
    portfolioStyles,
  };
  await Bun.write(join(OUT, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeOutput(
    `browser-proof-styled-pdfs OK resumes=${String(resumeStyles.length)} covers=${String(coverStyles.length)} portfolios=${String(portfolioStyles.length)} → ${OUT}`,
  );
};

const runResult = await settle(main());
if (runResult.status === "rejected") {
  await writeError(runResult.reason.message);
  process.exit(1);
}
