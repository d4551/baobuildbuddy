import type { CompanyBoardConfig, JobProviderSettings } from "@bao/shared";
import type { JobProvider, RawJob } from "./provider-interface";
/**
 * Provider that normalizes a single ATS board payload into `RawJob[]`.
 */
export declare class CompanyBoardProvider implements JobProvider {
    name: string;
    type: string;
    enabled: boolean;
    private readonly config;
    constructor(config: CompanyBoardConfig);
    fetchJobs(): Promise<RawJob[]>;
    fetchJobsWithSettings(providerSettings: JobProviderSettings): Promise<RawJob[]>;
    private parseJobs;
    private parseGreenhouseJobs;
    private parseLeverJobs;
    private parseSmartRecruitersJobs;
    private parseGenericJobs;
}
/**
 * Provider that fetches all configured company-board ATS sources.
 */
export declare class CompanyBoardsProvider implements JobProvider {
    name: string;
    type: string;
    enabled: boolean;
    fetchJobs(): Promise<RawJob[]>;
}
