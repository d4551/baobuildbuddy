import type { PortfolioData, PortfolioProject } from "@bao/shared";
import { API_ERROR_CREATE_PROJECT, API_ERROR_INVALID_PROJECT_ID_REORDER } from "@bao/shared";
import {
  createProject,
  deleteProjectById,
  getOrCreateDefaultPortfolioRecord,
  getPortfolioRecord,
  getProjectById,
  getProjectsForPortfolio,
  reorderPortfolioProjects,
  serializePortfolioMetadata,
  updatePortfolioMetadata,
  updateProjectById,
} from "./portfolio-service-storage";
import { toPortfolioData } from "./portfolio-service-normalizers";
import type {
  CreatePortfolioProjectPayload,
  PortfolioUpdatePayload,
  UpdatePortfolioProjectPayload,
} from "./portfolio-service-contracts";

export class PortfolioService {
  /**
   * Get the full portfolio contract (header + projects).
   */
  async getPortfolio(): Promise<PortfolioData> {
    const portfolio = (await getPortfolioRecord()) ?? (await getOrCreateDefaultPortfolioRecord());
    const projects = await this.getProjects(portfolio.id);
    return toPortfolioData(portfolio, projects);
  }

  /**
   * Update portfolio metadata
   */
  async updatePortfolio(data: PortfolioUpdatePayload): Promise<PortfolioData> {
    const portfolio = await getOrCreateDefaultPortfolioRecord();
    await updatePortfolioMetadata(
      portfolio.id,
      serializePortfolioMetadata(data.metadata),
      new Date().toISOString(),
    );

    const updated = await getOrCreateDefaultPortfolioRecord();
    const projects = await this.getProjects(portfolio.id);
    return toPortfolioData(updated, projects);
  }

  /**
   * Get all projects for a portfolio
   */
  async getProjects(portfolioId: string): Promise<PortfolioProject[]> {
    return getProjectsForPortfolio(portfolioId);
  }

  /**
   * Add a new project to a portfolio
   */
  async addProject(
    portfolioId: string,
    data: CreatePortfolioProjectPayload,
  ): Promise<PortfolioProject> {
    const id = await createProject(portfolioId, data);
    const created = await this.getProject(id);
    if (!created) {
      throw new Error(API_ERROR_CREATE_PROJECT);
    }

    return created;
  }

  /**
   * Get a single project by ID
   */
  async getProject(id: string): Promise<PortfolioProject | null> {
    return getProjectById(id);
  }

  /**
   * Update a project
   */
  async updateProject(
    id: string,
    data: UpdatePortfolioProjectPayload,
  ): Promise<PortfolioProject | null> {
    const updated = await updateProjectById(id, data);
    if (!updated) {
      return null;
    }
    return this.getProject(id);
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<boolean> {
    return deleteProjectById(id);
  }

  /**
   * Reorder projects by updating their sortOrder
   */
  async reorderProjects(portfolioId: string, orderedIds: string[]): Promise<boolean> {
    const result = await reorderPortfolioProjects(portfolioId, orderedIds);
    if (!result.valid) {
      throw new Error(API_ERROR_INVALID_PROJECT_ID_REORDER);
    }
    return result.valid;
  }

  /**
   * Fetch the canonical portfolio payload used by API responses.
   */
  async getPortfolioById(portfolioId: string): Promise<PortfolioData | null> {
    const portfolio = await getPortfolioRecord(portfolioId);
    if (!portfolio) {
      return null;
    }

    const projects = await this.getProjects(portfolio.id);
    return toPortfolioData(portfolio, projects);
  }

  /**
   * Fetch or create the default portfolio and return the full portfolio payload.
   */
  async getPortfolioPayload(): Promise<PortfolioData> {
    const portfolio = await getOrCreateDefaultPortfolioRecord();
    const projects = await this.getProjects(portfolio.id);
    return toPortfolioData(portfolio, projects);
  }
}

export const portfolioService = new PortfolioService();
