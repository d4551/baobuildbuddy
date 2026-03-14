import {
  API_ERROR_INVALID_SCRAPER_JSON,
  automationScriptIdSchema,
  generateId,
  gamingPortalScraperScriptIdByPortalId,
  type JobSearchResult,
  scrapedJobSchema,
  scrapedStudioSchema,
  safeParseJson,
  type AutomationScriptId,
  type GamingPortalId,
  type ScrapedJob,
  type ScrapedStudio,
  toErrorMessage,
} from "@bao/shared";
import { eq } from "drizzle-orm";
import { config } from "../config/env";
import { db } from "../db/client";
import { jobs } from "../db/schema/jobs";
import { studios } from "../db/schema/studios";
import { runAutomationScript } from "./automation/rpa-runner";
import { loadJobProviderSettings } from "./jobs/providers/provider-settings";

type ScriptInputPayload = {
  sourceUrl?: string;
};

type ScriptExecutionOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

const HITMARKER_SCRIPT_ID = gamingPortalScraperScriptIdByPortalId.hitmarker;
const GRACKLE_SCRIPT_ID = gamingPortalScraperScriptIdByPortalId.grackle;
const WORKWITHINDIES_SCRIPT_ID = gamingPortalScraperScriptIdByPortalId.workwithindies;
const REMOTEGAMEJOBS_SCRIPT_ID = gamingPortalScraperScriptIdByPortalId.remotegamejobs;
const GAMESJOBSDIRECT_SCRIPT_ID = gamingPortalScraperScriptIdByPortalId.gamesjobsdirect;
const POCKETGAMER_SCRIPT_ID = gamingPortalScraperScriptIdByPortalId.pocketgamer;
const STUDIO_SCRAPER_SCRIPT_ID: AutomationScriptId = "studio-scraper";
const DEFAULT_JOB_POSTED_DATE = "";
const DEFAULT_JOB_TYPE = "full-time";
const DEFAULT_JOB_SOURCE = "unknown-source";
const CONTENT_HASH_PREFIX = "job";
const CONTENT_HASH_LENGTH = 24;
export type { ScrapedJob };

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

type AutomationScriptReference = {
  scriptId?: AutomationScriptId;
  scriptPath?: string;
};

type ScriptReferenceOverride = {
  scriptPath: string;
};

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

const resolveScriptReference = (
  scriptReference: AutomationScriptId | ScriptReferenceOverride,
): AutomationScriptReference =>
  typeof scriptReference === "string"
    ? { scriptId: automationScriptIdSchema.parse(scriptReference) }
    : { scriptPath: scriptReference.scriptPath };

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
  private async resolvePortalSourceUrl(portalId: GamingPortalId): Promise<string | null> {
    const providerSettings = await loadJobProviderSettings();
    const portalConfig =
      providerSettings.gamingPortals.find((portal) => portal.id === portalId && portal.enabled) ??
      null;

    return portalConfig?.fallbackUrl ?? null;
  }

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
    const contentHash = String(job.contentHash?.trim().length ? job.contentHash : job.id).slice(
      0,
      100,
    );
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
   * Runs a Bun automation scraper script and returns parsed JSON payload.
   */
  private async runScraperScript(
    scriptReference: AutomationScriptReference,
    payload: ScriptInputPayload = {},
    options: ScriptExecutionOptions = {},
  ): Promise<ScraperScriptExecutionResult> {
    const execution = await runAutomationScript({
      scriptId: scriptReference.scriptId,
      scriptPath: scriptReference.scriptPath,
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
        error: API_ERROR_INVALID_SCRAPER_JSON,
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

    const scriptResult = await this.runScraperScript({
      scriptId: STUDIO_SCRAPER_SCRIPT_ID,
    });
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
   * Scrapes jobs from Hitmarker and validates normalized output shape.
   */
  async scrapeHitmarkerJobsRaw(
    sourceUrl?: string,
    scriptReference: AutomationScriptId | ScriptReferenceOverride = HITMARKER_SCRIPT_ID,
  ): Promise<ScrapedJob[]> {
    const resolvedSourceUrl = sourceUrl ?? (await this.resolvePortalSourceUrl("hitmarker"));
    if (!resolvedSourceUrl) {
      return [];
    }

    const scriptResult = await this.runScraperScript(resolveScriptReference(scriptReference), {
      sourceUrl: resolvedSourceUrl,
    });
    if (!scriptResult.ok) {
      return [];
    }
    return this.parseJobRows(scriptResult.parsed).rows;
  }

  /**
   * Scrapes jobs from Grackle and validates normalized output shape.
   */
  async scrapeGrackleJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    const resolvedSourceUrl = sourceUrl ?? (await this.resolvePortalSourceUrl("grackle"));
    if (!resolvedSourceUrl) {
      return [];
    }

    const scriptResult = await this.runScraperScript(
      { scriptId: GRACKLE_SCRIPT_ID },
      { sourceUrl: resolvedSourceUrl },
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
    const resolvedSourceUrl = sourceUrl ?? (await this.resolvePortalSourceUrl("workwithindies"));
    if (!resolvedSourceUrl) {
      return [];
    }

    const scriptResult = await this.runScraperScript(
      { scriptId: WORKWITHINDIES_SCRIPT_ID },
      { sourceUrl: resolvedSourceUrl },
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
    const resolvedSourceUrl = sourceUrl ?? (await this.resolvePortalSourceUrl("remotegamejobs"));
    if (!resolvedSourceUrl) {
      return [];
    }

    const scriptResult = await this.runScraperScript(
      { scriptId: REMOTEGAMEJOBS_SCRIPT_ID },
      { sourceUrl: resolvedSourceUrl },
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
    const resolvedSourceUrl = sourceUrl ?? (await this.resolvePortalSourceUrl("gamesjobsdirect"));
    if (!resolvedSourceUrl) {
      return [];
    }

    const scriptResult = await this.runScraperScript(
      { scriptId: GAMESJOBSDIRECT_SCRIPT_ID },
      { sourceUrl: resolvedSourceUrl },
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
    const resolvedSourceUrl = sourceUrl ?? (await this.resolvePortalSourceUrl("pocketgamer"));
    if (!resolvedSourceUrl) {
      return [];
    }

    const scriptResult = await this.runScraperScript(
      { scriptId: POCKETGAMER_SCRIPT_ID },
      { sourceUrl: resolvedSourceUrl },
    );
    if (!scriptResult.ok) {
      return [];
    }
    return this.parseJobRows(scriptResult.parsed).rows;
  }

  /**
   * Scrapes and upserts Hitmarker jobs with row-level error reporting.
   */
  async scrapeHitmarkerJobs(
    scriptReference: AutomationScriptId | ScriptReferenceOverride = HITMARKER_SCRIPT_ID,
  ): Promise<{ scraped: number; upserted: number; errors: string[] }> {
    const errors: string[] = [];
    let scraped = 0;
    let upserted = 0;

    const resolvedSourceUrl = await this.resolvePortalSourceUrl("hitmarker");
    if (!resolvedSourceUrl) {
      errors.push("Missing enabled Hitmarker portal fallbackUrl.");
      return { scraped, upserted, errors };
    }

    const scriptResult = await this.runScraperScript(resolveScriptReference(scriptReference), {
      sourceUrl: resolvedSourceUrl,
    });
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
