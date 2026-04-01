import type {
  PortfolioData,
  PortfolioMetadata,
  PortfolioProject,
} from "@bao/shared/types/portfolio";
import {
  asBoolean,
  asNumber,
  asRecord,
  asString,
  asStringArray,
  isRecord,
} from "@bao/shared/utils/type-guards";

const toPortfolioProject = (value: unknown): PortfolioProject | null => {
  if (!isRecord(value)) return null;
  const title = asString(value.title);
  const description = asString(value.description);
  if (!(title && description)) return null;

  return {
    id: asString(value.id),
    portfolioId: asString(value.portfolioId),
    title,
    description,
    technologies: asStringArray(value.technologies),
    image: asString(value.image),
    liveUrl: asString(value.liveUrl),
    githubUrl: asString(value.githubUrl),
    tags: asStringArray(value.tags),
    featured: asBoolean(value.featured),
    role: asString(value.role),
    platforms: asStringArray(value.platforms),
    engines: asStringArray(value.engines),
    sortOrder: asNumber(value.sortOrder),
  };
};

export const toPortfolioData = (value: unknown): PortfolioData | null => {
  if (!isRecord(value)) return null;

  const metadataRecord = asRecord(value.metadata);
  const metadata: PortfolioMetadata = {};
  if (metadataRecord) {
    metadata.author = asString(metadataRecord.author);
    metadata.title = asString(metadataRecord.title);
    metadata.description = asString(metadataRecord.description);
    metadata.bio = asString(metadataRecord.bio);
    metadata.email = asString(metadataRecord.email);
    metadata.website = asString(metadataRecord.website);
    if (isRecord(metadataRecord.social)) {
      const social: Record<string, string> = {};
      for (const [key, entry] of Object.entries(metadataRecord.social)) {
        if (typeof entry === "string") {
          social[key] = entry;
        }
      }
      metadata.social = social;
    }
  }

  return {
    id: asString(value.id),
    metadata,
    projects: Array.isArray(value.projects)
      ? value.projects
          .map(toPortfolioProject)
          .filter((entry): entry is PortfolioProject => entry !== null)
      : [],
    createdAt: asString(value.createdAt),
    updatedAt: asString(value.updatedAt),
  };
};
