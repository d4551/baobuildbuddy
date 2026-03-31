import type { CreatePortfolioProjectPayload, PortfolioRecord, UpdatePortfolioProjectPayload } from "./portfolio-service-contracts";
export declare const getOrCreateDefaultPortfolioRecord: () => Promise<PortfolioRecord>;
export declare const getPortfolioRecord: (portfolioId?: string) => Promise<PortfolioRecord | null>;
export declare const updatePortfolioMetadata: (portfolioId: string, metadata: Record<string, unknown>, now: string) => Promise<void>;
export declare const getProjectsForPortfolio: (portfolioId: string) => Promise<import("@bao/shared/types/portfolio").PortfolioProject[]>;
export declare const getProjectById: (id: string) => Promise<import("@bao/shared/types/portfolio").PortfolioProject | null>;
export declare const createProject: (portfolioId: string, data: CreatePortfolioProjectPayload) => Promise<string>;
export declare const updateProjectById: (id: string, data: UpdatePortfolioProjectPayload) => Promise<boolean>;
export declare const deleteProjectById: (id: string) => Promise<boolean>;
export declare const reorderPortfolioProjects: (portfolioId: string, orderedIds: string[]) => Promise<{
    valid: boolean;
}>;
export declare const serializePortfolioMetadata: (metadata?: import("@bao/shared/types/portfolio").PortfolioMetadata) => Record<string, unknown>;
