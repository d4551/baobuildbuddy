import { type PortfolioMetadata, type PortfolioProject } from "@bao/shared";
export declare function exportPortfolioDocxDocument(metadata: PortfolioMetadata, projects: PortfolioProject[]): Promise<Uint8Array>;
