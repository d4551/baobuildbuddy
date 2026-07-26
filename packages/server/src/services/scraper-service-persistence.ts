import type { ScrapedStudio } from "@bao/shared/schemas/automation-scripts.schema";
import type { JobSearchResult, ScrapePersonaEnrichment } from "@bao/shared/types/jobs";
import type { GamingPortalId } from "@bao/shared/types/settings-contracts";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import { generateId } from "@bao/shared/utils/validation";
import { db } from "../db/client";
import { jobs } from "../db/schema/jobs";
import { studios } from "../db/schema/studios";
import { extractRequirements, extractTechnologies } from "./jobs/job-aggregator-taxonomy";
import { loadJobProviderSettings } from "./jobs/providers/provider-settings";

import type {
  ScrapeEnrichmentAccumulator,
  ScrapeEnrichmentAttempt,
} from "./scraper-service-contracts";
import {
  CONTENT_HASH_LENGTH,
  DEFAULT_JOB_SOURCE,
  DEFAULT_JOB_TYPE,
  PORTAL_SCRIPT_ID_BY_ID,
} from "./scraper-service-contracts";

export const runWithErrorCollection = async (
  operation: () => Promise<void>,
  errors: string[],
): Promise<void> => {
  const [operationResult] = await Promise.allSettled([operation()]);
  if (operationResult.status === "rejected") {
    errors.push(toErrorMessage(operationResult.reason));
  }
};

export const resolvePortalSourceUrl = async (portalId: GamingPortalId): Promise<string | null> => {
  const providerSettings = await loadJobProviderSettings();
  const portalConfig =
    providerSettings.gamingPortals.find((portal) => portal.id === portalId && portal.enabled) ??
    null;

  return portalConfig?.fallbackUrl ?? null;
};

export const resolvePortalScriptId = (portalId: GamingPortalId) => PORTAL_SCRIPT_ID_BY_ID[portalId];

export const upsertStudioRow = async (
  studioRow: ScrapedStudio,
  now: string,
  enrichment?: ScrapePersonaEnrichment,
): Promise<void> => {
  const id = studioRow.id || generateId();
  const studioData = {
    name: studioRow.name,
    website: studioRow.website ?? null,
    location: studioRow.location ?? null,
    size: studioRow.size ?? null,
    type: studioRow.type ?? null,
    description: studioRow.description ?? null,
    games: studioRow.games ?? [],
    technologies: studioRow.technologies ?? [],
    interviewStyle: studioRow.interviewStyle ?? null,
    remoteWork: studioRow.remoteWork ?? null,
    enrichment: enrichment ?? null,
  };

  await db
    .insert(studios)
    .values({
      id,
      ...studioData,
      logo: null,
      culture: null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: studios.id,
      set: {
        ...studioData,
        updatedAt: now,
      },
    });
};

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
export const resolveJobContentHash = (job: JobSearchResult["jobs"][number]): string => {
  const rawContentHash = job.contentHash?.trim() ?? "";
  if (rawContentHash.length > 0) {
    return rawContentHash.slice(0, CONTENT_HASH_LENGTH);
  }

  const canonical = [job.url ?? "", job.title, job.company, job.location]
    .map((part) => String(part).trim().toLowerCase())
    .join("|");
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(canonical);
  return hasher.digest("hex").slice(0, CONTENT_HASH_LENGTH);
};

const resolveJobSource = (job: JobSearchResult["jobs"][number]): string => {
  const trimmed = job.source?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : DEFAULT_JOB_SOURCE;
};

const resolveJobPostedDate = (job: JobSearchResult["jobs"][number]): string | null => {
  const postedDate = job.postedDate ?? "";
  return postedDate.length > 0 ? postedDate : null;
};

const isNonEmptyStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length > 0;

/**
 * Requirements and technologies used to be written only by the `/jobs/refresh`
 * aggregator path; the scraper API persisted raw postings with both columns
 * empty, so any AI surface that read `jobs.requirements`/`jobs.technologies`
 * (cover letters, resume scoring, skill readiness) was blind to scraped jobs
 * until a refresh overwrote them. Prefer provider-supplied values when the
 * scraper already classified them, otherwise extract from the description
 * using the same taxonomy the aggregator uses — one ingestion contract.
 */
const resolveJobRequirements = async (job: JobSearchResult["jobs"][number]): Promise<string[]> =>
  isNonEmptyStringArray(job.requirements) ? job.requirements : extractRequirements(job.description);

const resolveJobTechnologies = async (job: JobSearchResult["jobs"][number]): Promise<string[]> =>
  isNonEmptyStringArray(job.technologies) ? job.technologies : extractTechnologies(job.description);

const buildScrapedJobWriteFields = async (
  job: JobSearchResult["jobs"][number],
  enrichment: ScrapePersonaEnrichment | undefined,
) => {
  const [requirements, technologies] = await Promise.all([
    resolveJobRequirements(job),
    resolveJobTechnologies(job),
  ]);
  return {
    title: job.title,
    company: job.company,
    location: job.location,
    remote: Boolean(job.remote),
    hybrid: false,
    description: job.description ?? null,
    requirements,
    technologies,
    url: job.url ?? null,
    source: resolveJobSource(job),
    postedDate: resolveJobPostedDate(job),
    type: DEFAULT_JOB_TYPE,
    enrichment: enrichment ?? null,
  };
};

export const upsertScrapedJob = async (
  job: JobSearchResult["jobs"][number],
  now: string,
  enrichment?: ScrapePersonaEnrichment,
): Promise<void> => {
  const contentHash = resolveJobContentHash(job);
  const writeFields = await buildScrapedJobWriteFields(job, enrichment);

  await db
    .insert(jobs)
    .values({
      id: generateId(),
      ...writeFields,
      contentHash,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: jobs.contentHash,
      set: {
        ...writeFields,
        updatedAt: now,
      },
    });
};

type PersistScrapedEntityOptions = {
  now: string;
  enrichmentAttempt: ScrapeEnrichmentAttempt;
  enrichmentAccumulator: ScrapeEnrichmentAccumulator;
  pushWarning: (accumulator: ScrapeEnrichmentAccumulator, warning: string) => void;
};

const applyEnrichmentTracking = (
  enrichmentAttempt: ScrapeEnrichmentAttempt,
  enrichmentAccumulator: ScrapeEnrichmentAccumulator,
) => {
  if (!enrichmentAttempt.enrichment) {
    return;
  }

  enrichmentAccumulator.enrichedRecords += 1;
  enrichmentAccumulator.provider = enrichmentAttempt.provider ?? enrichmentAccumulator.provider;
  enrichmentAccumulator.model = enrichmentAttempt.model ?? enrichmentAccumulator.model;
};

const persistScrapedRowBase = (options: PersistScrapedEntityOptions) => {
  if (options.enrichmentAttempt.warning) {
    options.pushWarning(options.enrichmentAccumulator, options.enrichmentAttempt.warning);
  }
  applyEnrichmentTracking(options.enrichmentAttempt, options.enrichmentAccumulator);
};

export const persistScrapedJobRow = async (
  job: JobSearchResult["jobs"][number],
  options: PersistScrapedEntityOptions,
): Promise<void> => {
  persistScrapedRowBase(options);
  await upsertScrapedJob(job, options.now, options.enrichmentAttempt.enrichment);
};

export const persistScrapedStudioRow = async (
  studioRow: ScrapedStudio,
  options: PersistScrapedEntityOptions,
): Promise<void> => {
  persistScrapedRowBase(options);
  await upsertStudioRow(studioRow, options.now, options.enrichmentAttempt.enrichment);
};
