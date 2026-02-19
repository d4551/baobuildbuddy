import { generateId } from "@navi/shared";
import type { PortfolioMetadata, PortfolioProject } from "@navi/shared";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { portfolioProjects, portfolios } from "../db/schema";

export class PortfolioService {
  /**
   * Get or create the default portfolio
   */
  async getPortfolio(): Promise<{
    id: string;
    metadata?: PortfolioMetadata;
    createdAt: string;
    updatedAt: string;
  }> {
    const results = await db.select().from(portfolios).limit(1);

    if (results.length > 0) {
      const row = results[0];
      return {
        id: row.id,
        metadata: row.metadata || undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    }

    // Create default portfolio
    const id = generateId();
    const now = new Date().toISOString();

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

  /**
   * Update portfolio metadata
   */
  async updatePortfolio(data: { metadata?: PortfolioMetadata }): Promise<{
    id: string;
    metadata?: PortfolioMetadata;
  }> {
    const portfolio = await this.getPortfolio();
    const now = new Date().toISOString();

    await db
      .update(portfolios)
      .set({
        metadata: data.metadata || {},
        updatedAt: now,
      })
      .where(eq(portfolios.id, portfolio.id));

    return {
      id: portfolio.id,
      metadata: data.metadata,
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

    return results.map((row) => ({
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
    }));
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
    const updateData: Record<string, unknown> = {
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
    await db.delete(portfolioProjects).where(eq(portfolioProjects.id, id));
    return true;
  }

  /**
   * Reorder projects by updating their sortOrder
   */
  async reorderProjects(portfolioId: string, orderedIds: string[]): Promise<boolean> {
    // Update each project's sortOrder based on its position in the array
    for (let i = 0; i < orderedIds.length; i++) {
      await db
        .update(portfolioProjects)
        .set({ sortOrder: i, updatedAt: new Date().toISOString() })
        .where(eq(portfolioProjects.id, orderedIds[i]));
    }

    return true;
  }
}

export const portfolioService = new PortfolioService();
