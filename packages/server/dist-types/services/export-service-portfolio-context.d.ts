import { type PortfolioRenderContext, type WrappedTextOptions } from "./export-service-contracts";
export declare function createPortfolioContext(): Promise<PortfolioRenderContext>;
export declare function ensurePortfolioSpace(context: PortfolioRenderContext, requiredSpace: number): void;
export declare function drawPortfolioWrappedLine(context: PortfolioRenderContext, options: WrappedTextOptions, line: string): void;
export declare function drawPortfolioWrappedText(context: PortfolioRenderContext, options: WrappedTextOptions): void;
export declare function addPortfolioPageNumbers(context: PortfolioRenderContext): void;
