import type { ScrapedJob } from "@bao/shared/schemas/automation-scripts.schema";
import { buildScraperHash } from "../runtime/hash";
import { normalizeWhitespace, toAbsoluteUrl, toBoundedText } from "./provider-helpers";
import type { PageEvaluator } from "./provider-types";

const WORK_WITH_INDIES_RESULT_LIMIT = 60;
const HIRING_PATTERN =
  /(.+?)\s+is hiring\s+(?:a |an )?(.+?)(?:to (?:work from|join)\s+(.+?))?(?:Learn More|$)/iu;

type WorkWithIndiesCandidate = {
  company: string;
  title: string;
  location: string;
  href: string;
};

/**
 * Extracts normalized Work With Indies jobs from the current Playwright page.
 *
 * @param page Page evaluator positioned on a Work With Indies listing.
 * @param sourceUrl Canonical source URL supplied by settings.
 * @returns Normalized job rows.
 */
export const extractWorkWithIndiesJobs = async (
  page: PageEvaluator,
  sourceUrl: string,
): Promise<ScrapedJob[]> => {
  const rows = await page.evaluate(() => {
    const cards = Array.from(
      document.querySelectorAll<HTMLAnchorElement>("a.job-card, a[href*='/careers/']"),
    );

    return cards.slice(0, 60).map((card) => ({
      text: (card.innerText ?? "").replaceAll("\n", " ").trim(),
      href: card.getAttribute("href") ?? "",
    }));
  });

  const candidates: WorkWithIndiesCandidate[] = [];

  for (const row of rows) {
    const match = row.text.match(HIRING_PATTERN);
    if (!match) {
      continue;
    }

    const company = normalizeWhitespace(match[1] ?? "");
    const title = normalizeWhitespace(match[2] ?? "");
    const location = normalizeWhitespace(match[3] ?? "Remote");

    if (title.length < 3 || company.length > 80) {
      continue;
    }

    const loweredCompany = company.toLowerCase();
    if (loweredCompany.includes("resume") || loweredCompany.includes("discord")) {
      continue;
    }

    candidates.push({
      company,
      title,
      location,
      href: row.href,
    });
  }

  return candidates.slice(0, WORK_WITH_INDIES_RESULT_LIMIT).map((row) => {
    const title = toBoundedText(row.title, 200);
    const company = toBoundedText(row.company, 100);
    const location = toBoundedText(row.location, 100) || "Remote";

    return {
      title,
      company,
      location,
      remote:
        normalizeWhitespace(location).toLowerCase().includes("remote") ||
        normalizeWhitespace(location).toLowerCase().includes("anywhere"),
      description: "",
      url: toAbsoluteUrl(sourceUrl, row.href),
      source: "workwithindies",
      postDate: "",
      contentHash: buildScraperHash("wwi", [title, company, location]),
    };
  });
};
