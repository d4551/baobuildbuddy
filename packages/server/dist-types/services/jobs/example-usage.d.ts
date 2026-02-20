/**
 * Example usage of the job board service
 * This file demonstrates how to use the job aggregator and matching service
 */
declare function refreshJobs(): Promise<void>;
declare function searchUnityJobs(): Promise<void>;
declare function calculateMatches(): Promise<void>;
declare function trackApplications(): Promise<void>;
declare function advancedSearch(): Promise<void>;
declare function maintainCache(): Promise<void>;
export { refreshJobs, searchUnityJobs, calculateMatches, trackApplications, advancedSearch, maintainCache, };
