/**
 * Greenhouse ATS provider.
 */
import { type JobProvider, type RawJob } from "./provider-interface";
/**
 * Provider for Greenhouse-hosted boards configured in settings.
 */
export declare class GreenhouseProvider implements JobProvider {
    name: string;
    fetchJobs(filters?: {
        query?: string;
    }): Promise<RawJob[]>;
    private fetchBoardJobs;
    private mapJob;
}
