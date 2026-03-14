import type { ScrapedJob } from "@bao/shared";
import type { Page } from "playwright";
import { buildScraperHash } from "../runtime/hash";
import { normalizeWhitespace, toAbsoluteUrl, toBoundedText } from "./provider-helpers";

const GAMES_JOBS_DIRECT_RESULT_LIMIT = 80;

/**
 * Extracts normalized GamesJobsDirect entries from the current Playwright page.
 *
 * @param page Playwright page positioned on a GamesJobsDirect listing.
 * @param sourceUrl Canonical source URL supplied by settings.
 * @returns Normalized job rows.
 */
export const extractGamesJobsDirectJobs = async (
  page: Page,
  sourceUrl: string,
): Promise<ScrapedJob[]> => {
  const rows = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href*='/job/']"));
    return links.slice(0, 80).map((link) => {
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
  });

  return rows
    .filter((row) => normalizeWhitespace(row.title).length >= 5)
    .slice(0, GAMES_JOBS_DIRECT_RESULT_LIMIT)
    .map((row) => {
      const title = toBoundedText(row.title, 200);
      const company = toBoundedText(row.company, 100) || "Unknown";
      const location = toBoundedText(row.location, 100) || "Remote";

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
