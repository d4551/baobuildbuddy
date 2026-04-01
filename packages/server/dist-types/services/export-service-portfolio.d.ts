import type { PortfolioMetadata, PortfolioProject } from "@bao/shared/types/portfolio";
export declare function exportPortfolioPdf(metadata: PortfolioMetadata, projects: PortfolioProject[]): Promise<Uint8Array>;
