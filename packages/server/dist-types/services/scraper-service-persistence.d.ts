import type { ScrapedStudio } from "@bao/shared/schemas/automation-scripts.schema";
import type { JobSearchResult, ScrapePersonaEnrichment } from "@bao/shared/types/jobs";
import type { GamingPortalId } from "@bao/shared/types/settings-contracts";
import type { ScrapeEnrichmentAccumulator, ScrapeEnrichmentAttempt } from "./scraper-service-contracts";
export declare const runWithErrorCollection: (operation: () => Promise<void>, errors: string[]) => Promise<void>;
export declare const resolvePortalSourceUrl: (portalId: GamingPortalId) => Promise<string | null>;
export declare const resolvePortalScriptId: (portalId: GamingPortalId) => "scraper-gamesjobsdirect" | "scraper-grackle" | "scraper-hitmarker" | "scraper-pocketgamer" | "scraper-remotegamejobs" | "scraper-workwithindies";
export declare const upsertStudioRow: (studioRow: ScrapedStudio, now: string, enrichment?: ScrapePersonaEnrichment) => Promise<void>;
/**
 * Row identity for the `jobs_content_hash_idx` upsert target.
 *
 * The fallback used to be `job.id`, which is regenerated on every scrape run. When a
 * provider produced no `contentHash`, each run therefore wrote a different identity,
 * `onConflictDoUpdate` never matched, and re-scraping inserted a full duplicate set —
 * the jobs list doubled on every run while the result still reported `upserted: N`.
 * Verified against the live database: the same posting existed twice, once with a
 * `hitmarker-…` hash and once with a bare `job.id` hash.
 *
 * The fallback is now derived from the posting's own stable fields, so identity is
 * reproducible across runs even when a provider omits its hash.
 */
export declare const resolveJobContentHash: (job: JobSearchResult["jobs"][number]) => string;
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
