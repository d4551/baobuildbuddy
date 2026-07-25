import type { PortfolioMetadata, PortfolioProject } from "@bao/shared/types/portfolio";
export declare function exportPortfolioDocxDocument(metadata: PortfolioMetadata, projects: PortfolioProject[], template?: string): Promise<Uint8Array>;
