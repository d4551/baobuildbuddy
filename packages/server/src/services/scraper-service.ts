import { generateId, safeParseJson, type JobSearchResult } from "@bao/shared";
import * as z from "zod";
import { eq } from "drizzle-orm";
import { config } from "../config/env";
import { db } from "../db/client";
import { jobs } from "../db/schema/jobs";
import { studios } from "../db/schema/studios";
import { runPythonScript } from "./automation/rpa-runner";

type ScriptInputPayload = {
  sourceUrl?: string;
};

const GAMEDEV_SCRIPT_NAME = "job_scraper_gamedev.py";
const GRACKLE_SCRIPT_NAME = "job_scraper_grackle.py";
const WORKWITHINDIES_SCRIPT_NAME = "job_scraper_workwithindies.py";
const REMOTEGAMEJOBS_SCRIPT_NAME = "job_scraper_remotegamejobs.py";
const GAMESJOBSDIRECT_SCRIPT_NAME = "job_scraper_gamesjobsdirect.py";
const POCKETGAMER_SCRIPT_NAME = "job_scraper_pocketgamer.py";

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

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const runWithErrorCollection = async (
  operation: () => Promise<void>,
  errors: string[],
): Promise<void> => {
  await operation().then(
    () => undefined,
    (error: unknown) => {
      errors.push(toErrorMessage(error));
    },
  );
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

const toJobSearchResult = (rows: ScrapedJob[]): JobSearchResult => ({
  jobs: rows.map((row) => ({
    id: row.contentHash || generateId(),
    title: row.title,
    company: row.company,
    location: row.location,
    remote: Boolean(row.remote),
    description: row.description,
    url: row.url,
    source: row.source,
    contentHash: row.contentHash,
    postedDate: row.postDate || row.postedDate || "",
    type: "full-time",
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
  /**
   * Runs a Python scraper script and returns parsed JSON payload.
   */
  private async runScraperScript(
    scriptName: string,
    payload: ScriptInputPayload = {},
  ): Promise<{
    parsed: unknown;
    stderrLines: string[];
  }> {
    const execution = await runPythonScript({
      scriptName,
      scriptInput: payload,
      runId: generateId(),
      timeoutMs: config.automationScriptTimeoutMs,
      stdoutLineLimit: config.automationStdioBufferLimit,
      stderrLineLimit: config.automationStdioBufferLimit,
    });

    if (execution.exitCode !== 0) {
      throw new Error(
        `Script exited ${execution.exitCode}: ${execution.stderrLines.join("\n") || execution.stdoutLines.join("\n")}`,
      );
    }

    const outputText = execution.stdoutLines.join("\n").trim();
    const parsed = safeParseJson(outputText);
    if (parsed === null && outputText !== "null") {
      throw new Error("Scraper script returned invalid JSON");
    }

    return {
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
        rowErrors.push(`studio_row_${index}: invalid payload`);
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
        rowErrors.push(`job_row_${index}: invalid payload`);
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

    await this.runScraperScript("studio_scraper.py")
      .then(async ({ parsed }) => {
        const parsedRows = this.parseStudioRows(parsed);
        scraped = parsedRows.rows.length;
        errors.push(...parsedRows.rowErrors);

        const now = new Date().toISOString();
        for (const studioRow of parsedRows.rows) {
          await runWithErrorCollection(async () => {
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
            upserted += 1;
          }, errors);
        }
      })
      .then(
        () => undefined,
        (error: unknown) => {
          errors.push(toErrorMessage(error));
        },
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
    const { parsed } = await this.runScraperScript(
      scriptName,
      sourceUrl ? { sourceUrl } : {},
    );
    return this.parseJobRows(parsed).rows;
  }

  /**
   * Scrapes jobs from Grackle and validates normalized output shape.
   */
  async scrapeGrackleJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    const { parsed } = await this.runScraperScript(
      GRACKLE_SCRIPT_NAME,
      sourceUrl ? { sourceUrl } : {},
    );
    return this.parseJobRows(parsed).rows;
  }

  /**
   * Scrapes jobs from WorkWithIndies and validates normalized output shape.
   */
  async scrapeWorkWithIndiesJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    const { parsed } = await this.runScraperScript(
      WORKWITHINDIES_SCRIPT_NAME,
      sourceUrl ? { sourceUrl } : {},
    );
    return this.parseJobRows(parsed).rows;
  }

  /**
   * Scrapes jobs from RemoteGameJobs and validates normalized output shape.
   */
  async scrapeRemoteGameJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    const { parsed } = await this.runScraperScript(
      REMOTEGAMEJOBS_SCRIPT_NAME,
      sourceUrl ? { sourceUrl } : {},
    );
    return this.parseJobRows(parsed).rows;
  }

  /**
   * Scrapes jobs from GamesJobsDirect and validates normalized output shape.
   */
  async scrapeGamesJobsDirectRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    const { parsed } = await this.runScraperScript(
      GAMESJOBSDIRECT_SCRIPT_NAME,
      sourceUrl ? { sourceUrl } : {},
    );
    return this.parseJobRows(parsed).rows;
  }

  /**
   * Scrapes jobs from PocketGamer and validates normalized output shape.
   */
  async scrapePocketGamerJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    const { parsed } = await this.runScraperScript(
      POCKETGAMER_SCRIPT_NAME,
      sourceUrl ? { sourceUrl } : {},
    );
    return this.parseJobRows(parsed).rows;
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

    await this.runScraperScript(scriptName)
      .then(async ({ parsed }) => {
        const parsedRows = this.parseJobRows(parsed);
        scraped = parsedRows.rows.length;
        errors.push(...parsedRows.rowErrors);

        const normalizedResult = toJobSearchResult(parsedRows.rows);
        const now = new Date().toISOString();

        for (const job of normalizedResult.jobs) {
          await runWithErrorCollection(async () => {
            const contentHash = String(job.contentHash || `gdn-${generateId()}`).slice(0, 100);
            const existing = await db.select().from(jobs).where(eq(jobs.contentHash, contentHash));
            if (existing.length > 0) {
              return;
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
              source: job.source || "gamedev-net",
              contentHash,
              postedDate: job.postedDate && job.postedDate.length > 0 ? job.postedDate : null,
              type: "full-time",
              createdAt: now,
              updatedAt: now,
            });
            upserted += 1;
          }, errors);
        }
      })
      .then(
        () => undefined,
        (error: unknown) => {
          errors.push(toErrorMessage(error));
        },
      );

    return { scraped, upserted, errors };
  }
}

export const scraperService = new ScraperService();
