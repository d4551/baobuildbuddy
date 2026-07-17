/**
 * Job deduplication service
 * Uses content-based hashing to identify duplicate job postings
 */

import { API_ERROR_CANNOT_MERGE_EMPTY_JOBS } from "@bao/shared/constants/api-errors";
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

/**
 * Find duplicate jobs across multiple sources
 * Returns a map of content hash to array of matching jobs
 */
export function findDuplicates(jobs: RawJob[]): Map<string, RawJob[]> {
  const hashMap = new Map<string, RawJob[]>();

  for (const job of jobs) {
    const hash = generateContentHash(job);
    const existing = hashMap.get(hash) || [];
    existing.push(job);
    hashMap.set(hash, existing);
  }

  const duplicates = new Map<string, RawJob[]>();
  for (const [hash, matches] of hashMap.entries()) {
    if (matches.length > 1) {
      duplicates.set(hash, matches);
    }
  }

  return duplicates;
}

function mergeJobValues(merged: RawJob, job: RawJob): void {
  if (!merged.description && job.description) {
    merged.description = job.description;
  }

  for (const [key, value] of Object.entries(job)) {
    if (value && !merged[key]) {
      merged[key] = value;
    }
  }
}

/**
 * Merge duplicate job postings by combining their metadata
 * Prefers non-empty values and combines arrays
 */
export function mergeJobs(jobs: RawJob[]): RawJob {
  if (jobs.length === 0) {
    throw new Error(API_ERROR_CANNOT_MERGE_EMPTY_JOBS);
  }

  if (jobs.length === 1) {
    return jobs[0];
  }

  const merged: RawJob = { ...jobs[0] };

  const sources = new Set<string>();
  const urls = new Set<string>();

  for (const job of jobs) {
    if (job.source) sources.add(job.source);
    if (job.url) urls.add(job.url);
    mergeJobValues(merged, job);
  }

  merged.sources = Array.from(sources);
  merged.alternativeUrls = Array.from(urls);

  return merged;
}
