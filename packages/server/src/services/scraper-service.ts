import { generateId, type JobSearchResult, safeParseJson } from "@bao/shared";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { config } from "../config/env";
import { db } from "../db/client";
import { jobs } from "../db/schema/jobs";
import { studios } from "../db/schema/studios";
import { runPythonScript } from "./automation/rpa-runner";

type ScriptInputPayload = {
  sourceUrl?: string;
};

type ScriptExecutionOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

const GAMEDEV_SCRIPT_NAME = "job_scraper_gamedev.py";
const GRACKLE_SCRIPT_NAME = "job_scraper_grackle.py";
const WORKWITHINDIES_SCRIPT_NAME = "job_scraper_workwithindies.py";
const REMOTEGAMEJOBS_SCRIPT_NAME = "job_scraper_remotegamejobs.py";
const GAMESJOBSDIRECT_SCRIPT_NAME = "job_scraper_gamesjobsdirect.py";
const POCKETGAMER_SCRIPT_NAME = "job_scraper_pocketgamer.py";
const DEFAULT_JOB_POSTED_DATE = "";
const DEFAULT_JOB_TYPE = "full-time";
const DEFAULT_JOB_SOURCE = "unknown-source";
const CONTENT_HASH_PREFIX = "job";
const CONTENT_HASH_LENGTH = 24;

const scrapedStudioSchema = z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1),
  website: z.string().trim().min(1).optional(),
  location: z.string().trim().min(1).optional(),
  size: z.string().trim().min(1).optional(),
  type: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  games: z.array(z.string().trim().min(1)).optional(),
  technologies: z.array(z.string().trim().min(1)).optional(),
  interviewStyle: z.string().trim().min(1).optional(),
  remoteWork: z.boolean().nullable().optional(),
});

const scrapedJobSchema = z.object({
  title: z.string().trim().min(1).max(200),
  company: z.string().trim().min(1).max(200),
  location: z.string().trim().min(1).max(200),
  remote: z.boolean().optional(),
  description: z.string().trim().max(5_000).optional(),
  url: z.string().trim().max(500).optional(),
  source: z.string().trim().max(120).optional(),
  contentHash: z.string().trim().max(200).optional(),
  postDate: z.string().trim().max(80).optional(),
  postedDate: z.string().trim().max(80).optional(),
});

type ScrapedStudio = z.infer<typeof scrapedStudioSchema>;
export type ScrapedJob = z.infer<typeof scrapedJobSchema>;

type ScriptRows<T> = {
  rows: T[];
  rowErrors: string[];
};

type ScraperScriptExecutionResult =
  | {
      ok: true;
      parsed: unknown;
      stderrLines: string[];
    }
  | {
      ok: false;
      error: string;
      stderrLines: string[];
    };

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const runWithErrorCollection = async (
  operation: () => Promise<void>,
  errors: string[],
): Promise<void> => {
  const [operationResult] = await Promise.allSettled([operation()]);
  if (operationResult.status === "rejected") {
    errors.push(toErrorMessage(operationResult.reason));
  }
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value))
    : null;

const parseJsonRows = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) {
    return raw;
  }

  const asObject = asRecord(raw);
  if (!asObject) {
    return [];
  }

  const items = asObject.items;
  if (Array.isArray(items)) {
    return items;
  }

  const rows = asObject.rows;
  if (Array.isArray(rows)) {
    return rows;
  }

  return [raw];
};

const normalizeHashInput = (value: string | undefined): string =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const buildDeterministicContentHash = (row: ScrapedJob): string => {
  const canonical = [
    normalizeHashInput(row.source),
    normalizeHashInput(row.title),
    normalizeHashInput(row.company),
    normalizeHashInput(row.location),
    normalizeHashInput(row.url),
    normalizeHashInput(row.postDate),
    normalizeHashInput(row.postedDate),
    normalizeHashInput(row.description),
  ].join("|");
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(canonical);
  return `${CONTENT_HASH_PREFIX}-${hasher.digest("hex").slice(0, CONTENT_HASH_LENGTH)}`;
};

const resolveScrapedContentHash = (row: ScrapedJob): string => {
  const normalized = row.contentHash?.trim();
  if (normalized && normalized.length > 0) {
    return normalized;
  }
  return buildDeterministicContentHash(row);
};

const toJobSearchResult = (rows: ScrapedJob[]): JobSearchResult => ({
  jobs: rows.map((row) => ({
    id: resolveScrapedContentHash(row),
    title: row.title,
    company: row.company,
    location: row.location,
    remote: Boolean(row.remote),
    description: row.description,
    url: row.url,
    source:
      row.source?.trim() && row.source.trim().length > 0 ? row.source.trim() : DEFAULT_JOB_SOURCE,
    contentHash: resolveScrapedContentHash(row),
    postedDate: row.postDate || row.postedDate || DEFAULT_JOB_POSTED_DATE,
    type: DEFAULT_JOB_TYPE,
  })),
  total: rows.length,
  page: 1,
  limit: rows.length,
  filters: {},
});

/**
 * Scraper service for studio/job ingestion via Python scripts.
 */
export class ScraperService {
  private async upsertStudioRow(studioRow: ScrapedStudio, now: string): Promise<void> {
    const id = studioRow.id || generateId();
    const studioData = {
      name: studioRow.name,
      website: studioRow.website ?? null,
      location: studioRow.location ?? null,
      size: studioRow.size ?? null,
      type: studioRow.type ?? null,
      description: studioRow.description ?? null,
      games: studioRow.games ?? [],
      technologies: studioRow.technologies ?? [],
      interviewStyle: studioRow.interviewStyle ?? null,
      remoteWork: studioRow.remoteWork ?? null,
    };

    await db
      .insert(studios)
      .values({
        id,
        ...studioData,
        logo: null,
        culture: null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: studios.id,
        set: {
          ...studioData,
          updatedAt: now,
        },
      });
  }

  private async insertScrapedJobIfMissing(
    job: JobSearchResult["jobs"][number],
    now: string,
  ): Promise<boolean> {
    const contentHash = String(job.contentHash?.trim().length ? job.contentHash : job.id).slice(0, 100);
    const existing = await db.select().from(jobs).where(eq(jobs.contentHash, contentHash));
    if (existing.length > 0) {
      return false;
    }

    await db.insert(jobs).values({
      id: generateId(),
      title: job.title,
      company: job.company,
      location: job.location,
      remote: Boolean(job.remote),
      hybrid: false,
      description: job.description ?? null,
      url: job.url ?? null,
      source:
        job.source?.trim() && job.source.trim().length > 0 ? job.source.trim() : DEFAULT_JOB_SOURCE,
      contentHash,
      postedDate: job.postedDate && job.postedDate.length > 0 ? job.postedDate : null,
      type: DEFAULT_JOB_TYPE,
      createdAt: now,
      updatedAt: now,
    });
    return true;
  }

  /**
   * Runs a Python scraper script and returns parsed JSON payload.
   */
  private async runScraperScript(
    scriptName: string,
    payload: ScriptInputPayload = {},
    options: ScriptExecutionOptions = {},
  ): Promise<ScraperScriptExecutionResult> {
    const execution = await runPythonScript({
      scriptName,
      scriptInput: payload,
      runId: generateId(),
      timeoutMs: options.timeoutMs ?? config.automationScriptTimeoutMs,
      signal: options.signal,
      stdoutLineLimit: config.automationStdioBufferLimit,
      stderrLineLimit: config.automationStdioBufferLimit,
    });

    if (execution.exitCode !== 0) {
      return {
        ok: false,
        error: `Script exited ${execution.exitCode}: ${execution.stderrLines.join("\n") || execution.stdoutLines.join("\n")}`,
        stderrLines: execution.stderrLines,
      };
    }

    const outputText = execution.stdoutLines.join("\n").trim();
    const parsed = safeParseJson(outputText);
    if (parsed === null && outputText !== "null") {
      return {
        ok: false,
        error: "Scraper script returned invalid JSON",
        stderrLines: execution.stderrLines,
      };
    }

    return {
      ok: true,
      parsed,
      stderrLines: execution.stderrLines,
    };
  }

  /**
   * Parses studio rows and collects row-level schema validation errors.
   */
  private parseStudioRows(raw: unknown): ScriptRows<ScrapedStudio> {
    const rows = parseJsonRows(raw);
    const parsedRows: ScrapedStudio[] = [];
    const rowErrors: string[] = [];

    rows.forEach((row, index) => {
      const parsed = scrapedStudioSchema.safeParse(row);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const issuePath = issue?.path.join(".") || "root";
        rowErrors.push(`studio_row_${index}: invalid payload at ${issuePath}`);
        return;
      }
      parsedRows.push(parsed.data);
    });

    return {
      rows: parsedRows,
      rowErrors,
    };
  }

  /**
   * Parses job rows and collects row-level schema validation errors.
   */
  private parseJobRows(raw: unknown): ScriptRows<ScrapedJob> {
    const rows = parseJsonRows(raw);
    const parsedRows: ScrapedJob[] = [];
    const rowErrors: string[] = [];

    rows.forEach((row, index) => {
      const parsed = scrapedJobSchema.safeParse(row);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const issuePath = issue?.path.join(".") || "root";
        rowErrors.push(`job_row_${index}: invalid payload at ${issuePath}`);
        return;
      }
      parsedRows.push(parsed.data);
    });

    return {
      rows: parsedRows,
      rowErrors,
    };
  }

  /**
   * Scrapes and upserts studio data.
   */
  async scrapeStudios(): Promise<{ scraped: number; upserted: number; errors: string[] }> {
    const errors: string[] = [];
    let scraped = 0;
    let upserted = 0;

    const scriptResult = await this.runScraperScript("studio_scraper.py");
    if (!scriptResult.ok) {
      errors.push(scriptResult.error);
      return { scraped, upserted, errors };
    }

    const parsedRows = this.parseStudioRows(scriptResult.parsed);
    scraped = parsedRows.rows.length;
    errors.push(...parsedRows.rowErrors);

    const now = new Date().toISOString();
    await Promise.allSettled(
      parsedRows.rows.map((studioRow) =>
        runWithErrorCollection(async () => {
          await this.upsertStudioRow(studioRow, now);
          upserted += 1;
        }, errors),
      ),
    );

    return { scraped, upserted, errors };
  }

  /**
   * Scrapes jobs from GameDev.net and validates normalized output shape.
   */
  async scrapeGameDevNetJobsRaw(
    sourceUrl?: string,
    scriptName: string = GAMEDEV_SCRIPT_NAME,
  ): Promise<ScrapedJob[]> {
    const scriptResult = await this.runScraperScript(scriptName, sourceUrl ? { sourceUrl } : {});
    if (!scriptResult.ok) {
      return [];
    }
    return this.parseJobRows(scriptResult.parsed).rows;
  }

  /**
   * Scrapes jobs from Grackle and validates normalized output shape.
   */
  async scrapeGrackleJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    const scriptResult = await this.runScraperScript(
      GRACKLE_SCRIPT_NAME,
      sourceUrl ? { sourceUrl } : {},
    );
    if (!scriptResult.ok) {
      return [];
    }
    return this.parseJobRows(scriptResult.parsed).rows;
  }

  /**
   * Scrapes jobs from WorkWithIndies and validates normalized output shape.
   */
  async scrapeWorkWithIndiesJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    const scriptResult = await this.runScraperScript(
      WORKWITHINDIES_SCRIPT_NAME,
      sourceUrl ? { sourceUrl } : {},
    );
    if (!scriptResult.ok) {
      return [];
    }
    return this.parseJobRows(scriptResult.parsed).rows;
  }

  /**
   * Scrapes jobs from RemoteGameJobs and validates normalized output shape.
   */
  async scrapeRemoteGameJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    const scriptResult = await this.runScraperScript(
      REMOTEGAMEJOBS_SCRIPT_NAME,
      sourceUrl ? { sourceUrl } : {},
    );
    if (!scriptResult.ok) {
      return [];
    }
    return this.parseJobRows(scriptResult.parsed).rows;
  }

  /**
   * Scrapes jobs from GamesJobsDirect and validates normalized output shape.
   */
  async scrapeGamesJobsDirectRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    const scriptResult = await this.runScraperScript(
      GAMESJOBSDIRECT_SCRIPT_NAME,
      sourceUrl ? { sourceUrl } : {},
    );
    if (!scriptResult.ok) {
      return [];
    }
    return this.parseJobRows(scriptResult.parsed).rows;
  }

  /**
   * Scrapes jobs from PocketGamer and validates normalized output shape.
   */
  async scrapePocketGamerJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    const scriptResult = await this.runScraperScript(
      POCKETGAMER_SCRIPT_NAME,
      sourceUrl ? { sourceUrl } : {},
    );
    if (!scriptResult.ok) {
      return [];
    }
    return this.parseJobRows(scriptResult.parsed).rows;
  }

  /**
   * Scrapes and upserts GameDev.net jobs with row-level error reporting.
   */
  async scrapeGameDevNetJobs(
    scriptName: string = GAMEDEV_SCRIPT_NAME,
  ): Promise<{ scraped: number; upserted: number; errors: string[] }> {
    const errors: string[] = [];
    let scraped = 0;
    let upserted = 0;

    const scriptResult = await this.runScraperScript(scriptName);
    if (!scriptResult.ok) {
      errors.push(scriptResult.error);
      return { scraped, upserted, errors };
    }

    const parsedRows = this.parseJobRows(scriptResult.parsed);
    scraped = parsedRows.rows.length;
    errors.push(...parsedRows.rowErrors);

    const normalizedResult = toJobSearchResult(parsedRows.rows);
    const now = new Date().toISOString();
    await Promise.allSettled(
      normalizedResult.jobs.map((job) =>
        runWithErrorCollection(async () => {
          const inserted = await this.insertScrapedJobIfMissing(job, now);
          if (inserted) {
            upserted += 1;
          }
        }, errors),
      ),
    );

    return { scraped, upserted, errors };
  }
}

export const scraperService = new ScraperService();
