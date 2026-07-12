import type { ScrapedStudio } from "@bao/shared/schemas/automation-scripts.schema";
import type { JobSearchResult, ScrapePersonaEnrichment } from "@bao/shared/types/jobs";
import type { GamingPortalId } from "@bao/shared/types/settings-contracts";
import type { ScrapeEnrichmentAccumulator, ScrapeEnrichmentAttempt } from "./scraper-service-contracts";
export declare const runWithErrorCollection: (operation: () => Promise<void>, errors: string[]) => Promise<void>;
export declare const resolvePortalSourceUrl: (portalId: GamingPortalId) => Promise<string | null>;
export declare const resolvePortalScriptId: (portalId: GamingPortalId) => "scraper-gamesjobsdirect" | "scraper-grackle" | "scraper-hitmarker" | "scraper-pocketgamer" | "scraper-remotegamejobs" | "scraper-workwithindies";
export declare const upsertStudioRow: (studioRow: ScrapedStudio, now: string, enrichment?: ScrapePersonaEnrichment) => Promise<void>;
export declare const upsertScrapedJob: (job: JobSearchResult["jobs"][number], now: string, enrichment?: ScrapePersonaEnrichment) => Promise<void>;
type PersistScrapedEntityOptions = {
    now: string;
    enrichmentAttempt: ScrapeEnrichmentAttempt;
    enrichmentAccumulator: ScrapeEnrichmentAccumulator;
    pushWarning: (accumulator: ScrapeEnrichmentAccumulator, warning: string) => void;
};
export declare const persistScrapedJobRow: (job: JobSearchResult["jobs"][number], options: PersistScrapedEntityOptions) => Promise<void>;
export declare const persistScrapedStudioRow: (studioRow: ScrapedStudio, options: PersistScrapedEntityOptions) => Promise<void>;
export {};
