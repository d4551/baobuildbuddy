import type { ScrapedJob } from "@bao/shared/schemas/automation-scripts.schema";
import {
  SCRAPED_JOB_COMPANY_MAX_LENGTH,
  SCRAPED_JOB_LOCATION_MAX_LENGTH,
  SCRAPED_JOB_TITLE_MAX_LENGTH,
  SCRAPED_JOB_TITLE_MIN_LENGTH_SHORT,
} from "../constants/scrape-fields";
import { buildScraperHash } from "../runtime/hash";
import { normalizeWhitespace, toAbsoluteUrl, toBoundedText } from "./provider-helpers";
import type { PageEvaluator } from "./provider-types";

const GRACKLE_RESULT_LIMIT = 50;

type GrackleCandidate = {
  title: string;
  company: string;
  location: string;
  href: string;
};

type GrackleEvaluateArgs = {
  resultLimit: number;
  titleMinLength: number;
};

/**
 * Extracts normalized GrackleHQ jobs from the current Playwright page.
 *
 * @param page Page evaluator positioned on a GrackleHQ listing.
 * @param sourceUrl Canonical source URL supplied by settings.
 * @returns Normalized job rows.
 */
const mapGrackleRowsToJobs = (rows: GrackleCandidate[], sourceUrl: string): ScrapedJob[] =>
  rows.slice(0, GRACKLE_RESULT_LIMIT).map((row) => {
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
      source: "grackle",
      postedDate: "",
      contentHash: buildScraperHash("grackle", [title, company, location]),
    };
  });

export const extractGrackleJobs = async (
  page: PageEvaluator,
  sourceUrl: string,
): Promise<ScrapedJob[]> => {
  const rows = await page.evaluate(
    ({ resultLimit, titleMinLength }: GrackleEvaluateArgs) => {
      const stripLeadingSeparator = (value: string): string =>
        value.startsWith("-") ? value.slice(1).trimStart() : value;
      const getListingCandidate = (listing: HTMLElement): GrackleCandidate | null => {
        const link =
          listing.querySelector<HTMLAnchorElement>("a[target='_blank']") ??
          listing.querySelector<HTMLAnchorElement>("a");
        if (!link) {
          return null;
        }

        const title = (link.innerText ?? "").trim();
        if (title.length < titleMinLength) {
          return null;
        }

        const fullText = (listing.innerText ?? "").replaceAll("\n", " ").trim();
        const afterTitle = fullText.replace(title, "").trim();
        const [rawCompany, rawLocation] = afterTitle.split(" - ", 2);

        return {
          title,
          company: rawCompany ? stripLeadingSeparator(rawCompany.trim()) : "Unknown",
          location: rawLocation?.trim().split("  ")[0] || "Remote",
          href: link.getAttribute("href") ?? "",
        };
      };

      return Array.from(document.querySelectorAll<HTMLElement>("div.joblisting"))
        .slice(0, resultLimit)
        .flatMap((listing) => {
          const candidate = getListingCandidate(listing);
          return candidate ? [candidate] : [];
        });
    },
    {
      resultLimit: GRACKLE_RESULT_LIMIT,
      titleMinLength: SCRAPED_JOB_TITLE_MIN_LENGTH_SHORT,
    },
  );

  return mapGrackleRowsToJobs(rows, sourceUrl);
};
