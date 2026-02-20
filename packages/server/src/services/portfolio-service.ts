import { generateId } from "@bao/shared";
import type { PortfolioData, PortfolioMetadata, PortfolioProject } from "@bao/shared";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { portfolioProjects, portfolios } from "../db/schema";

type PortfolioRecord = {
  id: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export class PortfolioService {
  private toMetadataOrDefault(metadata?: Record<string, unknown> | null): PortfolioMetadata {
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
  }

  private metadataToRecord(metadata?: PortfolioMetadata): Record<string, unknown> {
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
  }

  private toProject(row: {
    id: string;
    portfolioId: string;
    title: string;
    description: string;
    technologies?: string[] | null;
    image?: string | null;
    liveUrl?: string | null;
    githubUrl?: string | null;
    tags?: string[] | null;
    featured?: boolean | null;
    role?: string | null;
    platforms?: string[] | null;
    engines?: string[] | null;
    sortOrder?: number | null;
  }): PortfolioProject {
    return {
      id: row.id,
      portfolioId: row.portfolioId,
      title: row.title,
      description: row.description,
      technologies: row.technologies || [],
      image: row.image || undefined,
      liveUrl: row.liveUrl || undefined,
      githubUrl: row.githubUrl || undefined,
      tags: row.tags || [],
      featured: row.featured || false,
      role: row.role || undefined,
      platforms: row.platforms || undefined,
      engines: row.engines || undefined,
      sortOrder: row.sortOrder || 0,
    };
  }

  private toPortfolioData(portfolio: PortfolioRecord, projects: PortfolioProject[]): PortfolioData {
    return {
      id: portfolio.id,
      metadata: this.toMetadataOrDefault(portfolio.metadata),
      projects,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
    };
  }

  private async getOrCreateDefaultPortfolio(): Promise<PortfolioRecord> {
    const rows = await db.select().from(portfolios);
    if (rows.length > 0) {
      return rows[0] as PortfolioRecord;
    }

    const now = new Date().toISOString();
    const id = generateId();
    await db.insert(portfolios).values({
      id,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    });

    return {
      id,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };
  }

  private async getPortfolioRecord(portfolioId?: string): Promise<PortfolioRecord | null> {
    if (portfolioId) {
      const rows = await db.select().from(portfolios).where(eq(portfolios.id, portfolioId));
      return rows.length > 0 ? (rows[0] as PortfolioRecord) : null;
    }

    const rows = await db.select().from(portfolios);
    return rows.length > 0 ? (rows[0] as PortfolioRecord) : null;
  }

  /**
   * Get the full portfolio contract (header + projects).
   */
  async getPortfolio(): Promise<PortfolioData> {
    const portfolio = (await this.getPortfolioRecord()) ?? (await this.getOrCreateDefaultPortfolio());
    const projects = await this.getProjects(portfolio.id);
    return this.toPortfolioData(portfolio, projects);
  }

  /**
   * Update portfolio metadata
   */
  async updatePortfolio(data: { metadata?: PortfolioMetadata }): Promise<PortfolioData> {
    const portfolio = await this.getOrCreateDefaultPortfolio();
    const now = new Date().toISOString();

    await db
      .update(portfolios)
      .set({
        metadata: this.metadataToRecord(data.metadata),
        updatedAt: now,
      })
      .where(eq(portfolios.id, portfolio.id));

    const updated = await this.getOrCreateDefaultPortfolio();
    const projects = await this.getProjects(portfolio.id);
    return {
      id: updated.id,
      metadata: this.toMetadataOrDefault(updated.metadata),
      projects,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Get all projects for a portfolio
   */
  async getProjects(portfolioId: string): Promise<PortfolioProject[]> {
    const results = await db
      .select()
      .from(portfolioProjects)
      .where(eq(portfolioProjects.portfolioId, portfolioId))
      .orderBy(portfolioProjects.sortOrder, desc(portfolioProjects.createdAt));

    return results.map((row) => this.toProject(row));
  }

  /**
   * Add a new project to a portfolio
   */
  async addProject(
    portfolioId: string,
    data: Omit<PortfolioProject, "id" | "portfolioId">,
  ): Promise<PortfolioProject> {
    const id = generateId();
    const now = new Date().toISOString();

    // Get max sort order
    const projects = await this.getProjects(portfolioId);
    const maxSortOrder = projects.reduce((max, p) => Math.max(max, p.sortOrder || 0), 0);

    await db.insert(portfolioProjects).values({
      id,
      portfolioId,
      title: data.title,
      description: data.description,
      technologies: data.technologies || [],
      image: data.image || undefined,
      liveUrl: data.liveUrl || undefined,
      githubUrl: data.githubUrl || undefined,
      tags: data.tags || [],
      featured: data.featured || false,
      role: data.role || undefined,
      platforms: data.platforms || undefined,
      engines: data.engines || undefined,
      sortOrder: data.sortOrder !== undefined ? data.sortOrder : maxSortOrder + 1,
      createdAt: now,
      updatedAt: now,
    });

    const created = await this.getProject(id);
    if (!created) {
      throw new Error("Failed to create project");
    }

    return created;
  }

  /**
   * Get a single project by ID
   */
  async getProject(id: string): Promise<PortfolioProject | null> {
    const results = await db.select().from(portfolioProjects).where(eq(portfolioProjects.id, id));

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return this.toProject(row);
  }

  /**
   * Update a project
   */
  async updateProject(
    id: string,
    data: Partial<PortfolioProject>,
  ): Promise<PortfolioProject | null> {
    const existing = await this.getProject(id);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updateData: Partial<typeof portfolioProjects.$inferInsert> = {
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

    await db.update(portfolioProjects).set(updateData).where(eq(portfolioProjects.id, id));

    return await this.getProject(id);
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<boolean> {
    const existing = await db
      .delete(portfolioProjects)
      .where(eq(portfolioProjects.id, id))
      .returning({ id: portfolioProjects.id });
    return existing.length > 0;
  }

  /**
   * Reorder projects by updating their sortOrder
   */
  async reorderProjects(portfolioId: string, orderedIds: string[]): Promise<boolean> {
    const existing = await this.getProjects(portfolioId);
    const validIds = existing.map((project) => project.id);
    const hasInvalidIds = orderedIds.some((id) => !validIds.includes(id));
    if (hasInvalidIds) {
      throw new Error("Invalid project ID in reorder payload");
    }

    if (orderedIds.length === 0) {
      return true;
    }

    for (let i = 0; i < orderedIds.length; i++) {
      const orderedId = orderedIds[i];
      if (!orderedId) continue;
      await db
        .update(portfolioProjects)
        .set({ sortOrder: i, updatedAt: new Date().toISOString() })
        .where(eq(portfolioProjects.id, orderedId));
    }

    const remainingProjects = existing.filter((project) => !orderedIds.includes(project.id));
    const nextIndex = orderedIds.length;
    for (let i = 0; i < remainingProjects.length; i++) {
      const project = remainingProjects[i];
      if (!project.id) continue;
      await db
        .update(portfolioProjects)
        .set({ sortOrder: nextIndex + i, updatedAt: new Date().toISOString() })
        .where(eq(portfolioProjects.id, project.id));
    }

    return true;
  }

  /**
   * Fetch the canonical portfolio payload used by API responses.
   */
  async getPortfolioById(portfolioId: string): Promise<PortfolioData | null> {
    const portfolio = await this.getPortfolioRecord(portfolioId);
    if (!portfolio) {
      return null;
    }

    const projects = await this.getProjects(portfolio.id);
    return this.toPortfolioData(portfolio, projects);
  }

  /**
   * Fetch or create the default portfolio and return the full portfolio payload.
   */
  async getPortfolioPayload(): Promise<PortfolioData> {
    const portfolio = await this.getOrCreateDefaultPortfolio();
    const projects = await this.getProjects(portfolio.id);
    return this.toPortfolioData(portfolio, projects);
  }
}

export const portfolioService = new PortfolioService();
