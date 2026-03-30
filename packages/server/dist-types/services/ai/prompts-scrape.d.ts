import type { ScrapedJob, ScrapedStudio } from "@bao/shared";
/**
 * Scrape enrichment prompt for a normalized scraped job row.
 */
export declare function scrapeJobEnrichmentPrompt(job: ScrapedJob): string;
/**
 * Scrape enrichment prompt for a normalized scraped studio row.
 */
export declare function scrapeStudioEnrichmentPrompt(studio: ScrapedStudio): string;
