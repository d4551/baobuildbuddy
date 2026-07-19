/**
 * Headed product proof: AI (Ollama) + PDF exports + RPA scrape.
 * No curl. No headless. Records WebM + stills + downloads.
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Download, type Page } from "playwright";
import { APP_ROUTE_BUILDERS, APP_ROUTES } from "../packages/shared/src/constants/routes";
import { settle } from "../packages/shared/src/utils/promise";
import { writeError, writeOutput } from "./utils/cli-output";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://localhost:3001").replace(
  /\/$/u,
  "",
);
const OUT =
  process.env.PRODUCT_PROOF_OUT ?? join("/opt/cursor/artifacts/baseline/product-e2e-proof");

const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

const shot = async (page: Page, name: string): Promise<void> => {
  await page.screenshot({ path: join(OUT, "stills", `${name}.png`), fullPage: false });
};

const saveDownload = async (download: Download, filename: string): Promise<string> => {
  const target = join(OUT, "downloads", filename);
  await download.saveAs(target);
  return target;
};

const configureLocalAi = async (page: Page): Promise<void> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTE_BUILDERS.settingsSection("aiProviders")}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 2_000);

  // Expand Local Model accordion if present
  const localSummary = page.locator("summary, button", { hasText: /Local Model|Local/i }).first();
  await settle(localSummary.click({ timeout: 5_000 }));
  await wait(page, 500);

  const endpoint = page.getByLabel(/endpoint|local model endpoint/i).first();
  const endpointAlt = page.locator('input[placeholder*="11434"], input[type="url"]').first();
  if ((await endpoint.count()) > 0) {
    await endpoint.fill("http://localhost:11434/v1");
  } else if ((await endpointAlt.count()) > 0) {
    await endpointAlt.fill("http://localhost:11434/v1");
  }

  const model = page.getByLabel(/model name|local model name/i).first();
  const modelAlt = page.locator('input[placeholder*="qwen"], input[placeholder*="model"]').first();
  if ((await model.count()) > 0) {
    await model.fill("qwen2.5:0.5b");
  } else if ((await modelAlt.count()) > 0) {
    await modelAlt.fill("qwen2.5:0.5b");
  }

  // Prefer Local as preferred provider if select exists
  const preferred = page.locator("select").filter({ hasText: /Local|OpenAI|Gemini/i }).first();
  if ((await preferred.count()) > 0) {
    await settle(preferred.selectOption({ label: /Local/i }));
  }

  const saveKeys = page.getByRole("button", { name: /Save.*[Kk]eys|Save providers|Save AI/i }).first();
  const saveAny = page.getByRole("button", { name: /^Save/i }).first();
  if ((await saveKeys.count()) > 0) {
    await saveKeys.click();
  } else if ((await saveAny.count()) > 0) {
    await saveAny.click();
  }
  await wait(page, 1_500);

  const testLocal = page.getByRole("button", { name: /Test.*Local|Test Local/i }).first();
  if ((await testLocal.count()) > 0 && !(await testLocal.isDisabled())) {
    await testLocal.click();
    await wait(page, 8_000);
  }
  await shot(page, "01-ai-settings-configured");
};

const proveAiChat = async (page: Page): Promise<boolean> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.aiChat}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 1_500);
  const box = page.getByRole("textbox").first();
  await box.fill("In one short sentence, what is a game designer?");
  await page.getByRole("button", { name: /Send/i }).click();
  // Wait for assistant content beyond greeting
  const ok = await page
    .waitForFunction(
      () => {
        const bubbles = [...document.querySelectorAll(".chat-bubble")];
        const texts = bubbles.map((b) => (b.textContent ?? "").trim());
        return texts.some(
          (t) =>
            t.length > 40 &&
            !t.includes("What are we moving forward today") &&
            !t.includes("hiring copilot for game industry roles. What"),
        );
      },
      { timeout: 90_000 },
    )
    .then(() => true)
    .catch(() => false);

  const provenance = await page.evaluate(() => {
    const badges = [...document.querySelectorAll(".chat-footer .badge")].map((el) =>
      (el.textContent ?? "").trim(),
    );
    return badges;
  });
  await shot(page, "02-ai-chat-response");
  await writeOutput(`AI chat ok=${String(ok)} provenance=${JSON.stringify(provenance)}`);
  return ok;
};

const provePdfExports = async (page: Page): Promise<string[]> => {
  const saved: string[] = [];
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.resume}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 1_500);
  // Open first resume via Edit
  const edit = page.locator("main button.btn-outline", { hasText: "Edit" }).first();
  if ((await edit.count()) > 0) {
    await edit.click();
    await wait(page, 1_000);
  }
  // Go preview
  const previewLink = page.getByRole("link", { name: /Preview|preview/i }).first();
  if ((await previewLink.count()) > 0) {
    await previewLink.click();
  } else {
    await page.goto(`${CLIENT_BASE}${APP_ROUTES.resumePreview}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
  }
  await wait(page, 2_000);
  await shot(page, "03-resume-preview-rich");

  const exportBtn = page.getByRole("button", { name: /Export|PDF/i }).first();
  if ((await exportBtn.count()) > 0) {
    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    // Open dropdown if needed
    await exportBtn.click();
    const pdfItem = page.getByRole("button", { name: /PDF/i }).first();
    if ((await pdfItem.count()) > 0) {
      await pdfItem.click();
    }
    const downloadResult = await settle(downloadPromise);
    if (downloadResult.status === "fulfilled") {
      const path = await saveDownload(downloadResult.value, "resume-export.pdf");
      saved.push(path);
      await writeOutput(`Resume PDF saved ${path}`);
    } else {
      await writeError(`Resume PDF download failed: ${downloadResult.reason.message}`);
    }
  }
  await shot(page, "04-resume-after-export");

  // Cover letter generate
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.coverLetter}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 1_500);
  const generate = page.getByRole("button", { name: /Generate|New cover|Create/i }).first();
  if ((await generate.count()) > 0) {
    await generate.click();
    await wait(page, 1_000);
    // Fill minimal fields if modal
    const company = page.getByLabel(/Company/i).first();
    if ((await company.count()) > 0) {
      await company.fill("Indie Studio Labs");
    }
    const position = page.getByLabel(/Position|Role/i).first();
    if ((await position.count()) > 0) {
      await position.fill("Gameplay Programmer");
    }
    const confirm = page
      .getByRole("button", { name: /Generate|Create|Submit/i })
      .filter({ hasNotText: /Cancel/i })
      .last();
    if ((await confirm.count()) > 0) {
      await confirm.click();
      await wait(page, 20_000);
    }
  }
  await shot(page, "05-cover-letter");

  // Portfolio preview
  await page.goto(`${CLIENT_BASE}${APP_ROUTES.portfolioPreview}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 2_000);
  await shot(page, "06-portfolio-preview");
  const portfolioExport = page.getByRole("button", { name: /Export|PDF/i }).first();
  if ((await portfolioExport.count()) > 0) {
    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await portfolioExport.click();
    const pdfItem = page.getByRole("button", { name: /PDF/i }).first();
    if ((await pdfItem.count()) > 0) {
      await pdfItem.click();
    }
    const downloadResult = await settle(downloadPromise);
    if (downloadResult.status === "fulfilled") {
      const path = await saveDownload(downloadResult.value, "portfolio-export.pdf");
      saved.push(path);
    }
  }
  return saved;
};

const proveScrape = async (page: Page): Promise<boolean> => {
  await page.goto(`${CLIENT_BASE}${APP_ROUTE_BUILDERS.settingsSection("jobIntelligence")}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 2_000);
  const hitmarker = page.getByLabel(/Hitmarker/i).first();
  if ((await hitmarker.count()) > 0) {
    const checkedResult = await settle(hitmarker.isChecked());
    const checked = checkedResult.status === "fulfilled" ? checkedResult.value : false;
    if (!checked) {
      await hitmarker.check({ force: true });
    }
  }
  const save = page.getByRole("button", { name: /Save.*provider|Save providers|Save/i }).first();
  if ((await save.count()) > 0) {
    await save.click();
    await wait(page, 1_500);
  }
  await shot(page, "07-job-providers");

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.automationScraper}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 2_000);
  // Trigger a scrape capability button
  const scrapeBtn = page
    .getByRole("button", { name: /Hitmarker|Scrape|Run|Refresh/i })
    .filter({ hasNotText: /Clear|Cancel/i })
    .first();
  if ((await scrapeBtn.count()) > 0 && !(await scrapeBtn.isDisabled())) {
    await scrapeBtn.click();
    await wait(page, 25_000);
  }
  await shot(page, "08-scraper-after-run");

  await page.goto(`${CLIENT_BASE}${APP_ROUTES.jobs}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await wait(page, 2_000);
  // Refresh jobs feed
  const refresh = page.getByRole("button", { name: /Refresh Jobs/i }).first();
  if ((await refresh.count()) > 0) {
    await refresh.click();
    await wait(page, 15_000);
  }
  await shot(page, "09-jobs-after-scrape");
  const jobCards = await page.locator("main .card, main article").count();
  const empty = await page.getByText(/No jobs loaded yet/i).count();
  await writeOutput(`Jobs cards=${String(jobCards)} emptyBanner=${String(empty)}`);
  return empty === 0 && jobCards > 0;
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  await mkdir(join(OUT, "downloads"), { recursive: true });
  await mkdir(join(OUT, "raw-segments"), { recursive: true });

  const browser = await chromium.launch({ headless: false, args: ["--disable-dev-shm-usage"] });
  const context = await browser.newContext({
    acceptDownloads: true,
    recordVideo: { dir: join(OUT, "raw-segments"), size: { width: 1440, height: 900 } },
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text().slice(0, 240));
    }
  });

  let aiOk = false;
  let scrapeOk = false;
  let pdfs: string[] = [];

  await configureLocalAi(page);
  aiOk = await proveAiChat(page);
  pdfs = await provePdfExports(page);
  scrapeOk = await proveScrape(page);

  const video = page.video();
  await context.close();
  await browser.close();
  let videoPath: string | null = null;
  if (video) {
    const raw = await video.path();
    const stable = join(OUT, "product-e2e-ai-pdf-rpa.webm");
    await Bun.write(stable, Bun.file(raw));
    videoPath = stable;
  }

  const report = {
    CLIENT_BASE,
    headless: false,
    display: process.env.DISPLAY ?? null,
    aiOk,
    scrapeOk,
    pdfs,
    pdfCount: pdfs.length,
    consoleErrorCount: consoleErrors.length,
    consoleErrors: consoleErrors.slice(0, 30),
    videoPath,
  };
  await Bun.write(join(OUT, "product-proof-report.json"), JSON.stringify(report, null, 2));
  await writeOutput(JSON.stringify(report, null, 2));

  if (!aiOk) {
    await writeError("AI chat did not produce a real model response.");
    process.exitCode = 1;
  }
  if (pdfs.length < 1) {
    await writeError("No PDF downloads captured.");
    process.exitCode = 1;
  }
  if (!scrapeOk) {
    await writeError("Jobs feed still empty after scrape/refresh.");
    process.exitCode = 1;
  }
};

await main();
