/**
 * Job Aggregator Service
 * Orchestrates job fetching, caching, and searching across multiple providers
 */
import type { Job, JobFilters, JobSearchResult } from "@bao/shared";
import { applications } from "../../db/schema/jobs";
export declare class JobAggregator {
    private providers;
    private cacheExpiry;
    private readonly studioTypes;
    private readonly genres;
    private readonly platformsSet;
    constructor();
    /**
     * Refresh jobs from all providers and update cache
     */
    refreshJobs(): Promise<{
        total: number;
        new: number;
        updated: number;
    }>;
    /**
     * Search jobs with filters and pagination
     */
    searchJobs(filters?: JobFilters): Promise<JobSearchResult>;
    /**
     * Get a single job by ID
     */
    getJobById(id: string): Promise<Job | null>;
    /**
     * Save a job for later
     */
    saveJob(jobId: string): Promise<void>;
    /**
     * Get all saved jobs
     */
    getSavedJobs(): Promise<Job[]>;
    /**
     * Remove a saved job
     */
    unsaveJob(jobId: string): Promise<void>;
    /**
     * Apply to a job
     */
    applyToJob(jobId: string, notes?: string): Promise<string>;
    /**
     * Get all applications
     */
    getApplications(): Promise<Array<typeof applications.$inferSelect & {
        job: Job;
    }>>;
    /**
     * Update application status
     */
    updateApplicationStatus(applicationId: string, status: string, note?: string): Promise<void>;
    /**
     * Check if cache needs refresh
     */
    needsRefresh(): Promise<boolean>;
    /**
     * Get statistics about cached jobs
     */
    getStats(): Promise<{
        total: number;
        bySource: Record<string, number>;
        byExperienceLevel: Record<string, number>;
        remoteCount: number;
        lastUpdated: string | null;
    }>;
    /**
     * Convert RawJob to Job format
     */
    private rawJobToJob;
    /**
     * Convert database row to Job format
     */
    private dbRowToJob;
    private normalizeSalary;
    private detectRemote;
    private normalizeStudioType;
    private normalizeGameGenres;
    private normalizePlatforms;
    private detectHybrid;
    private detectExperienceLevel;
    private detectJobType;
    private detectStudioType;
    private extractRequirements;
    private extractTechnologies;
    private extractGenres;
    private extractPlatforms;
    private generateTags;
}
export declare const jobAggregator: JobAggregator;
