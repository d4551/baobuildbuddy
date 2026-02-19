/**
 * Provider interface for job aggregation
 */
import { APP_BRAND } from "@bao/shared";

export const JOB_AGGREGATOR_VERSION = "1.0";
export const JOB_AGGREGATOR_USER_AGENT = `${APP_BRAND.name}-JobAggregator/${JOB_AGGREGATOR_VERSION}`;

export interface JobProviderConfig {
  name: string;
  baseUrl: string;
  enabled: boolean;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  description: string;
  url: string;
  source: string;
  postedDate: string;
  contentHash?: string;
}

export interface JobFilters {
  query?: string;
  location?: string;
  remote?: boolean;
  keywords?: string[];
}

export interface RawJob {
  title: string;
  company: string;
  location: string;
  description?: string;
  url: string;
  postedDate?: string;
  [key: string]: unknown;
}

export interface JobProvider {
  name: string;
  type?: string;
  enabled?: boolean;
  fetchJobs(filters: JobFilters): Promise<Job[]>;
}
