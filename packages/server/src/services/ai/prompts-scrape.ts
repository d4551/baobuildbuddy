import type { ScrapedJob, ScrapedStudio } from "@bao/shared";

/**
 * Scrape enrichment prompt for a normalized scraped job row.
 */
export function scrapeJobEnrichmentPrompt(job: ScrapedJob): string {
  return `You are enriching a scraped game-industry job posting for interview preparation and application strategy.

Job:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Remote: ${job.remote ? "true" : "false"}
- Source: ${job.source ?? "unknown"}
- Posted date: ${job.postDate ?? job.postedDate ?? "unknown"}
- URL: ${job.url ?? "unknown"}
- Description: ${job.description ?? "Not provided"}

Return strict JSON object only for scrape enrichment:
{
  "summary": "One concise summary sentence grounded in the posting.",
  "hiringSignals": ["signal 1", "signal 2"],
  "interviewFocusAreas": ["focus area 1", "focus area 2"],
  "candidatePitchAngles": ["pitch angle 1", "pitch angle 2"]
}

Constraints:
1. Use only information inferable from the posting.
2. Keep every list to 2-4 short items.
3. Make the focus areas directly useful for interview practice.
4. Make the pitch angles directly useful for resume, cover-letter, or interview positioning.
5. Return JSON only with no markdown fences or commentary.`;
}

/**
 * Scrape enrichment prompt for a normalized scraped studio row.
 */
export function scrapeStudioEnrichmentPrompt(studio: ScrapedStudio): string {
  return `You are enriching a scraped game studio profile for interview preparation and candidate positioning.

Studio:
- Name: ${studio.name}
- Website: ${studio.website ?? "unknown"}
- Location: ${studio.location ?? "unknown"}
- Size: ${studio.size ?? "unknown"}
- Type: ${studio.type ?? "unknown"}
- Description: ${studio.description ?? "Not provided"}
- Games: ${studio.games?.join(", ") ?? "unknown"}
- Technologies: ${studio.technologies?.join(", ") ?? "unknown"}
- Interview style: ${studio.interviewStyle ?? "unknown"}
- Remote work: ${studio.remoteWork === null ? "unknown" : studio.remoteWork ? "true" : "false"}

Return strict JSON object only for scrape enrichment:
{
  "summary": "One concise summary sentence grounded in the studio profile.",
  "hiringSignals": ["signal 1", "signal 2"],
  "interviewFocusAreas": ["focus area 1", "focus area 2"],
  "candidatePitchAngles": ["pitch angle 1", "pitch angle 2"]
}

Constraints:
1. Use only information inferable from the profile.
2. Keep every list to 2-4 short items.
3. Focus hiring signals on team shape, product context, workflow, or interview emphasis.
4. Make the focus areas directly useful for studio-specific interview preparation.
5. Return JSON only with no markdown fences or commentary.`;
}
