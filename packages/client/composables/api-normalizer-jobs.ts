import { JOB_GAME_GENRES, JOB_STUDIO_TYPES, JOB_SUPPORTED_PLATFORMS } from "@bao/shared/constants/jobs";
import type { Job } from "@bao/shared/types/jobs";
import { normalizeScrapePersonaEnrichment } from "@bao/shared/utils/scrape-enrichment";
import { asBoolean, asNumber, asString, asStringArray, isRecord } from "@bao/shared/utils/type-guards";
import {
  asEnum,
  asEnumArray,
  normalizeJobExperienceLevel,
  normalizeJobType,
} from "~/composables/api-normalizer-shared";

const normalizeSalary = (value: unknown): Job["salary"] | undefined => {
  if (typeof value === "string") {
    return value;
  }
  if (!isRecord(value)) {
    return;
  }

  const min = asNumber(value.min);
  const max = asNumber(value.max);
  if (min === undefined || max === undefined) {
    return;
  }

  const frequency =
    value.frequency === "yearly" || value.frequency === "monthly" || value.frequency === "hourly"
      ? value.frequency
      : null;
  const salary: Exclude<Job["salary"], string | undefined> = {
    min,
    max,
    currency: asString(value.currency),
  };
  if (frequency) {
    salary.frequency = frequency;
  }

  return salary;
};

export const toJob = (value: unknown): Job | null => {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const title = asString(value.title);
  const company = asString(value.company);
  const location = asString(value.location);
  if (!(id && title && company && location)) return null;

  return {
    id,
    title,
    company,
    location,
    remote: asBoolean(value.remote) ?? false,
    hybrid: asBoolean(value.hybrid),
    salary: normalizeSalary(value.salary),
    description: asString(value.description),
    requirements: asStringArray(value.requirements),
    technologies: asStringArray(value.technologies),
    experienceLevel: normalizeJobExperienceLevel(value.experienceLevel),
    type: normalizeJobType(value.type),
    postedDate: asString(value.postedDate) ?? new Date().toISOString(),
    url: asString(value.url),
    source: asString(value.source),
    featured: asBoolean(value.featured),
    tags: asStringArray(value.tags),
    companyLogo: asString(value.companyLogo),
    applicationUrl: asString(value.applicationUrl),
    contentHash: asString(value.contentHash),
    studioType: asEnum(value.studioType, JOB_STUDIO_TYPES),
    gameGenres: asEnumArray(value.gameGenres, JOB_GAME_GENRES),
    platforms: asEnumArray(value.platforms, JOB_SUPPORTED_PLATFORMS),
    gamingRelevance: asNumber(value.gamingRelevance),
    enrichment: normalizeScrapePersonaEnrichment(value.enrichment),
  };
};
