import { type AutomationJobScrapeTarget, type AutomationScriptId, type GamingPortalId, type ScraperOperationResult, type ScrapedJob } from "@bao/shared";
import type { ScriptReferenceOverride } from "./scraper-service-contracts";
export type { ScrapedJob } from "./scraper-service-contracts";
/**
 * Scraper service for studio/job ingestion via Bun automation scripts.
 */
export declare class ScraperService {
    private scrapePortalJobsRaw;
    private scrapePortalJobs;
    scrapeStudios(): Promise<ScraperOperationResult>;
    scrapeHitmarkerJobsRaw(sourceUrl?: string, scriptReference?: AutomationScriptId | ScriptReferenceOverride): Promise<ScrapedJob[]>;
    scrapeGrackleJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]>;
    scrapeWorkWithIndiesJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]>;
    scrapeRemoteGameJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]>;
    scrapeGamesJobsDirectRaw(sourceUrl?: string): Promise<ScrapedJob[]>;
    scrapePocketGamerJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]>;
    scrapeHitmarkerJobs(scriptReference?: AutomationScriptId | ScriptReferenceOverride): Promise<ScraperOperationResult>;
    scrapeJobsForTarget(target: AutomationJobScrapeTarget): Promise<ScraperOperationResult>;
    scrapeJobsForPortal(portalId: GamingPortalId): Promise<ScraperOperationResult>;
}
export declare const scraperService: ScraperService;
