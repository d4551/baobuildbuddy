import type { ScrapedJob } from "@bao/shared";
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

/**
 * Extracts normalized GrackleHQ jobs from the current Playwright page.
 *
 * @param page Page evaluator positioned on a GrackleHQ listing.
 * @param sourceUrl Canonical source URL supplied by settings.
 * @returns Normalized job rows.
 */
export const extractGrackleJobs = async (
  page: PageEvaluator,
  sourceUrl: string,
): Promise<ScrapedJob[]> => {
  const rows = await page.evaluate((resultLimit) => {
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
      if (title.length < 3) {
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
  }, GRACKLE_RESULT_LIMIT);

  return rows.slice(0, GRACKLE_RESULT_LIMIT).map((row) => {
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
      source: "grackle",
      postedDate: "",
      contentHash: buildScraperHash("grackle", [title, company, location]),
    };
  });
};
