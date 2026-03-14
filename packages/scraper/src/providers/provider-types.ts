import type { ScrapedJob } from "@bao/shared";

/**
 * Narrow page contract used by scraper providers.
 */
export interface PageEvaluator {
  /**
   * Evaluate a synchronous DOM extraction callback without arguments.
   */
  evaluate<Result>(pageFunction: () => Result): Promise<Result>;
  /**
   * Evaluate a synchronous DOM extraction callback with a serializable argument.
   */
  evaluate<Result, Arg>(pageFunction: (arg: Arg) => Result, arg: Arg): Promise<Result>;
}

/**
 * Shared page-level extractor contract for portal scrapers.
 */
export type PortalJobExtractor = (
  /**
   * Page-like evaluator positioned on the target source URL.
   */
  page: PageEvaluator,
  /**
   * Canonical source URL supplied by provider settings.
   */
  sourceUrl: string,
) => Promise<ScrapedJob[]>;
