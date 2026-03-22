import { type AutomationJobScrapeTarget, type AutomationScriptId, type GamingPortalId, type ScrapedJob } from "@bao/shared";
export type { ScrapedJob };
type ScriptReferenceOverride = {
    scriptPath: string;
};
/**
 * Scraper service for studio/job ingestion via Bun automation scripts.
 */
export declare class ScraperService {
    private resolvePortalSourceUrl;
    /**
     * Resolve the configured automation script id for a portal-backed scraper.
     */
    private resolvePortalScriptId;
    private upsertStudioRow;
    private insertScrapedJobIfMissing;
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
    scrapeStudios(): Promise<{
        scraped: number;
        upserted: number;
        errors: string[];
    }>;
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
    scrapeHitmarkerJobs(scriptReference?: AutomationScriptId | ScriptReferenceOverride): Promise<{
        scraped: number;
        upserted: number;
        errors: string[];
    }>;
    /**
     * Scrapes and upserts jobs for a supported job-board scrape target.
     */
    scrapeJobsForTarget(target: AutomationJobScrapeTarget): Promise<{
        scraped: number;
        upserted: number;
        errors: string[];
    }>;
    /**
     * Scrapes and upserts jobs for a supported gaming portal id.
     */
    scrapeJobsForPortal(portalId: GamingPortalId): Promise<{
        scraped: number;
        upserted: number;
        errors: string[];
    }>;
}
export declare const scraperService: ScraperService;
