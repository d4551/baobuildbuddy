import { z } from "zod";
declare const scrapedJobSchema: z.ZodObject<{
    title: z.ZodString;
    company: z.ZodString;
    location: z.ZodString;
    remote: z.ZodOptional<z.ZodBoolean>;
    description: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
    contentHash: z.ZodOptional<z.ZodString>;
    postDate: z.ZodOptional<z.ZodString>;
    postedDate: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ScrapedJob = z.infer<typeof scrapedJobSchema>;
/**
 * Scraper service for studio/job ingestion via Python scripts.
 */
export declare class ScraperService {
    private upsertStudioRow;
    private insertScrapedJobIfMissing;
    /**
     * Runs a Python scraper script and returns parsed JSON payload.
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
     * Scrapes jobs from GameDev.net and validates normalized output shape.
     */
    scrapeGameDevNetJobsRaw(sourceUrl?: string, scriptName?: string): Promise<ScrapedJob[]>;
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
     * Scrapes and upserts GameDev.net jobs with row-level error reporting.
     */
    scrapeGameDevNetJobs(scriptName?: string): Promise<{
        scraped: number;
        upserted: number;
        errors: string[];
    }>;
}
export declare const scraperService: ScraperService;
export {};
