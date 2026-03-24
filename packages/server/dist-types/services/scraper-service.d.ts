import { type AutomationJobScrapeTarget, type AutomationScriptId, type GamingPortalId, type ScraperOperationResult, type ScrapedJob } from "@bao/shared";
export type { ScrapedJob };
type ScriptReferenceOverride = {
    scriptPath: string;
};
/**
 * Scraper service for studio/job ingestion via Bun automation scripts.
 */
export declare class ScraperService {
    /**
     * Load the singleton settings row used to construct purpose-aware AI services.
     */
    private loadSettingsRow;
    /**
     * Create the AI service used for scrape enrichment when settings are available.
     */
    private createScrapeEnrichmentService;
    /**
     * Generate studio persona enrichment for one scraped studio row.
     */
    private enrichStudioRow;
    /**
     * Generate job persona enrichment for one scraped job row.
     */
    private enrichJobRow;
    private resolvePortalSourceUrl;
    /**
     * Resolve the configured automation script id for a portal-backed scraper.
     */
    private resolvePortalScriptId;
    /**
     * Upsert a scraped studio row and persist the latest enrichment snapshot.
     */
    private upsertStudioRow;
    /**
     * Upsert a scraped job row keyed by deterministic content hash and persist enrichment.
     */
    private upsertScrapedJob;
    /**
     * Upsert a scraped job row and update the enrichment summary in-memory.
     */
    private persistScrapedJobRow;
    /**
     * Upsert a scraped studio row and update the enrichment summary in-memory.
     */
    private persistScrapedStudioRow;
    /**
     * Scrape normalized rows for a configured gaming portal.
     */
    private scrapePortalJobsRaw;
    /**
     * Scrape and upsert jobs for a configured gaming portal.
     */
    private scrapePortalJobs;
    /**
     * Runs a Bun automation scraper script and returns parsed JSON payload.
     */
    private runScraperScript;
    /**
     * Parses studio rows and collects row-level schema validation errors.
     */
    private parseStudioRows;
    /**
     * Parses job rows and collects row-level schema validation errors.
     */
    private parseJobRows;
    /**
     * Scrapes and upserts studio data.
     */
    scrapeStudios(): Promise<ScraperOperationResult>;
    /**
     * Scrapes jobs from Hitmarker and validates normalized output shape.
     */
    scrapeHitmarkerJobsRaw(sourceUrl?: string, scriptReference?: AutomationScriptId | ScriptReferenceOverride): Promise<ScrapedJob[]>;
    /**
     * Scrapes jobs from Grackle and validates normalized output shape.
     */
    scrapeGrackleJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]>;
    /**
     * Scrapes jobs from WorkWithIndies and validates normalized output shape.
     */
    scrapeWorkWithIndiesJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]>;
    /**
     * Scrapes jobs from RemoteGameJobs and validates normalized output shape.
     */
    scrapeRemoteGameJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]>;
    /**
     * Scrapes jobs from GamesJobsDirect and validates normalized output shape.
     */
    scrapeGamesJobsDirectRaw(sourceUrl?: string): Promise<ScrapedJob[]>;
    /**
     * Scrapes jobs from PocketGamer and validates normalized output shape.
     */
    scrapePocketGamerJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]>;
    /**
     * Scrapes and upserts Hitmarker jobs with row-level error reporting.
     */
    scrapeHitmarkerJobs(scriptReference?: AutomationScriptId | ScriptReferenceOverride): Promise<ScraperOperationResult>;
    /**
     * Scrapes and upserts jobs for a supported job-board scrape target.
     */
    scrapeJobsForTarget(target: AutomationJobScrapeTarget): Promise<ScraperOperationResult>;
    /**
     * Scrapes and upserts jobs for a supported gaming portal id.
     */
    scrapeJobsForPortal(portalId: GamingPortalId): Promise<ScraperOperationResult>;
}
export declare const scraperService: ScraperService;
