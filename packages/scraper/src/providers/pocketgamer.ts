import type { ScrapedJob } from "@bao/shared/schemas/automation-scripts.schema";
import { buildScraperHash } from "../runtime/hash";
import { normalizeWhitespace, toAbsoluteUrl, toBoundedText } from "./provider-helpers";
import type { PageEvaluator } from "./provider-types";
import {
  SCRAPER_JOB_COMPANY_MAX_LENGTH,
  SCRAPER_JOB_DESCRIPTION_MAX_LENGTH,
  SCRAPER_JOB_TITLE_MAX_LENGTH,
  SCRAPER_JOB_TITLE_MIN_LENGTH,
} from "@bao/shared/constants/scraper";
const NUM_40 = 40;

const POCKET_GAMER_RESULT_LIMIT = 40;

type PocketGamerCandidate = {
  title: string;
  company: string;
  description: string;
  href: string;
};

type PocketGamerEvaluateArgs = {
  articleSelector: string;
  titleSelector: string;
  companySelector: string;
  descriptionSelector: string;
};

const classContainsSelector = (className: string): string => `[class*='${className}']`;

const anchorHrefContainsSelector = (hrefFragment: string): string => `a[href*='${hrefFragment}']`;

const extractPocketGamerCandidates = ({
  articleSelector,
  titleSelector,
  companySelector,
  descriptionSelector,
}: PocketGamerEvaluateArgs): PocketGamerCandidate[] => {
  const articles = Array.from(document.querySelectorAll<HTMLElement>(articleSelector));

  return articles.slice(0, NUM_40).map((article) => {
    const titleElement = article.querySelector<HTMLElement>(titleSelector);
    const companyElement = article.querySelector<HTMLElement>(companySelector);
    const descriptionElement = article.querySelector<HTMLElement>(descriptionSelector);
    const linkElement = article.querySelector<HTMLAnchorElement>("a[href]");

    return {
      title: titleElement?.innerText ?? "",
      company: companyElement?.innerText ?? "Unknown",
      description: descriptionElement?.innerText ?? "",
      href: linkElement?.getAttribute("href") ?? "",
    };
  });
};

/**
 * Extracts normalized PocketGamer.biz jobs from the current Playwright page.
 *
 * @param page Page evaluator positioned on a PocketGamer listing.
 * @param sourceUrl Canonical source URL supplied by settings.
 * @returns Normalized job rows.
 */
export const extractPocketGamerJobs = async (
  page: PageEvaluator,
  sourceUrl: string,
): Promise<ScrapedJob[]> => {
  const rows = await page.evaluate(extractPocketGamerCandidates, {
    articleSelector: ["article", ".job-listing", classContainsSelector("job")].join(", "),
    titleSelector: ["h2", "h3", "h4", anchorHrefContainsSelector("job"), ".title"].join(", "),
    companySelector: [".cat", ".company", classContainsSelector("company")].join(", "),
    descriptionSelector: [".strap", ".description", "p"].join(", "),
  });

  return rows
    .filter((row) => normalizeWhitespace(row.title).length >= SCRAPER_JOB_TITLE_MIN_LENGTH)
    .slice(0, POCKET_GAMER_RESULT_LIMIT)
    .map((row) => {
      const title = toBoundedText(row.title, SCRAPER_JOB_TITLE_MAX_LENGTH);
      const company = toBoundedText(row.company, SCRAPER_JOB_COMPANY_MAX_LENGTH) || "Unknown";
      const description = toBoundedText(row.description, SCRAPER_JOB_DESCRIPTION_MAX_LENGTH);

      return {
        title,
        company,
        location: "Remote",
        remote: true,
        description,
        url: toAbsoluteUrl(sourceUrl, row.href || sourceUrl),
        source: "pocketgamer",
        postedDate: "",
        contentHash: buildScraperHash("pg", [title, company, "Remote"]),
      };
    });
};
