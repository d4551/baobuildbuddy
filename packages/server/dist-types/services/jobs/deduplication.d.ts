/**
 * Job deduplication service
 * Uses content-based hashing to identify duplicate job postings
 */
import type { RawJob } from "./providers/provider-interface";
/**
 * Generate a content hash for a job posting
 * Uses title + company + location to create a unique identifier
 */
export declare function generateContentHash(job: RawJob | {
    title: string;
    company: string;
    location: string;
}): string;
/**
 * Remove duplicate jobs based on content hash
 * Keeps the first occurrence of each unique job
 */
export declare function deduplicateJobs<T extends RawJob>(jobs: T[]): T[];
