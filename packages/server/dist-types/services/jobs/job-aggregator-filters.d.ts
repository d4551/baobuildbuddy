import type { Job, JobFilters } from "@bao/shared";
import { type SQLWrapper } from "drizzle-orm";
export declare const buildSearchConditions: (filters: JobFilters) => SQLWrapper[];
export declare const applyPostFilters: (allJobs: Job[], filters: JobFilters) => Job[];
