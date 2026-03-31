import { automationScrapeTargetToPortalId, type AutomationJobScrapeTarget } from "@bao/shared/constants/automation";
import type { AutomationScriptId, ScrapedJob } from "@bao/shared/schemas/automation-scripts.schema";
import type { ScraperOperationResult } from "@bao/shared/types/jobs";
import type { GamingPortalId } from "@bao/shared/types/settings-contracts";
import type { ScriptReferenceOverride } from "./scraper-service-contracts";
import { PORTAL_SCRIPT_ID_BY_ID, STUDIO_SCRAPER_SCRIPT_ID } from "./scraper-service-contracts";
import {
  createScrapeEnrichmentAccumulator,
  createScrapeEnrichmentService,
  enrichJobRow,
  enrichStudioRow,
  pushScrapeEnrichmentWarning,
  toScrapeEnrichmentSummary,
} from "./scraper-service-enrichment";
import {
  parseJobRows,
  parseStudioRows,
  resolveScriptReference,
  runScraperScript,
  toJobSearchResult,
} from "./scraper-service-script";
import {
  persistScrapedJobRow,
  persistScrapedStudioRow,
  resolvePortalScriptId,
  resolvePortalSourceUrl,
  runWithErrorCollection,
} from "./scraper-service-persistence";
export type { ScrapedJob } from "./scraper-service-contracts";

/**
 * Scraper service for studio/job ingestion via Bun automation scripts.
 */
export class ScraperService {
  private createScrapeFailureResult(
    errors: string[],
    enrichment = createScrapeEnrichmentAccumulator(),
  ) {
    return { scraped: 0, upserted: 0, errors, enrichment: toScrapeEnrichmentSummary(enrichment) };
  }

  private async runPortalJobScript(
    portalId: GamingPortalId,
    sourceUrl: string,
    scriptReference?: AutomationScriptId | ScriptReferenceOverride,
  ) {
    const effectiveReference = scriptReference
      ? resolveScriptReference(scriptReference)
      : { scriptId: resolvePortalScriptId(portalId) };
    return await runScraperScript(effectiveReference, { sourceUrl });
  }

  private async persistPortalJobs(params: {
    parsedRows: ReturnType<typeof parseJobRows>;
    now: string;
    enrichment: ReturnType<typeof createScrapeEnrichmentAccumulator>;
    errors: string[];
  }) {
    let upserted = 0;
    const normalizedResult = toJobSearchResult(params.parsedRows.rows);
    const aiService = await createScrapeEnrichmentService();
    params.enrichment.enabled = aiService !== null;

    await Promise.allSettled(
      normalizedResult.jobs.map((job, index) =>
        runWithErrorCollection(async () => {
          const sourceRow = params.parsedRows.rows[index] ?? {
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            url: job.url,
            source: job.source,
            contentHash: job.contentHash,
            postDate: job.postedDate,
            remote: job.remote,
          };
          const enrichmentAttempt = await enrichJobRow(sourceRow, aiService);
          await persistScrapedJobRow(job, {
            now: params.now,
            enrichmentAttempt,
            enrichmentAccumulator: params.enrichment,
            pushWarning: pushScrapeEnrichmentWarning,
          });
          upserted += 1;
        }, params.errors),
      ),
    );

    return upserted;
  }

  private async scrapePortalJobsRaw(
    portalId: GamingPortalId,
    sourceUrl?: string,
    scriptReference?: AutomationScriptId | ScriptReferenceOverride,
  ): Promise<ScrapedJob[]> {
    const resolvedSourceUrl = sourceUrl ?? (await resolvePortalSourceUrl(portalId));
    if (!resolvedSourceUrl) {
      return [];
    }

    const effectiveReference = scriptReference
      ? resolveScriptReference(scriptReference)
      : { scriptId: resolvePortalScriptId(portalId) };
    const scriptResult = await runScraperScript(effectiveReference, {
      sourceUrl: resolvedSourceUrl,
    });

    if (!scriptResult.ok) {
      return [];
    }

    return parseJobRows(scriptResult.parsed).rows;
  }

  private async scrapePortalJobs(
    portalId: GamingPortalId,
    scriptReference?: AutomationScriptId | ScriptReferenceOverride,
  ): Promise<ScraperOperationResult> {
    const errors: string[] = [];
    const enrichment = createScrapeEnrichmentAccumulator();

    const resolvedSourceUrl = await resolvePortalSourceUrl(portalId);
    if (!resolvedSourceUrl) {
      errors.push(`Missing enabled ${portalId} portal fallbackUrl.`);
      return this.createScrapeFailureResult(errors, enrichment);
    }

    const scriptResult = await this.runPortalJobScript(
      portalId,
      resolvedSourceUrl,
      scriptReference,
    );

    if (!scriptResult.ok) {
      errors.push(scriptResult.error);
      return this.createScrapeFailureResult(errors, enrichment);
    }

    const parsedRows = parseJobRows(scriptResult.parsed);
    errors.push(...parsedRows.rowErrors);
    const now = new Date().toISOString();
    const upserted = await this.persistPortalJobs({ parsedRows, now, enrichment, errors });

    return {
      scraped: parsedRows.rows.length,
      upserted,
      errors,
      enrichment: toScrapeEnrichmentSummary(enrichment),
    };
  }

  async scrapeStudios(): Promise<ScraperOperationResult> {
    const errors: string[] = [];
    let scraped = 0;
    let upserted = 0;
    const enrichment = createScrapeEnrichmentAccumulator();

    const scriptResult = await runScraperScript({
      scriptId: STUDIO_SCRAPER_SCRIPT_ID,
    });
    if (!scriptResult.ok) {
      errors.push(scriptResult.error);
      return { scraped, upserted, errors, enrichment: toScrapeEnrichmentSummary(enrichment) };
    }

    const parsedRows = parseStudioRows(scriptResult.parsed);
    scraped = parsedRows.rows.length;
    errors.push(...parsedRows.rowErrors);

    const now = new Date().toISOString();
    const aiService = await createScrapeEnrichmentService();
    enrichment.enabled = aiService !== null;

    await Promise.allSettled(
      parsedRows.rows.map((studioRow) =>
        runWithErrorCollection(async () => {
          const enrichmentAttempt = await enrichStudioRow(studioRow, aiService);
          await persistScrapedStudioRow(studioRow, {
            now,
            enrichmentAttempt,
            enrichmentAccumulator: enrichment,
            pushWarning: pushScrapeEnrichmentWarning,
          });
          upserted += 1;
        }, errors),
      ),
    );

    return { scraped, upserted, errors, enrichment: toScrapeEnrichmentSummary(enrichment) };
  }

  async scrapeHitmarkerJobsRaw(
    sourceUrl?: string,
    scriptReference:
      | AutomationScriptId
      | ScriptReferenceOverride = PORTAL_SCRIPT_ID_BY_ID.hitmarker,
  ): Promise<ScrapedJob[]> {
    return this.scrapePortalJobsRaw("hitmarker", sourceUrl, scriptReference);
  }

  async scrapeGrackleJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    return this.scrapePortalJobsRaw("grackle", sourceUrl);
  }

  async scrapeWorkWithIndiesJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    return this.scrapePortalJobsRaw("workwithindies", sourceUrl);
  }

  async scrapeRemoteGameJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    return this.scrapePortalJobsRaw("remotegamejobs", sourceUrl);
  }

  async scrapeGamesJobsDirectRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    return this.scrapePortalJobsRaw("gamesjobsdirect", sourceUrl);
  }

  async scrapePocketGamerJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    return this.scrapePortalJobsRaw("pocketgamer", sourceUrl);
  }

  async scrapeHitmarkerJobs(
    scriptReference:
      | AutomationScriptId
      | ScriptReferenceOverride = PORTAL_SCRIPT_ID_BY_ID.hitmarker,
  ): Promise<ScraperOperationResult> {
    return this.scrapePortalJobs("hitmarker", scriptReference);
  }

  async scrapeJobsForTarget(target: AutomationJobScrapeTarget): Promise<ScraperOperationResult> {
    return this.scrapePortalJobs(automationScrapeTargetToPortalId(target));
  }

  async scrapeJobsForPortal(portalId: GamingPortalId): Promise<ScraperOperationResult> {
    return this.scrapePortalJobs(portalId);
  }
}

export const scraperService = new ScraperService();
