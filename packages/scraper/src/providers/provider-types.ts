import type { ScrapedJob } from "@bao/shared";
import type { Page } from "playwright";

/**
 * Shared page-level extractor contract for portal scrapers.
 */
export type PortalJobExtractor = (
  /**
   * Playwright page positioned on the target source URL.
   */
  page: Page,
  /**
   * Canonical source URL supplied by provider settings.
   */
  sourceUrl: string,
) => Promise<ScrapedJob[]>;
