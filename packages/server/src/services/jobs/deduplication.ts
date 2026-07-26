/**
 * Job deduplication service
 * Uses content-based hashing to identify duplicate job postings
 */

import type { RawJob } from "./providers/provider-interface";

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
