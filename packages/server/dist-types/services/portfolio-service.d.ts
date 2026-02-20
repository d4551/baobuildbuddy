import type { PortfolioData, PortfolioMetadata, PortfolioProject } from "@bao/shared";
export declare class PortfolioService {
    private toMetadataOrDefault;
    private metadataToRecord;
    private toProject;
    private toPortfolioData;
    private getOrCreateDefaultPortfolio;
    private getPortfolioRecord;
    /**
     * Get the full portfolio contract (header + projects).
     */
    getPortfolio(): Promise<PortfolioData>;
    /**
     * Update portfolio metadata
     */
    updatePortfolio(data: {
        metadata?: PortfolioMetadata;
    }): Promise<PortfolioData>;
    /**
     * Get all projects for a portfolio
     */
    getProjects(portfolioId: string): Promise<PortfolioProject[]>;
    /**
     * Add a new project to a portfolio
     */
    addProject(portfolioId: string, data: Omit<PortfolioProject, "id" | "portfolioId">): Promise<PortfolioProject>;
    /**
     * Get a single project by ID
     */
    getProject(id: string): Promise<PortfolioProject | null>;
    /**
     * Update a project
     */
    updateProject(id: string, data: Partial<PortfolioProject>): Promise<PortfolioProject | null>;
    /**
     * Delete a project
     */
    deleteProject(id: string): Promise<boolean>;
    /**
     * Reorder projects by updating their sortOrder
     */
    reorderProjects(portfolioId: string, orderedIds: string[]): Promise<boolean>;
    /**
     * Fetch the canonical portfolio payload used by API responses.
     */
    getPortfolioById(portfolioId: string): Promise<PortfolioData | null>;
    /**
     * Fetch or create the default portfolio and return the full portfolio payload.
     */
    getPortfolioPayload(): Promise<PortfolioData>;
}
export declare const portfolioService: PortfolioService;
