/**
 * Lever ATS provider.
 */
import { type JobProvider, type RawJob } from "./provider-interface";
/**
 * Provider for Lever-hosted companies configured in settings.
 */
export declare class LeverProvider implements JobProvider {
    name: string;
    fetchJobs(filters?: {
        query?: string;
    }): Promise<RawJob[]>;
    private fetchCompanyJobs;
    private mapJob;
}
