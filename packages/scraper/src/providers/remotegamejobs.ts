import type { ScrapedJob } from "@bao/shared";
import { buildScraperHash } from "../runtime/hash";
import { toAbsoluteUrl, toBoundedText } from "./provider-helpers";
import type { PageEvaluator } from "./provider-types";

const REMOTE_GAME_JOBS_RESULT_LIMIT = 50;
const EMPLOYMENT_TYPE_TOKENS = ["full-time", "part-time", "contract", "freelance", "internship"];
const REMOTE_GAME_JOBS_BOX_SELECTOR = ".job-box";
const REMOTE_GAME_JOBS_PRIMARY_LINK_SELECTOR = "a.has-text-black";
const REMOTE_GAME_JOBS_FALLBACK_LINK_SELECTOR = "a[href*='/jobs/']";

type RemoteGameJobsCandidate = {
  title: string;
  company: string;
  href: string;
};

type RemoteGameJobsEvaluateArgs = {
  employmentTypeTokens: readonly string[];
  boxSelector: string;
  primaryLinkSelector: string;
  fallbackLinkSelector: string;
};

const extractRemoteGameJobsCandidates = ({
  employmentTypeTokens,
  boxSelector,
  primaryLinkSelector,
  fallbackLinkSelector,
}: RemoteGameJobsEvaluateArgs): RemoteGameJobsCandidate[] => {
  const findCompanyLine = (lines: string[], title: string): string =>
    lines.find((line) => {
      const lowered = line.toLowerCase();
      return (
        line !== title &&
        !employmentTypeTokens.includes(lowered) &&
        !line.startsWith("Remote") &&
        line.length > 2 &&
        line.length < 80
      );
    }) ?? "Unknown";

  const boxes = Array.from(document.querySelectorAll<HTMLElement>(boxSelector));

  return boxes.slice(0, 50).flatMap((box) => {
    const link =
      box.querySelector<HTMLAnchorElement>(primaryLinkSelector) ??
      box.querySelector<HTMLAnchorElement>(fallbackLinkSelector);
    if (!link) {
      return [];
    }

    const title = ((link.textContent ?? "").trim().split("\n")[0] ?? "").trim();
    if (title.length < 5) {
      return [];
    }

    const lines = (box.innerText ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return [
      {
        title,
        company: findCompanyLine(lines, title),
        href: link.getAttribute("href") ?? "",
      },
    ];
  });
};

/**
 * Extracts normalized RemoteGameJobs entries from the current Playwright page.
 *
 * @param page Page evaluator positioned on a RemoteGameJobs listing.
 * @param sourceUrl Canonical source URL supplied by settings.
 * @returns Normalized job rows.
 */
export const extractRemoteGameJobs = async (
  page: PageEvaluator,
  sourceUrl: string,
): Promise<ScrapedJob[]> => {
  const rows = await page.evaluate(extractRemoteGameJobsCandidates, {
    employmentTypeTokens: EMPLOYMENT_TYPE_TOKENS,
    boxSelector: REMOTE_GAME_JOBS_BOX_SELECTOR,
    primaryLinkSelector: REMOTE_GAME_JOBS_PRIMARY_LINK_SELECTOR,
    fallbackLinkSelector: REMOTE_GAME_JOBS_FALLBACK_LINK_SELECTOR,
  });

  return rows.slice(0, REMOTE_GAME_JOBS_RESULT_LIMIT).map((row) => {
    const title = toBoundedText(row.title, 200);
    const company = toBoundedText(row.company, 100) || "Unknown";

    return {
      title,
      company,
      location: "Remote",
      remote: true,
      description: "",
      url: toAbsoluteUrl(sourceUrl, row.href || sourceUrl),
      source: "remotegamejobs",
      postedDate: "",
      contentHash: buildScraperHash("rgj", [title, company, "Remote"]),
    };
  });
};
