import {
  JOB_EXPERIENCE_LEVELS,
  JOB_GAME_GENRES,
  JOB_STUDIO_TYPES,
  JOB_SUPPORTED_PLATFORMS,
} from "@bao/shared/constants/jobs";
import type {
  GameGenre,
  JobExperienceLevel,
  JobType,
  Platform,
  StudioType,
} from "@bao/shared/types/jobs";
import type {
  JobTaxonomyKeywordCategory,
  JobTaxonomyKeywordEntry,
} from "@bao/shared/types/jobs-taxonomy";
import { getJobTaxonomy } from "./job-taxonomy-service";
import type { RawJob } from "./providers/provider-interface";

const isOneOf = <T extends string>(values: readonly T[], value: unknown): value is T => {
  if (typeof value !== "string") {
    return false;
  }
  return values.some((entry) => entry === value);
};

const readCategoryEntries = async (
  category: JobTaxonomyKeywordCategory,
): Promise<JobTaxonomyKeywordEntry[]> => {
  const taxonomy = await getJobTaxonomy();
  return taxonomy.keywords
    .filter((entry) => entry.enabled && entry.category === category)
    .sort((left, right) => left.sortOrder - right.sortOrder);
};

const matchesKeyword = (haystack: string, entry: JobTaxonomyKeywordEntry): boolean => {
  const candidates = [entry.label, ...entry.synonyms];
  return candidates.some((candidate) => haystack.includes(candidate.toLowerCase()));
};

const extractCategoryLabels = async (
  category: JobTaxonomyKeywordCategory,
  description?: string,
): Promise<string[]> => {
  if (!description) {
    return [];
  }

  const entries = await readCategoryEntries(category);
  const descLower = description.toLowerCase();
  return entries.filter((entry) => matchesKeyword(descLower, entry)).map((entry) => entry.label);
};

export const detectRemote = async (location: string): Promise<boolean> => {
  const locationLower = location.toLowerCase();
  const entries = await readCategoryEntries("remote-location");
  return entries.some((entry) => matchesKeyword(locationLower, entry));
};

export const detectHybrid = async (location: string): Promise<boolean> => {
  const locationLower = location.toLowerCase();
  const entries = await readCategoryEntries("hybrid-location");
  return entries.some((entry) => matchesKeyword(locationLower, entry));
};

export const normalizeStudioType = (value: string | null): StudioType | undefined => {
  if (!isOneOf(JOB_STUDIO_TYPES, value)) {
    return;
  }
  return value;
};

export const normalizeGameGenres = (value: string[] | null): GameGenre[] | undefined => {
  if (!Array.isArray(value)) {
    return;
  }
  return value.filter((genre): genre is GameGenre => isOneOf(JOB_GAME_GENRES, genre));
};

export const normalizePlatforms = (value: string[] | null): Platform[] | undefined => {
  if (!Array.isArray(value)) {
    return;
  }
  return value.filter((platform): platform is Platform =>
    isOneOf(JOB_SUPPORTED_PLATFORMS, platform),
  );
};

export const normalizeExperienceLevel = (value: string | null): JobExperienceLevel | undefined => {
  if (!isOneOf(JOB_EXPERIENCE_LEVELS, value)) {
    return;
  }
  return value;
};

export const detectExperienceLevel = (title: string): JobExperienceLevel | undefined => {
  const titleLower = title.toLowerCase();

  if (titleLower.includes("director") || titleLower.includes("vp")) return "director";
  if (titleLower.includes("principal") || titleLower.includes("staff")) return "principal";
  if (titleLower.includes("senior") || titleLower.includes("sr")) return "senior";
  if (titleLower.includes("mid") || titleLower.includes("intermediate")) return "mid";
  if (titleLower.includes("junior") || titleLower.includes("jr")) return "junior";
  if (titleLower.includes("entry") || titleLower.includes("intern")) return "entry";
};

export const detectJobType = (title: string): JobType => {
  const titleLower = title.toLowerCase();

  if (titleLower.includes("contract") || titleLower.includes("contractor")) return "contract";
  if (titleLower.includes("intern") || titleLower.includes("internship")) return "internship";
  if (titleLower.includes("part-time") || titleLower.includes("part time")) return "part-time";
  if (titleLower.includes("freelance")) return "freelance";

  return "full-time";
};

export const detectStudioType = async (company: string): Promise<StudioType> => {
  const companyLower = company.toLowerCase();
  const taxonomy = await getJobTaxonomy();
  const match = taxonomy.studioRules
    .filter((rule) => rule.enabled)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .find((rule) => companyLower.includes(rule.keyword.toLowerCase()));

  return match?.studioType ?? "Indie";
};

export const extractRequirements = async (description?: string): Promise<string[]> =>
  extractCategoryLabels("requirement", description);

export const extractTechnologies = async (description?: string): Promise<string[]> =>
  extractCategoryLabels("technology", description);

export const extractGenres = async (description?: string): Promise<string[]> =>
  extractCategoryLabels("genre", description);

export const extractPlatforms = async (description?: string): Promise<string[]> =>
  extractCategoryLabels("platform", description);

export const generateTags = async (raw: RawJob): Promise<string[]> => {
  const tags: string[] = [];

  if (await detectRemote(raw.location)) {
    tags.push("Remote");
  }
  if (await detectHybrid(raw.location)) {
    tags.push("Hybrid");
  }

  const description = raw.description?.toLowerCase() || "";
  if (description.includes("senior")) {
    tags.push("Senior");
  }
  if (description.includes("junior")) {
    tags.push("Junior");
  }
  if (description.includes("lead")) {
    tags.push("Leadership");
  }

  return tags;
};
