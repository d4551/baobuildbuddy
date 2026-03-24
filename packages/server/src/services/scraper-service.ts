import {
  AI_DEFAULT_TEMPERATURE_STRUCTURED,
  AI_MAX_TOKENS_SCRAPE_ENRICHMENT,
  API_ERROR_INVALID_SCRAPER_JSON,
  API_ERROR_INVALID_SCRIPT_ID,
  type AutomationJobScrapeTarget,
  type AutomationScriptId,
  DEFAULT_SETTINGS_ID,
  automationScrapeTargetToPortalId,
  automationScriptIdSchema,
  type GamingPortalId,
  gamingPortalScraperScriptIdByPortalId,
  generateId,
  type JobSearchResult,
  normalizeScrapePersonaEnrichment,
  type ScrapeEnrichmentRunSummary,
  type ScrapePersonaEnrichment,
  type ScraperOperationResult,
  type ScrapedJob,
  type ScrapedStudio,
  safeParseJson,
  scrapedJobSchema,
  scrapedStudioSchema,
  settle,
  toErrorMessage,
} from "@bao/shared";
import { eq } from "drizzle-orm";
import { config } from "../config/env";
import { db } from "../db/client";
import { jobs } from "../db/schema/jobs";
import { settings } from "../db/schema/settings";
import { studios } from "../db/schema/studios";
import { AIService } from "./ai/ai-service";
import { scrapeJobEnrichmentPrompt, scrapeStudioEnrichmentPrompt } from "./ai/prompts";
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
const SCRAPE_ENRICHMENT_WARNING_LIMIT = 25;
const PORTAL_SCRIPT_ID_BY_ID = {
  hitmarker: HITMARKER_SCRIPT_ID,
  grackle: GRACKLE_SCRIPT_ID,
  workwithindies: WORKWITHINDIES_SCRIPT_ID,
  remotegamejobs: REMOTEGAMEJOBS_SCRIPT_ID,
  gamesjobsdirect: GAMESJOBSDIRECT_SCRIPT_ID,
  pocketgamer: POCKETGAMER_SCRIPT_ID,
} as const satisfies Record<GamingPortalId, AutomationScriptId>;

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

type ScrapeEnrichmentAttempt = {
  enrichment?: ScrapePersonaEnrichment;
  warning?: string;
  provider?: ScrapeEnrichmentRunSummary["provider"];
  model?: string;
};

type ScrapeEnrichmentAccumulator = {
  enabled: boolean;
  enrichedRecords: number;
  warnings: string[];
  provider?: ScrapeEnrichmentRunSummary["provider"];
  model?: string;
};

const createScrapeEnrichmentAccumulator = (): ScrapeEnrichmentAccumulator => ({
  enabled: true,
  enrichedRecords: 0,
  warnings: [],
});

const toScrapeEnrichmentSummary = (
  accumulator: ScrapeEnrichmentAccumulator,
): ScrapeEnrichmentRunSummary => ({
  enabled: accumulator.enabled,
  enrichedRecords: accumulator.enrichedRecords,
  warnings: accumulator.warnings,
  ...(accumulator.provider ? { provider: accumulator.provider } : {}),
  ...(accumulator.model ? { model: accumulator.model } : {}),
});

const pushScrapeEnrichmentWarning = (
  accumulator: ScrapeEnrichmentAccumulator,
  warning: string,
): void => {
  if (warning.length === 0 || accumulator.warnings.length >= SCRAPE_ENRICHMENT_WARNING_LIMIT) {
    return;
  }
  accumulator.warnings.push(warning);
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
): AutomationScriptReference => {
  if (typeof scriptReference !== "string") {
    return { scriptPath: scriptReference.scriptPath };
  }
  const parsed = automationScriptIdSchema.safeParse(scriptReference);
  if (!parsed.success) {
    throw new Error(API_ERROR_INVALID_SCRIPT_ID);
  }
  return { scriptId: parsed.data };
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
 * Scraper service for studio/job ingestion via Bun automation scripts.
 */
export class ScraperService {
  /**
   * Load the singleton settings row used to construct purpose-aware AI services.
   */
  private async loadSettingsRow() {
    const rows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID)).limit(1);
    return rows[0];
  }

  /**
   * Create the AI service used for scrape enrichment when settings are available.
   */
  private async createScrapeEnrichmentService(): Promise<AIService | null> {
    const settingsRow = await this.loadSettingsRow();
    if (!settingsRow) {
      return null;
    }
    return AIService.fromSettings(settingsRow);
  }

  /**
   * Generate studio persona enrichment for one scraped studio row.
   */
  private async enrichStudioRow(
    studioRow: ScrapedStudio,
    aiService: AIService | null,
  ): Promise<ScrapeEnrichmentAttempt> {
    if (!aiService) {
      return {
        warning: "Scrape enrichment skipped because settings are unavailable.",
      };
    }

    const responseResult = await settle(
      aiService.generate(scrapeStudioEnrichmentPrompt(studioRow), {
        purpose: "scrapeEnrichment",
        temperature: AI_DEFAULT_TEMPERATURE_STRUCTURED,
        maxTokens: AI_MAX_TOKENS_SCRAPE_ENRICHMENT,
      }),
    );
    if (responseResult.status === "rejected") {
      return {
        warning: `Studio enrichment failed for ${studioRow.name}: ${toErrorMessage(responseResult.reason)}`,
      };
    }

    const enrichment = normalizeScrapePersonaEnrichment(safeParseJson(responseResult.value.content));
    if (!enrichment) {
      return {
        warning: `Studio enrichment returned invalid JSON for ${studioRow.name}.`,
      };
    }

    return {
      enrichment: {
        ...enrichment,
        updatedAt: new Date().toISOString(),
        provider: responseResult.value.provider,
        model: responseResult.value.model,
      },
      provider: responseResult.value.provider,
      model: responseResult.value.model,
    };
  }

  /**
   * Generate job persona enrichment for one scraped job row.
   */
  private async enrichJobRow(
    jobRow: ScrapedJob,
    aiService: AIService | null,
  ): Promise<ScrapeEnrichmentAttempt> {
    if (!aiService) {
      return {
        warning: "Scrape enrichment skipped because settings are unavailable.",
      };
    }

    const responseResult = await settle(
      aiService.generate(scrapeJobEnrichmentPrompt(jobRow), {
        purpose: "scrapeEnrichment",
        temperature: AI_DEFAULT_TEMPERATURE_STRUCTURED,
        maxTokens: AI_MAX_TOKENS_SCRAPE_ENRICHMENT,
      }),
    );
    if (responseResult.status === "rejected") {
      return {
        warning: `Job enrichment failed for ${jobRow.title} at ${jobRow.company}: ${toErrorMessage(responseResult.reason)}`,
      };
    }

    const enrichment = normalizeScrapePersonaEnrichment(safeParseJson(responseResult.value.content));
    if (!enrichment) {
      return {
        warning: `Job enrichment returned invalid JSON for ${jobRow.title} at ${jobRow.company}.`,
      };
    }

    return {
      enrichment: {
        ...enrichment,
        updatedAt: new Date().toISOString(),
        provider: responseResult.value.provider,
        model: responseResult.value.model,
      },
      provider: responseResult.value.provider,
      model: responseResult.value.model,
    };
  }

  private async resolvePortalSourceUrl(portalId: GamingPortalId): Promise<string | null> {
    const providerSettings = await loadJobProviderSettings();
    const portalConfig =
      providerSettings.gamingPortals.find((portal) => portal.id === portalId && portal.enabled) ??
      null;

    return portalConfig?.fallbackUrl ?? null;
  }

  /**
   * Resolve the configured automation script id for a portal-backed scraper.
   */
  private resolvePortalScriptId(portalId: GamingPortalId): AutomationScriptId {
    return PORTAL_SCRIPT_ID_BY_ID[portalId];
  }

  /**
   * Upsert a scraped studio row and persist the latest enrichment snapshot.
   */
  private async upsertStudioRow(
    studioRow: ScrapedStudio,
    now: string,
    enrichment?: ScrapePersonaEnrichment,
  ): Promise<void> {
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
      enrichment: enrichment ?? null,
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

  /**
   * Upsert a scraped job row keyed by deterministic content hash and persist enrichment.
   */
  private async upsertScrapedJob(
    job: JobSearchResult["jobs"][number],
    now: string,
    enrichment?: ScrapePersonaEnrichment,
  ): Promise<void> {
    const contentHash = String(job.contentHash?.trim().length ? job.contentHash : job.id).slice(0, 100);

    await db
      .insert(jobs)
      .values({
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
        enrichment: enrichment ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: jobs.contentHash,
        set: {
          title: job.title,
          company: job.company,
          location: job.location,
          remote: Boolean(job.remote),
          hybrid: false,
          description: job.description ?? null,
          url: job.url ?? null,
          source:
            job.source?.trim() && job.source.trim().length > 0
              ? job.source.trim()
              : DEFAULT_JOB_SOURCE,
          postedDate: job.postedDate && job.postedDate.length > 0 ? job.postedDate : null,
          type: DEFAULT_JOB_TYPE,
          enrichment: enrichment ?? null,
          updatedAt: now,
        },
      });
  }

  /**
   * Upsert a scraped job row and update the enrichment summary in-memory.
   */
  private async persistScrapedJobRow(
    job: JobSearchResult["jobs"][number],
    now: string,
    enrichmentAttempt: ScrapeEnrichmentAttempt,
    enrichmentAccumulator: ScrapeEnrichmentAccumulator,
  ): Promise<void> {
    if (enrichmentAttempt.warning) {
      pushScrapeEnrichmentWarning(enrichmentAccumulator, enrichmentAttempt.warning);
    }
    await this.upsertScrapedJob(job, now, enrichmentAttempt.enrichment);
    if (enrichmentAttempt.enrichment) {
      enrichmentAccumulator.enrichedRecords += 1;
      enrichmentAccumulator.provider = enrichmentAttempt.provider ?? enrichmentAccumulator.provider;
      enrichmentAccumulator.model = enrichmentAttempt.model ?? enrichmentAccumulator.model;
    }
  }

  /**
   * Upsert a scraped studio row and update the enrichment summary in-memory.
   */
  private async persistScrapedStudioRow(
    studioRow: ScrapedStudio,
    now: string,
    enrichmentAttempt: ScrapeEnrichmentAttempt,
    enrichmentAccumulator: ScrapeEnrichmentAccumulator,
  ): Promise<void> {
    if (enrichmentAttempt.warning) {
      pushScrapeEnrichmentWarning(enrichmentAccumulator, enrichmentAttempt.warning);
    }
    await this.upsertStudioRow(studioRow, now, enrichmentAttempt.enrichment);
    if (enrichmentAttempt.enrichment) {
      enrichmentAccumulator.enrichedRecords += 1;
      enrichmentAccumulator.provider = enrichmentAttempt.provider ?? enrichmentAccumulator.provider;
      enrichmentAccumulator.model = enrichmentAttempt.model ?? enrichmentAccumulator.model;
    }
  }

  /**
   * Scrape normalized rows for a configured gaming portal.
   */
  private async scrapePortalJobsRaw(
    portalId: GamingPortalId,
    sourceUrl?: string,
    scriptReference?: AutomationScriptId | ScriptReferenceOverride,
  ): Promise<ScrapedJob[]> {
    const resolvedSourceUrl = sourceUrl ?? (await this.resolvePortalSourceUrl(portalId));
    if (!resolvedSourceUrl) {
      return [];
    }

    const effectiveReference = scriptReference
      ? resolveScriptReference(scriptReference)
      : { scriptId: this.resolvePortalScriptId(portalId) };
    const scriptResult = await this.runScraperScript(effectiveReference, {
      sourceUrl: resolvedSourceUrl,
    });
    if (!scriptResult.ok) {
      return [];
    }
    return this.parseJobRows(scriptResult.parsed).rows;
  }

  /**
   * Scrape and upsert jobs for a configured gaming portal.
   */
  private async scrapePortalJobs(
    portalId: GamingPortalId,
    scriptReference?: AutomationScriptId | ScriptReferenceOverride,
  ): Promise<ScraperOperationResult> {
    const errors: string[] = [];
    let scraped = 0;
    let upserted = 0;
    const enrichment = createScrapeEnrichmentAccumulator();

    const resolvedSourceUrl = await this.resolvePortalSourceUrl(portalId);
    if (!resolvedSourceUrl) {
      errors.push(`Missing enabled ${portalId} portal fallbackUrl.`);
      return { scraped, upserted, errors, enrichment: toScrapeEnrichmentSummary(enrichment) };
    }

    const effectiveReference = scriptReference
      ? resolveScriptReference(scriptReference)
      : { scriptId: this.resolvePortalScriptId(portalId) };
    const scriptResult = await this.runScraperScript(effectiveReference, {
      sourceUrl: resolvedSourceUrl,
    });
    if (!scriptResult.ok) {
      errors.push(scriptResult.error);
      return { scraped, upserted, errors, enrichment: toScrapeEnrichmentSummary(enrichment) };
    }

    const parsedRows = this.parseJobRows(scriptResult.parsed);
    scraped = parsedRows.rows.length;
    errors.push(...parsedRows.rowErrors);

    const normalizedResult = toJobSearchResult(parsedRows.rows);
    const now = new Date().toISOString();
    const aiService = await this.createScrapeEnrichmentService();
    enrichment.enabled = aiService !== null;
    await Promise.allSettled(
      normalizedResult.jobs.map((job, index) =>
        runWithErrorCollection(async () => {
          const enrichmentAttempt = await this.enrichJobRow(parsedRows.rows[index] ?? {
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            url: job.url,
            source: job.source,
            contentHash: job.contentHash,
            postDate: job.postedDate,
            remote: job.remote,
          }, aiService);
          await this.persistScrapedJobRow(job, now, enrichmentAttempt, enrichment);
          upserted += 1;
        }, errors),
      ),
    );

    return { scraped, upserted, errors, enrichment: toScrapeEnrichmentSummary(enrichment) };
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
  async scrapeStudios(): Promise<ScraperOperationResult> {
    const errors: string[] = [];
    let scraped = 0;
    let upserted = 0;
    const enrichment = createScrapeEnrichmentAccumulator();

    const scriptResult = await this.runScraperScript({
      scriptId: STUDIO_SCRAPER_SCRIPT_ID,
    });
    if (!scriptResult.ok) {
      errors.push(scriptResult.error);
      return { scraped, upserted, errors, enrichment: toScrapeEnrichmentSummary(enrichment) };
    }

    const parsedRows = this.parseStudioRows(scriptResult.parsed);
    scraped = parsedRows.rows.length;
    errors.push(...parsedRows.rowErrors);

    const now = new Date().toISOString();
    const aiService = await this.createScrapeEnrichmentService();
    enrichment.enabled = aiService !== null;
    await Promise.allSettled(
      parsedRows.rows.map((studioRow) =>
        runWithErrorCollection(async () => {
          const enrichmentAttempt = await this.enrichStudioRow(studioRow, aiService);
          await this.persistScrapedStudioRow(studioRow, now, enrichmentAttempt, enrichment);
          upserted += 1;
        }, errors),
      ),
    );

    return { scraped, upserted, errors, enrichment: toScrapeEnrichmentSummary(enrichment) };
  }

  /**
   * Scrapes jobs from Hitmarker and validates normalized output shape.
   */
  async scrapeHitmarkerJobsRaw(
    sourceUrl?: string,
    scriptReference: AutomationScriptId | ScriptReferenceOverride = HITMARKER_SCRIPT_ID,
  ): Promise<ScrapedJob[]> {
    return this.scrapePortalJobsRaw("hitmarker", sourceUrl, scriptReference);
  }

  /**
   * Scrapes jobs from Grackle and validates normalized output shape.
   */
  async scrapeGrackleJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    return this.scrapePortalJobsRaw("grackle", sourceUrl);
  }

  /**
   * Scrapes jobs from WorkWithIndies and validates normalized output shape.
   */
  async scrapeWorkWithIndiesJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    return this.scrapePortalJobsRaw("workwithindies", sourceUrl);
  }

  /**
   * Scrapes jobs from RemoteGameJobs and validates normalized output shape.
   */
  async scrapeRemoteGameJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    return this.scrapePortalJobsRaw("remotegamejobs", sourceUrl);
  }

  /**
   * Scrapes jobs from GamesJobsDirect and validates normalized output shape.
   */
  async scrapeGamesJobsDirectRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    return this.scrapePortalJobsRaw("gamesjobsdirect", sourceUrl);
  }

  /**
   * Scrapes jobs from PocketGamer and validates normalized output shape.
   */
  async scrapePocketGamerJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    return this.scrapePortalJobsRaw("pocketgamer", sourceUrl);
  }

  /**
   * Scrapes and upserts Hitmarker jobs with row-level error reporting.
   */
  async scrapeHitmarkerJobs(
    scriptReference: AutomationScriptId | ScriptReferenceOverride = HITMARKER_SCRIPT_ID,
  ): Promise<ScraperOperationResult> {
    return this.scrapePortalJobs("hitmarker", scriptReference);
  }

  /**
   * Scrapes and upserts jobs for a supported job-board scrape target.
   */
  async scrapeJobsForTarget(
    target: AutomationJobScrapeTarget,
  ): Promise<ScraperOperationResult> {
    return this.scrapePortalJobs(automationScrapeTargetToPortalId(target));
  }

  /**
   * Scrapes and upserts jobs for a supported gaming portal id.
   */
  async scrapeJobsForPortal(
    portalId: GamingPortalId,
  ): Promise<ScraperOperationResult> {
    return this.scrapePortalJobs(portalId);
  }
}

export const scraperService = new ScraperService();
