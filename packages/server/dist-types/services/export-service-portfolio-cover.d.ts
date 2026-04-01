import type { PortfolioMetadata } from "@bao/shared/types/portfolio";
import { type PortfolioRenderContext } from "./export-service-contracts";
export declare function renderPortfolioSocialLinks(context: PortfolioRenderContext, social?: Record<string, string>): void;
export declare function renderPortfolioCoverPage(context: PortfolioRenderContext, metadata: PortfolioMetadata): void;
export declare function startPortfolioProjectsSection(context: PortfolioRenderContext): void;
