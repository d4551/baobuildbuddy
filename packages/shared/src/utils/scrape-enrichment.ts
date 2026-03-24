import { AI_PROVIDER_IDS, type AIProviderType } from "../types/ai";
import type { ScrapePersonaEnrichment } from "../types/jobs";
import { asRecord, asString, asStringArray } from "./type-guards";

const SCRAPE_ENRICHMENT_LIST_LIMIT = 4;

const isAIProviderType = (value: string): value is AIProviderType =>
  AI_PROVIDER_IDS.some((provider) => provider === value);

/**
 * Normalizes unknown scrape-enrichment payloads into the shared contract.
 */
export function normalizeScrapePersonaEnrichment(
  value: unknown,
): ScrapePersonaEnrichment | undefined {
  const record = asRecord(value);
  if (!record) {
    return;
  }

  const summary = asString(record.summary);
  if (!summary) {
    return;
  }

  const normalized: ScrapePersonaEnrichment = {
    summary,
    hiringSignals: asStringArray(record.hiringSignals).slice(0, SCRAPE_ENRICHMENT_LIST_LIMIT),
    interviewFocusAreas: asStringArray(record.interviewFocusAreas).slice(
      0,
      SCRAPE_ENRICHMENT_LIST_LIMIT,
    ),
    candidatePitchAngles: asStringArray(record.candidatePitchAngles).slice(
      0,
      SCRAPE_ENRICHMENT_LIST_LIMIT,
    ),
  };

  const provider = asString(record.provider);
  const model = asString(record.model);
  const updatedAt = asString(record.updatedAt);

  if (provider && isAIProviderType(provider)) {
    normalized.provider = provider;
  }
  if (model) {
    normalized.model = model;
  }
  if (updatedAt) {
    normalized.updatedAt = updatedAt;
  }

  return normalized;
}
