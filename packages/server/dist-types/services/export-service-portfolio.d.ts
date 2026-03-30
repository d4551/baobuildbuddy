import type { PortfolioMetadata, PortfolioProject } from "@bao/shared";
export declare function exportPortfolioPdf(metadata: PortfolioMetadata, projects: PortfolioProject[]): Promise<Uint8Array>;
