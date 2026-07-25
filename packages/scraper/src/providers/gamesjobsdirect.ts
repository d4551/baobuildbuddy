import type { ScrapedJob } from "@bao/shared/schemas/automation-scripts.schema";
import {
  SCRAPED_JOB_COMPANY_MAX_LENGTH,
  SCRAPED_JOB_LOCATION_MAX_LENGTH,
  SCRAPED_JOB_TITLE_MAX_LENGTH,
  SCRAPED_JOB_TITLE_MIN_LENGTH,
} from "../constants/scrape-fields";
import { buildScraperHash } from "../runtime/hash";
import { normalizeWhitespace, toAbsoluteUrl, toBoundedText } from "./provider-helpers";
import type { PageEvaluator } from "./provider-types";

const GAMES_JOBS_DIRECT_RESULT_LIMIT = 80;

/**
 * Extracts normalized GamesJobsDirect entries from the current Playwright page.
 *
 * @param page Page evaluator positioned on a GamesJobsDirect listing.
 * @param sourceUrl Canonical source URL supplied by settings.
 * @returns Normalized job rows.
 */
export const extractGamesJobsDirectJobs = async (
  page: PageEvaluator,
  sourceUrl: string,
): Promise<ScrapedJob[]> => {
  const rows = await page.evaluate((resultLimit) => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href*='/job/']"));
    return links.slice(0, resultLimit).map((link) => {
      const title = (link.innerText ?? "").trim();
      const parent =
        link.closest<HTMLElement>("article") ??
        link.closest<HTMLElement>("li, div, tr") ??
        link.parentElement ??
        link;
      const fullText = (parent.innerText ?? title).replaceAll("\n", " ").trim();
      const afterTitle = fullText.replace(title, "").trim();
      const [rawCompany, rawLocation] = afterTitle.split(" - ", 2);

      return {
        title,
        company: rawCompany?.trim() || "Unknown",
        location: rawLocation?.trim().split("  ")[0] || "Remote",
        href: link.getAttribute("href") ?? "",
      };
    });
  }, GAMES_JOBS_DIRECT_RESULT_LIMIT);

  return rows
    .filter((row) => normalizeWhitespace(row.title).length >= SCRAPED_JOB_TITLE_MIN_LENGTH)
    .slice(0, GAMES_JOBS_DIRECT_RESULT_LIMIT)
    .map((row) => {
      const title = toBoundedText(row.title, SCRAPED_JOB_TITLE_MAX_LENGTH);
      const company = toBoundedText(row.company, SCRAPED_JOB_COMPANY_MAX_LENGTH) || "Unknown";
      const location = toBoundedText(row.location, SCRAPED_JOB_LOCATION_MAX_LENGTH) || "Remote";

      return {
        title,
        company,
        location,
        remote: normalizeWhitespace(location).toLowerCase().includes("remote"),
        description: "",
        url: toAbsoluteUrl(sourceUrl, row.href || sourceUrl),
        source: "gamesjobsdirect",
        postedDate: "",
        contentHash: buildScraperHash("gjd", [title, company, location]),
      };
    });
};
