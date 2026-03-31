import type { Job, SalaryRange } from "@bao/shared";
import type { jobs } from "../../db/schema/jobs";
import { generateContentHash } from "./deduplication";
import type { RawJob } from "./providers/provider-interface";
import {
  detectExperienceLevel,
  detectHybrid,
  detectJobType,
  detectRemote,
  detectStudioType,
  extractGenres,
  extractPlatforms,
  extractRequirements,
  extractTechnologies,
  generateTags,
  normalizeExperienceLevel,
  normalizeGameGenres,
  normalizeJobType,
  normalizePlatforms,
  normalizeStudioType,
} from "./job-aggregator-taxonomy";

const normalizeSalary = (value: Record<string, unknown> | null): Job["salary"] | undefined => {
  if (!value) {
    return;
  }

  if (typeof value.label === "string" && value.label.trim().length > 0) {
    return value.label;
  }

  const min = typeof value.min === "number" ? value.min : undefined;
  const max = typeof value.max === "number" ? value.max : undefined;
  if (min !== undefined && max !== undefined) {
    const normalized: SalaryRange = {
      min,
      max,
      currency: typeof value.currency === "string" ? value.currency : undefined,
      frequency:
        value.frequency === "yearly" ||
        value.frequency === "monthly" ||
        value.frequency === "hourly"
          ? value.frequency
          : undefined,
    };
    return normalized;
  }
};

const applyOptionalRowFields = (job: Job, row: typeof jobs.$inferSelect): Job => ({
  ...job,
  hybrid: row.hybrid ?? undefined,
  requirements: Array.isArray(row.requirements) ? row.requirements : undefined,
  technologies: Array.isArray(row.technologies) ? row.technologies : undefined,
  experienceLevel: normalizeExperienceLevel(row.experienceLevel),
  url: row.url ?? undefined,
  source: row.source ?? undefined,
  contentHash: row.contentHash ?? undefined,
  tags: Array.isArray(row.tags) ? row.tags : undefined,
  companyLogo: row.companyLogo ?? undefined,
  applicationUrl: row.applicationUrl ?? undefined,
});

export const rawJobToInsert = async (raw: RawJob): Promise<typeof jobs.$inferInsert> => {
  const contentHash = generateContentHash(raw);
  const applyUrl = typeof raw.applyUrl === "string" && raw.applyUrl.trim() ? raw.applyUrl : null;
  const [remote, hybrid, requirements, technologies, studioType, gameGenres, platforms, tags] =
    await Promise.all([
      detectRemote(raw.location),
      detectHybrid(raw.location),
      extractRequirements(raw.description),
      extractTechnologies(raw.description),
      detectStudioType(raw.company),
      extractGenres(raw.description),
      extractPlatforms(raw.description),
      generateTags(raw),
    ]);

  return {
    id: crypto.randomUUID(),
    title: raw.title,
    company: raw.company,
    location: raw.location,
    remote,
    hybrid,
    description: raw.description || "",
    requirements,
    technologies,
    experienceLevel: detectExperienceLevel(raw.title),
    type: detectJobType(raw.title),
    postedDate: raw.postedDate || new Date().toISOString(),
    url: raw.url,
    source: raw.source || "unknown",
    contentHash,
    studioType,
    gameGenres,
    platforms,
    tags,
    applicationUrl: applyUrl || raw.url,
  };
};

export const dbRowToJob = (row: typeof jobs.$inferSelect): Job => {
  const baseJob: Job = {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    remote: row.remote ?? false,
    salary: normalizeSalary(row.salary),
    description: row.description ?? "",
    type: normalizeJobType(row.type),
    postedDate: row.postedDate || new Date().toISOString(),
    studioType: normalizeStudioType(row.studioType),
    gameGenres: normalizeGameGenres(row.gameGenres),
    platforms: normalizePlatforms(row.platforms),
  };

  return applyOptionalRowFields(baseJob, row);
};
