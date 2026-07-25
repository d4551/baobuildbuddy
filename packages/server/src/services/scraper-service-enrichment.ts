import {
  AI_DEFAULT_TEMPERATURE_STRUCTURED,
  AI_MAX_TOKENS_SCRAPE_ENRICHMENT,
} from "@bao/shared/constants/ai-generation";
import { COUNT_FOUR } from "@bao/shared/constants/numeric";
import type { ScrapedJob, ScrapedStudio } from "@bao/shared/schemas/automation-scripts.schema";
import type { ScrapeEnrichmentRunSummary, ScrapePersonaEnrichment } from "@bao/shared/types/jobs";
import { DEFAULT_SETTINGS_ID } from "@bao/shared/types/settings-defaults";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import { safeParseJson } from "@bao/shared/utils/json";
import { settle } from "@bao/shared/utils/promise";
import { normalizeScrapePersonaEnrichment } from "@bao/shared/utils/scrape-enrichment";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { settings } from "../db/schema/settings";
import { decryptProviderKeys } from "../utils/settings-decrypt";
import { AIService } from "./ai/ai-service";
import { scrapeJobEnrichmentPrompt, scrapeStudioEnrichmentPrompt } from "./ai/prompts-scrape";
import type {
  ScrapeEnrichmentAccumulator,
  ScrapeEnrichmentAttempt,
} from "./scraper-service-contracts";
import { SCRAPE_ENRICHMENT_WARNING_LIMIT } from "./scraper-service-contracts";

const JSON_CODE_FENCE_PATTERN = /```(?:json)?\s*([\s\S]*?)```/iu;
const JSON_OBJECT_PATTERN = /\{[\s\S]*\}/u;
const SENTENCE_END_PATTERN = /[.!?]$/u;

const formatRemoteWorkHiringSignal = (
  remoteWork: boolean | null | undefined,
): string | undefined => {
  if (remoteWork === null || remoteWork === undefined) {
    return undefined;
  }
  return remoteWork ? "Remote work is supported." : "Remote work is not emphasized.";
};

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
  return AIService.fromSettings({ ...settingsRow, ...decryptProviderKeys(settingsRow) });
};

const extractScrapeEnrichmentJson = (content: string): string => {
  const trimmed = content.trim();
  const codeFenceMatch = trimmed.match(JSON_CODE_FENCE_PATTERN);
  if (typeof codeFenceMatch?.[1] === "string" && codeFenceMatch[1].trim().length > 0) {
    return codeFenceMatch[1].trim();
  }

  const objectMatch = trimmed.match(JSON_OBJECT_PATTERN);
  if (typeof objectMatch?.[0] === "string" && objectMatch[0].trim().length > 0) {
    return objectMatch[0].trim();
  }

  return trimmed;
};

export const parseScrapeEnrichmentContent = (
  content: string,
): ReturnType<typeof normalizeScrapePersonaEnrichment> =>
  normalizeScrapePersonaEnrichment(safeParseJson(extractScrapeEnrichmentJson(content)));

const toSentence = (value: string | undefined, fallback: string): string => {
  const normalized = value?.trim();
  if (!normalized) {
    return fallback;
  }
  return SENTENCE_END_PATTERN.test(normalized) ? normalized : `${normalized}.`;
};

const compactList = (items: readonly (string | undefined)[]): string[] => {
  const unique = new Set<string>();
  for (const item of items) {
    const normalized = item?.trim();
    if (!normalized) {
      continue;
    }
    unique.add(normalized);
  }
  return Array.from(unique).slice(0, COUNT_FOUR);
};

export const buildFallbackJobEnrichment = (jobRow: ScrapedJob): ScrapePersonaEnrichment => {
  const remoteSignal = jobRow.remote
    ? "Remote collaboration expectations are explicit."
    : `Location is listed as ${jobRow.location}.`;

  return {
    summary: toSentence(
      jobRow.description,
      `${jobRow.title} is an active opening at ${jobRow.company} sourced from ${jobRow.source ?? "the configured feed"}`,
    ),
    hiringSignals: compactList([
      `${jobRow.title} is the stated role.`,
      `${jobRow.company} is the hiring company.`,
      remoteSignal,
      jobRow.postDate ? `Posting date is listed as ${jobRow.postDate}.` : undefined,
    ]),
    interviewFocusAreas: compactList([
      `Role expectations tied to ${jobRow.title}.`,
      `Examples of impact relevant to ${jobRow.company}.`,
      jobRow.description ? "Specific scenarios drawn from the posting description." : undefined,
      jobRow.remote ? "Remote delivery and communication examples." : undefined,
    ]),
    candidatePitchAngles: compactList([
      `Connect past outcomes to ${jobRow.title}.`,
      `Show why ${jobRow.company} is a strong match.`,
      jobRow.description ? "Mirror the language used in the posting summary." : undefined,
      jobRow.location ? `Address fit for ${jobRow.location}.` : undefined,
    ]),
  };
};

export const buildFallbackStudioEnrichment = (
  studioRow: ScrapedStudio,
): ScrapePersonaEnrichment => ({
  summary: toSentence(
    studioRow.description,
    `${studioRow.name} is a studio profile with location and team context captured for interview preparation`,
  ),
  hiringSignals: compactList([
    studioRow.location ? `Studio location is ${studioRow.location}.` : undefined,
    studioRow.size > 0 ? `Team size is described as ${studioRow.size}.` : undefined,
    studioRow.type ? `Studio type is listed as ${studioRow.type}.` : undefined,
    formatRemoteWorkHiringSignal(studioRow.remoteWork),
  ]),
  interviewFocusAreas: compactList([
    `How your work aligns with ${studioRow.name}.`,
    studioRow.games?.length > 0
      ? `Knowledge of games such as ${studioRow.games.slice(0, 2).join(", ")}.`
      : undefined,
    studioRow.technologies?.length > 0
      ? `Experience with technologies such as ${studioRow.technologies.slice(0, 2).join(", ")}.`
      : undefined,
    studioRow.interviewStyle
      ? `Preparation for the stated interview style: ${studioRow.interviewStyle}.`
      : undefined,
  ]),
  candidatePitchAngles: compactList([
    `Explain why ${studioRow.name} matches your target studios.`,
    studioRow.description
      ? "Use the studio description to mirror product or team language."
      : undefined,
    studioRow.remoteWork ? "Highlight async collaboration and ownership." : undefined,
    studioRow.website ? `Reference the public studio presence at ${studioRow.website}.` : undefined,
  ]),
});

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

  const enrichment = parseScrapeEnrichmentContent(responseResult.value.content);
  const resolvedEnrichment = enrichment ?? buildFallbackStudioEnrichment(studioRow);

  return {
    enrichment: {
      ...resolvedEnrichment,
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

  const enrichment = parseScrapeEnrichmentContent(responseResult.value.content);
  const resolvedEnrichment = enrichment ?? buildFallbackJobEnrichment(jobRow);

  return {
    enrichment: {
      ...resolvedEnrichment,
      updatedAt: new Date().toISOString(),
      provider: responseResult.value.provider,
      model: responseResult.value.model,
    },
    provider: responseResult.value.provider,
    model: responseResult.value.model,
  };
};
