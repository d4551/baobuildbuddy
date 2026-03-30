/**
 * Job Aggregator Service
 * Orchestrates job fetching, caching, and searching across multiple providers.
 */
import type { Job, JobFilters, JobSearchResult } from "@bao/shared";
import type { applications } from "../../db/schema/jobs";
export declare class JobAggregator {
    private readonly providers;
    private readonly cacheExpiry;
    private readonly logger;
    constructor();
    private fetchProviderJobs;
    private saveOrUpdateJob;
    refreshJobs(): Promise<{
        total: number;
        new: number;
        updated: number;
    }>;
    searchJobs(filters?: JobFilters): Promise<JobSearchResult>;
    getJobById(id: string): Promise<Job | null>;
    saveJob(jobId: string): Promise<void>;
    getSavedJobs(): Promise<Job[]>;
    unsaveJob(jobId: string): Promise<void>;
    applyToJob(jobId: string, notes?: string): Promise<string>;
    getApplications(): Promise<Array<typeof applications.$inferSelect & {
        job: Job;
    }>>;
    updateApplicationStatus(applicationId: string, status: string, note?: string): Promise<void>;
    needsRefresh(): Promise<boolean>;
    getStats(): Promise<{
        total: number;
        bySource: Record<string, number>;
        byExperienceLevel: Record<string, number>;
        remoteCount: number;
        lastUpdated: string | null;
    }>;
}
export declare const jobAggregator: JobAggregator;
