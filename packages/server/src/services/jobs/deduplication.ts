/**
 * Job deduplication service
 * Uses content-based hashing to identify duplicate job postings
 */

import type { RawJob } from "./providers/provider-interface";

/** The fields every ingest path can offer when asking for a posting's identity. */
export type ContentHashSource = {
  readonly title: string;
  readonly company: string;
  readonly location: string;
};

/**
 * The single owner of job identity.
 *
 * Both ingest paths — the aggregator and the scraper persistence layer — must resolve one
 * posting to the same hash, or `content_hash` upserts silently admit a second row.
 *
 * Routing both through one function was not enough: it previously preferred a
 * provider-supplied `contentHash` when present and derived the canonical hash otherwise.
 * The scraper's postings carry that field and the aggregator's `RawJob` does not, so the
 * same function still returned two answers for one posting. Verified in the live database —
 * "Customer Support Lead" at Swish Breaks was stored twice under one source, once as
 * `3c67abbb…` (canonical) and once as `hitmarker-45380d86f091` (provider).
 *
 * Identity therefore derives only from the posting's own fields and never branches on the
 * shape of the caller's input.
 */
export function resolveContentHash(job: ContentHashSource): string {
  return generateContentHash(job);
}

/**
 * Generate a content hash for a job posting
 * Uses title + company + location to create a unique identifier
 */
export function generateContentHash(
  job: RawJob | { title: string; company: string; location: string },
): string {
  // Normalize the content for consistent hashing
  const normalizedTitle = job.title.toLowerCase().trim().replace(/\s+/g, " ");
  const normalizedCompany = job.company.toLowerCase().trim().replace(/\s+/g, " ");
  const normalizedLocation = job.location.toLowerCase().trim().replace(/\s+/g, " ");

  const content = `${normalizedTitle}|${normalizedCompany}|${normalizedLocation}`;

  // Use Bun's native crypto hasher
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(content);

  return hasher.digest("hex");
}

/**
 * Remove duplicate jobs based on content hash
 * Keeps the first occurrence of each unique job
 */
export function deduplicateJobs<T extends RawJob>(jobs: T[]): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const job of jobs) {
    const hash = generateContentHash(job);

    if (!seen.has(hash)) {
      seen.add(hash);
      unique.push(job);
    }
  }

  return unique;
}
