/**
 * Job services barrel export
 */
export { deduplicateJobs, findDuplicates, generateContentHash, mergeJobs } from "./deduplication";
export { jobAggregator, JobAggregator } from "./job-aggregator";
export { calculateMatchScore, calculateMatchScores, sortByMatchScore } from "./matching-service";
export type { UserProfile } from "./matching-service";
export { CompanyBoardProvider, CompanyBoardsProvider, gameDevNetProvider, gamesJobsDirectProvider, GamingPortalProvider, grackleProvider, GreenhouseProvider, hitmarkerProvider, HitmarkerProvider, JOB_AGGREGATOR_USER_AGENT, JOB_AGGREGATOR_VERSION, jobProviderRegistry, JobProviderRegistry, LeverProvider, pocketGamerProvider, remoteGameJobsProvider, SimpleRateLimiter, workWithIndiesProvider } from "./providers";
export type { Job, JobFilters, JobProvider, JobProviderConfig, RawJob } from "./providers";
