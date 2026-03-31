import {
  generateId,
  toErrorMessage,
  type GamingPortalId,
  type JobSearchResult,
  type ScrapePersonaEnrichment,
  type ScrapedStudio,
} from "@bao/shared";
import { db } from "../db/client";
import { jobs } from "../db/schema/jobs";
import { studios } from "../db/schema/studios";
import { loadJobProviderSettings } from "./jobs/providers/provider-settings";
import type {
  ScrapeEnrichmentAccumulator,
  ScrapeEnrichmentAttempt,
} from "./scraper-service-contracts";
import {
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

export const upsertScrapedJob = async (
  job: JobSearchResult["jobs"][number],
  now: string,
  enrichment?: ScrapePersonaEnrichment,
): Promise<void> => {
  const contentHash = String(job.contentHash?.trim().length ? job.contentHash : job.id).slice(
    0,
    100,
  );

  await db
    .insert(jobs)
    .values({
      id: generateId(),
      title: job.title,
      company: job.company,
      location: job.location,
      remote: Boolean(job.remote),
      hybrid: false,
      description: job.description ?? null,
      url: job.url ?? null,
      source:
        job.source?.trim() && job.source.trim().length > 0 ? job.source.trim() : DEFAULT_JOB_SOURCE,
      contentHash,
      postedDate: job.postedDate && job.postedDate.length > 0 ? job.postedDate : null,
      type: DEFAULT_JOB_TYPE,
      enrichment: enrichment ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: jobs.contentHash,
      set: {
        title: job.title,
        company: job.company,
        location: job.location,
        remote: Boolean(job.remote),
        hybrid: false,
        description: job.description ?? null,
        url: job.url ?? null,
        source:
          job.source?.trim() && job.source.trim().length > 0
            ? job.source.trim()
            : DEFAULT_JOB_SOURCE,
        postedDate: job.postedDate && job.postedDate.length > 0 ? job.postedDate : null,
        type: DEFAULT_JOB_TYPE,
        enrichment: enrichment ?? null,
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
