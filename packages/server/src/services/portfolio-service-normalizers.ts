import type { PortfolioData, PortfolioMetadata, PortfolioProject } from "@bao/shared";
import type {
  CreatePortfolioProjectPayload,
  PortfolioProjectInsert,
  PortfolioProjectRecord,
  PortfolioProjectUpdate,
  PortfolioRecord,
  UpdatePortfolioProjectPayload,
} from "./portfolio-service-contracts";

export const toMetadataOrDefault = (
  metadata?: Record<string, unknown> | null,
): PortfolioMetadata => {
  if (!metadata) {
    return {};
  }

  const output: PortfolioMetadata = {};
  if (typeof metadata.author === "string") output.author = metadata.author;
  if (typeof metadata.title === "string") output.title = metadata.title;
  if (typeof metadata.description === "string") output.description = metadata.description;
  if (typeof metadata.bio === "string") output.bio = metadata.bio;
  if (typeof metadata.email === "string") output.email = metadata.email;
  if (typeof metadata.website === "string") output.website = metadata.website;
  if (typeof metadata.social === "object" && metadata.social !== null) {
    const social: Record<string, string> = {};
    for (const [key, value] of Object.entries(metadata.social)) {
      if (typeof value === "string") {
        social[key] = value;
      }
    }
    output.social = social;
  }

  return output;
};

export const metadataToRecord = (metadata?: PortfolioMetadata): Record<string, unknown> => {
  if (!metadata) {
    return {};
  }

  const record: Record<string, unknown> = {};
  if (metadata.author) record.author = metadata.author;
  if (metadata.title) record.title = metadata.title;
  if (metadata.description) record.description = metadata.description;
  if (metadata.bio) record.bio = metadata.bio;
  if (metadata.email) record.email = metadata.email;
  if (metadata.website) record.website = metadata.website;
  if (metadata.social) record.social = metadata.social;
  return record;
};

export const toProject = (row: PortfolioProjectRecord): PortfolioProject => {
  const project: PortfolioProject = {
    id: row.id,
    portfolioId: row.portfolioId,
    title: row.title,
    description: row.description,
    technologies: row.technologies || [],
    tags: row.tags || [],
    featured: row.featured ?? undefined,
    sortOrder: row.sortOrder || 0,
  };

  if (row.image) {
    project.image = row.image;
  }
  if (row.liveUrl) {
    project.liveUrl = row.liveUrl;
  }
  if (row.githubUrl) {
    project.githubUrl = row.githubUrl;
  }
  if (row.role) {
    project.role = row.role;
  }
  if (Array.isArray(row.platforms)) {
    project.platforms = row.platforms;
  }
  if (Array.isArray(row.engines)) {
    project.engines = row.engines;
  }

  return project;
};

export const toPortfolioData = (
  portfolio: PortfolioRecord,
  projects: PortfolioProject[],
): PortfolioData => ({
  id: portfolio.id,
  metadata: toMetadataOrDefault(portfolio.metadata),
  projects,
  createdAt: portfolio.createdAt,
  updatedAt: portfolio.updatedAt,
});

export const createProjectInsert = (options: {
  id: string;
  portfolioId: string;
  data: CreatePortfolioProjectPayload;
  now: string;
  sortOrder: number;
}): PortfolioProjectInsert => ({
  id: options.id,
  portfolioId: options.portfolioId,
  title: options.data.title,
  description: options.data.description,
  technologies: options.data.technologies || [],
  image: options.data.image,
  liveUrl: options.data.liveUrl,
  githubUrl: options.data.githubUrl,
  tags: options.data.tags || [],
  featured: options.data.featured,
  role: options.data.role,
  platforms: options.data.platforms,
  engines: options.data.engines,
  sortOrder: options.sortOrder,
  createdAt: options.now,
  updatedAt: options.now,
});

export const createProjectUpdate = (
  data: UpdatePortfolioProjectPayload,
  now: string,
): PortfolioProjectUpdate => {
  const updateData: PortfolioProjectUpdate = {
    updatedAt: now,
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.technologies !== undefined) updateData.technologies = data.technologies;
  if (data.image !== undefined) updateData.image = data.image;
  if (data.liveUrl !== undefined) updateData.liveUrl = data.liveUrl;
  if (data.githubUrl !== undefined) updateData.githubUrl = data.githubUrl;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.featured !== undefined) updateData.featured = data.featured;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.platforms !== undefined) updateData.platforms = data.platforms;
  if (data.engines !== undefined) updateData.engines = data.engines;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  return updateData;
};
