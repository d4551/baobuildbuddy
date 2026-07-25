import type { ScrapedJob } from "@bao/shared/schemas/automation-scripts.schema";
import {
  SCRAPED_JOB_COMPANY_MAX_LENGTH,
  SCRAPED_JOB_DESCRIPTION_MAX_LENGTH,
  SCRAPED_JOB_TITLE_MAX_LENGTH,
  SCRAPED_JOB_TITLE_MIN_LENGTH,
} from "../constants/scrape-fields";
import { buildScraperHash } from "../runtime/hash";
import { normalizeWhitespace, toAbsoluteUrl, toBoundedText } from "./provider-helpers";
import type { PageEvaluator } from "./provider-types";

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
  resultLimit: number;
};

const classContainsSelector = (className: string): string => `[class*='${className}']`;

const anchorHrefContainsSelector = (hrefFragment: string): string => `a[href*='${hrefFragment}']`;

const extractPocketGamerCandidates = ({
  articleSelector,
  titleSelector,
  companySelector,
  descriptionSelector,
  resultLimit,
}: PocketGamerEvaluateArgs): PocketGamerCandidate[] => {
  const articles = Array.from(document.querySelectorAll<HTMLElement>(articleSelector));

  return articles.slice(0, resultLimit).map((article) => {
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
    resultLimit: POCKET_GAMER_RESULT_LIMIT,
  });

  return rows
    .filter((row) => normalizeWhitespace(row.title).length >= SCRAPED_JOB_TITLE_MIN_LENGTH)
    .slice(0, POCKET_GAMER_RESULT_LIMIT)
    .map((row) => {
      const title = toBoundedText(row.title, SCRAPED_JOB_TITLE_MAX_LENGTH);
      const company = toBoundedText(row.company, SCRAPED_JOB_COMPANY_MAX_LENGTH) || "Unknown";
      const description = toBoundedText(row.description, SCRAPED_JOB_DESCRIPTION_MAX_LENGTH);

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
