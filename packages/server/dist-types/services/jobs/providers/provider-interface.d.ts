import type { JobFilters as SharedJobFilters } from "@bao/shared/types/jobs";
export declare const JOB_AGGREGATOR_VERSION = "1.0";
export declare const JOB_AGGREGATOR_USER_AGENT: string;
export interface JobProviderConfig {
    name: string;
    baseUrl: string;
    enabled: boolean;
}
export type JobFilters = SharedJobFilters;
export interface RawJob {
    title: string;
    company: string;
    location: string;
    description?: string;
    url: string;
    source?: string;
    postedDate?: string;
    applyUrl?: string;
    [key: string]: unknown;
}
export interface JobProvider {
    name: string;
    type?: string;
    enabled?: boolean;
    fetchJobs(filters?: JobFilters): Promise<RawJob[]>;
}
