import type { JobFilters, JobProvider, RawJob } from "./provider-interface";
export declare class SimpleRateLimiter {
    private maxPerWindow;
    private windowMs;
    private requests;
    constructor(maxPerWindow?: number, windowMs?: number);
    canMakeRequest(provider: string): boolean;
    recordRequest(provider: string): void;
}
export declare class JobProviderRegistry {
    private providers;
    private rateLimiter;
    private logger;
    register(provider: JobProvider): void;
    unregister(name: string): void;
    getProvider(name: string): JobProvider | undefined;
    getEnabledProviders(): JobProvider[];
    getProviderStatus(): Array<{
        name: string;
        enabled: boolean;
        type: string;
    }>;
    fetchAllJobs(filters: JobFilters): Promise<RawJob[]>;
}
export declare const jobProviderRegistry: JobProviderRegistry;
