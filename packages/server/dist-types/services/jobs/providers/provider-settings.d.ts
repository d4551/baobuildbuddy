import { type JobProviderSettings } from "@bao/shared";
/**
 * Loads persisted job-provider runtime settings from the settings table.
 */
export declare function loadJobProviderSettings(): Promise<JobProviderSettings>;
