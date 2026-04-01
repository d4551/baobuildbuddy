import { type AutomationScriptId, type ScrapedJob, type ScrapedStudio } from "@bao/shared/schemas/automation-scripts.schema";
import type { JobSearchResult, ScrapeEnrichmentRunSummary, ScrapePersonaEnrichment } from "@bao/shared/types/jobs";
export type ScriptInputPayload = {
    sourceUrl?: string;
};
export type ScriptExecutionOptions = {
    timeoutMs?: number;
    signal?: AbortSignal;
};
export type ScriptRows<T> = {
    rows: T[];
    rowErrors: string[];
};
export type ScraperScriptExecutionResult = {
    ok: true;
    parsed: unknown;
    stderrLines: string[];
} | {
    ok: false;
    error: string;
    stderrLines: string[];
};
export type AutomationScriptReference = {
    scriptId?: AutomationScriptId;
    scriptPath?: string;
};
export type ScriptReferenceOverride = {
    scriptPath: string;
};
export type ScrapeEnrichmentAttempt = {
    enrichment?: ScrapePersonaEnrichment;
    warning?: string;
    provider?: ScrapeEnrichmentRunSummary["provider"];
    model?: string;
};
export type ScrapeEnrichmentAccumulator = {
    enabled: boolean;
    enrichedRecords: number;
    warnings: string[];
    provider?: ScrapeEnrichmentRunSummary["provider"];
    model?: string;
};
export declare const STUDIO_SCRAPER_SCRIPT_ID: AutomationScriptId;
export declare const DEFAULT_JOB_POSTED_DATE = "";
export declare const DEFAULT_JOB_TYPE = "full-time";
export declare const DEFAULT_JOB_SOURCE = "unknown-source";
export declare const CONTENT_HASH_PREFIX = "job";
export declare const CONTENT_HASH_LENGTH = 24;
export declare const SCRAPE_ENRICHMENT_WARNING_LIMIT = 25;
export declare const PORTAL_SCRIPT_ID_BY_ID: {
    readonly hitmarker: "scraper-hitmarker";
    readonly grackle: "scraper-grackle";
    readonly workwithindies: "scraper-workwithindies";
    readonly remotegamejobs: "scraper-remotegamejobs";
    readonly gamesjobsdirect: "scraper-gamesjobsdirect";
    readonly pocketgamer: "scraper-pocketgamer";
};
export type { JobSearchResult, ScrapedJob, ScrapedStudio };
