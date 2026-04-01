import { type AutomationJobScrapeTarget } from "@bao/shared/constants/automation";
import type { AutomationScriptId, ScrapedJob } from "@bao/shared/schemas/automation-scripts.schema";
import type { ScraperOperationResult } from "@bao/shared/types/jobs";
import type { GamingPortalId } from "@bao/shared/types/settings-contracts";
import type { ScriptReferenceOverride } from "./scraper-service-contracts";
export type { ScrapedJob } from "./scraper-service-contracts";
/**
 * Scraper service for studio/job ingestion via Bun automation scripts.
 */
export declare class ScraperService {
    private createScrapeFailureResult;
    private runPortalJobScript;
    private persistPortalJobs;
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
