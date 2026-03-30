import { type ScrapeEnrichmentRunSummary, type ScrapedJob, type ScrapedStudio } from "@bao/shared";
import { AIService } from "./ai/ai-service";
import type { ScrapeEnrichmentAccumulator, ScrapeEnrichmentAttempt } from "./scraper-service-contracts";
export declare const createScrapeEnrichmentAccumulator: () => ScrapeEnrichmentAccumulator;
export declare const toScrapeEnrichmentSummary: (accumulator: ScrapeEnrichmentAccumulator) => ScrapeEnrichmentRunSummary;
export declare const pushScrapeEnrichmentWarning: (accumulator: ScrapeEnrichmentAccumulator, warning: string) => void;
export declare const createScrapeEnrichmentService: () => Promise<AIService | null>;
export declare const enrichStudioRow: (studioRow: ScrapedStudio, aiService: AIService | null) => Promise<ScrapeEnrichmentAttempt>;
export declare const enrichJobRow: (jobRow: ScrapedJob, aiService: AIService | null) => Promise<ScrapeEnrichmentAttempt>;
