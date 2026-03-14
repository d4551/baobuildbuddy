import type { ScrapedJob } from "@bao/shared";
import type { Page } from "playwright";
import { buildScraperHash } from "../runtime/hash";
import { toAbsoluteUrl, toBoundedText } from "./provider-helpers";

const HITMARKER_SCAN_LIMIT = 60;
const HITMARKER_RESULT_LIMIT = 40;
const HITMARKER_LOCATION_HINTS = ["remote", "usa", "uk", "europe", "canada", "worldwide"];
const HITMARKER_CARD_SELECTOR = "a[href*='/jobs/']";

type HitmarkerCandidate = {
  title: string;
  company: string;
  location: string;
  href: string;
  remote: boolean;
};

type HitmarkerEvaluateArgs = {
  locationHints: readonly string[];
  scanLimit: number;
  cardSelector: string;
};

const extractHitmarkerCandidates = ({
  locationHints,
  scanLimit,
  cardSelector,
}: HitmarkerEvaluateArgs): HitmarkerCandidate[] => {
  const splitNonEmptyLines = (value: string): string[] =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

  const resolveLocation = (lines: string[]): string =>
    lines
      .slice(2)
      .find((line) => locationHints.some((hint) => line.toLowerCase().includes(hint))) ?? "Remote";

  const seen = new Set<string>();
  const cards = Array.from(document.querySelectorAll<HTMLAnchorElement>(cardSelector));

  return cards.slice(0, scanLimit).flatMap((card) => {
    const href = card.getAttribute("href") ?? "";
    if (!href || seen.has(href) || !href.includes("/jobs/")) {
      return [];
    }
    seen.add(href);

    const lines = splitNonEmptyLines(card.innerText ?? "");
    if (lines.length < 2) {
      return [];
    }

    const title = lines[0] ?? "";
    if (title.trim().length < 5) {
      return [];
    }

    const location = resolveLocation(lines);
    return [
      {
        title,
        company: lines[1] ?? "Unknown",
        location,
        href,
        remote: location.toLowerCase().includes("remote"),
      },
    ];
  });
};

/**
 * Extracts normalized Hitmarker jobs from the current Playwright page.
 *
 * @param page Playwright page positioned on a Hitmarker listing.
 * @param sourceUrl Canonical source URL supplied by settings.
 * @returns Normalized job rows.
 */
export const extractHitmarkerJobs = async (
  page: Page,
  sourceUrl: string,
): Promise<ScrapedJob[]> => {
  const rows = await page.evaluate(extractHitmarkerCandidates, {
    locationHints: HITMARKER_LOCATION_HINTS,
    scanLimit: HITMARKER_SCAN_LIMIT,
    cardSelector: HITMARKER_CARD_SELECTOR,
  });

  return rows.slice(0, HITMARKER_RESULT_LIMIT).map((row) => {
    const title = toBoundedText(row.title, 200);
    const company = toBoundedText(row.company, 100) || "Unknown";
    const location = toBoundedText(row.location, 100) || "Remote";

    return {
      title,
      company,
      location,
      url: toAbsoluteUrl(sourceUrl, row.href),
      source: "hitmarker",
      contentHash: buildScraperHash("hitmarker", [title, company, location, "hitmarker"]),
      description: "",
      postDate: "",
      remote: row.remote,
    };
  });
};
