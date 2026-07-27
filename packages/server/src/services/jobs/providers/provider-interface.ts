/**
 * Provider interface for job aggregation
 */
import { APP_BRAND } from "@bao/shared/tokens/branding";
import type { JobFilters as SharedJobFilters } from "@bao/shared/types/jobs";

export const JOB_AGGREGATOR_VERSION = "1.0";
export const JOB_AGGREGATOR_USER_AGENT = `${APP_BRAND.name}-JobAggregator/${JOB_AGGREGATOR_VERSION}`;

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
