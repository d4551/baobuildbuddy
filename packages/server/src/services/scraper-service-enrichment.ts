import {
  AI_DEFAULT_TEMPERATURE_STRUCTURED,
  AI_MAX_TOKENS_SCRAPE_ENRICHMENT,
  DEFAULT_SETTINGS_ID,
  normalizeScrapePersonaEnrichment,
  safeParseJson,
  settle,
  toErrorMessage,
  type ScrapeEnrichmentRunSummary,
  type ScrapedJob,
  type ScrapedStudio,
} from "@bao/shared";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { settings } from "../db/schema/settings";
import { AIService } from "./ai/ai-service";
import { scrapeJobEnrichmentPrompt, scrapeStudioEnrichmentPrompt } from "./ai/prompts-scrape";
import type {
  ScrapeEnrichmentAccumulator,
  ScrapeEnrichmentAttempt,
} from "./scraper-service-contracts";
import { SCRAPE_ENRICHMENT_WARNING_LIMIT } from "./scraper-service-contracts";

export const createScrapeEnrichmentAccumulator = (): ScrapeEnrichmentAccumulator => ({
  enabled: true,
  enrichedRecords: 0,
  warnings: [],
});

export const toScrapeEnrichmentSummary = (
  accumulator: ScrapeEnrichmentAccumulator,
): ScrapeEnrichmentRunSummary => ({
  enabled: accumulator.enabled,
  enrichedRecords: accumulator.enrichedRecords,
  warnings: accumulator.warnings,
  ...(accumulator.provider ? { provider: accumulator.provider } : {}),
  ...(accumulator.model ? { model: accumulator.model } : {}),
});

export const pushScrapeEnrichmentWarning = (
  accumulator: ScrapeEnrichmentAccumulator,
  warning: string,
): void => {
  if (warning.length === 0 || accumulator.warnings.length >= SCRAPE_ENRICHMENT_WARNING_LIMIT) {
    return;
  }
  accumulator.warnings.push(warning);
};

export const createScrapeEnrichmentService = async (): Promise<AIService | null> => {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.id, DEFAULT_SETTINGS_ID))
    .limit(1);
  const settingsRow = rows[0];
  if (!settingsRow) {
    return null;
  }
  return AIService.fromSettings(settingsRow);
};

export const enrichStudioRow = async (
  studioRow: ScrapedStudio,
  aiService: AIService | null,
): Promise<ScrapeEnrichmentAttempt> => {
  if (!aiService) {
    return {
      warning: "Scrape enrichment skipped because settings are unavailable.",
    };
  }

  const responseResult = await settle(
    aiService.generate(scrapeStudioEnrichmentPrompt(studioRow), {
      purpose: "scrapeEnrichment",
      temperature: AI_DEFAULT_TEMPERATURE_STRUCTURED,
      maxTokens: AI_MAX_TOKENS_SCRAPE_ENRICHMENT,
    }),
  );
  if (responseResult.status === "rejected") {
    return {
      warning: `Studio enrichment failed for ${studioRow.name}: ${toErrorMessage(responseResult.reason)}`,
    };
  }

  const enrichment = normalizeScrapePersonaEnrichment(safeParseJson(responseResult.value.content));
  if (!enrichment) {
    return {
      warning: `Studio enrichment returned invalid JSON for ${studioRow.name}.`,
    };
  }

  return {
    enrichment: {
      ...enrichment,
      updatedAt: new Date().toISOString(),
      provider: responseResult.value.provider,
      model: responseResult.value.model,
    },
    provider: responseResult.value.provider,
    model: responseResult.value.model,
  };
};

export const enrichJobRow = async (
  jobRow: ScrapedJob,
  aiService: AIService | null,
): Promise<ScrapeEnrichmentAttempt> => {
  if (!aiService) {
    return {
      warning: "Scrape enrichment skipped because settings are unavailable.",
    };
  }

  const responseResult = await settle(
    aiService.generate(scrapeJobEnrichmentPrompt(jobRow), {
      purpose: "scrapeEnrichment",
      temperature: AI_DEFAULT_TEMPERATURE_STRUCTURED,
      maxTokens: AI_MAX_TOKENS_SCRAPE_ENRICHMENT,
    }),
  );
  if (responseResult.status === "rejected") {
    return {
      warning: `Job enrichment failed for ${jobRow.title} at ${jobRow.company}: ${toErrorMessage(responseResult.reason)}`,
    };
  }

  const enrichment = normalizeScrapePersonaEnrichment(safeParseJson(responseResult.value.content));
  if (!enrichment) {
    return {
      warning: `Job enrichment returned invalid JSON for ${jobRow.title} at ${jobRow.company}.`,
    };
  }

  return {
    enrichment: {
      ...enrichment,
      updatedAt: new Date().toISOString(),
      provider: responseResult.value.provider,
      model: responseResult.value.model,
    },
    provider: responseResult.value.provider,
    model: responseResult.value.model,
  };
};
