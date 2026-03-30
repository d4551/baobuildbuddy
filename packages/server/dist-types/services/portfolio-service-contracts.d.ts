import type { PortfolioData, PortfolioMetadata, PortfolioProject } from "@bao/shared";
import type { portfolioProjects, portfolios } from "../db/schema/portfolios";
export type PortfolioRecord = typeof portfolios.$inferSelect;
export type PortfolioProjectRecord = typeof portfolioProjects.$inferSelect;
export type PortfolioProjectInsert = typeof portfolioProjects.$inferInsert;
export type PortfolioProjectUpdate = Partial<PortfolioProjectInsert>;
export interface PortfolioUpdatePayload {
    metadata?: PortfolioMetadata;
}
export type CreatePortfolioProjectPayload = Omit<PortfolioProject, "id" | "portfolioId">;
export type UpdatePortfolioProjectPayload = Partial<PortfolioProject>;
export interface ReorderPortfolioProjectsPayload {
    portfolioId: string;
    orderedIds: string[];
}
export interface PortfolioSnapshot {
    portfolio: PortfolioRecord;
    projects: PortfolioProject[];
}
export type PortfolioDataBuilder = (portfolio: PortfolioRecord, projects: PortfolioProject[]) => PortfolioData;
