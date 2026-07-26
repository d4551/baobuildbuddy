import type { PortfolioData, PortfolioMetadata, PortfolioProject } from "@bao/shared/types/portfolio";
import type { CreatePortfolioProjectPayload, PortfolioProjectInsert, PortfolioProjectRecord, PortfolioProjectUpdate, PortfolioRecord, UpdatePortfolioProjectPayload } from "./portfolio-service-contracts";
export declare const toMetadataOrDefault: (metadata?: Record<string, unknown> | null) => PortfolioMetadata;
export declare const metadataToRecord: (metadata?: PortfolioMetadata) => Record<string, unknown>;
export declare const toProject: (row: PortfolioProjectRecord) => PortfolioProject;
export declare const buildPortfolioData: (portfolio: PortfolioRecord, projects: PortfolioProject[]) => PortfolioData;
export declare const createProjectInsert: (options: {
    id: string;
    portfolioId: string;
    data: CreatePortfolioProjectPayload;
    now: string;
    sortOrder: number;
}) => PortfolioProjectInsert;
export declare const createProjectUpdate: (data: UpdatePortfolioProjectPayload, now: string) => PortfolioProjectUpdate;
