import { type AutomationScriptId, type ScrapedJob } from "@bao/shared";
export type { ScrapedJob };
type ScriptReferenceOverride = {
    scriptPath: string;
};
/**
 * Scraper service for studio/job ingestion via Python scripts.
 */
export declare class ScraperService {
    private resolvePortalSourceUrl;
    private upsertStudioRow;
    private insertScrapedJobIfMissing;
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
}
export declare const scraperService: ScraperService;
