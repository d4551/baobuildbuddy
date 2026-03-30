import { type GamingPortalId, type JobSearchResult, type ScrapePersonaEnrichment, type ScrapedStudio } from "@bao/shared";
import type { ScrapeEnrichmentAccumulator, ScrapeEnrichmentAttempt } from "./scraper-service-contracts";
export declare const runWithErrorCollection: (operation: () => Promise<void>, errors: string[]) => Promise<void>;
export declare const resolvePortalSourceUrl: (portalId: GamingPortalId) => Promise<string | null>;
export declare const resolvePortalScriptId: (portalId: GamingPortalId) => "scraper-hitmarker" | "scraper-grackle" | "scraper-workwithindies" | "scraper-remotegamejobs" | "scraper-gamesjobsdirect" | "scraper-pocketgamer";
export declare const upsertStudioRow: (studioRow: ScrapedStudio, now: string, enrichment?: ScrapePersonaEnrichment) => Promise<void>;
export declare const upsertScrapedJob: (job: JobSearchResult["jobs"][number], now: string, enrichment?: ScrapePersonaEnrichment) => Promise<void>;
export declare const persistScrapedJobRow: (job: JobSearchResult["jobs"][number], now: string, enrichmentAttempt: ScrapeEnrichmentAttempt, enrichmentAccumulator: ScrapeEnrichmentAccumulator, pushWarning: (accumulator: ScrapeEnrichmentAccumulator, warning: string) => void) => Promise<void>;
export declare const persistScrapedStudioRow: (studioRow: ScrapedStudio, now: string, enrichmentAttempt: ScrapeEnrichmentAttempt, enrichmentAccumulator: ScrapeEnrichmentAccumulator, pushWarning: (accumulator: ScrapeEnrichmentAccumulator, warning: string) => void) => Promise<void>;
