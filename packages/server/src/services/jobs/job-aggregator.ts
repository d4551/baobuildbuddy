/**
 * Job Aggregator Service
 * Orchestrates job fetching, caching, and searching across multiple providers.
 */

import {
  JOB_AGGREGATOR_CACHE_EXPIRY_MS,
  JOB_QUERY_DEFAULT_LIMIT,
  JOB_QUERY_DEFAULT_PAGE,
} from "@bao/shared/constants/jobs";
import type { Job, JobFilters, JobSearchResult } from "@bao/shared/types/jobs";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/client";
import type { applications } from "../../db/schema/jobs";
import { jobs, savedJobs } from "../../db/schema/jobs";
import { createServerLogger } from "../../utils/logger";
import { deduplicateJobs } from "./deduplication";
import {
  applyToJob,
  getApplications,
  updateApplicationStatus,
} from "./job-aggregator-applications";
import { applyPostFilters, buildSearchConditions } from "./job-aggregator-filters";
import { dbRowToJob, rawJobToInsert } from "./job-aggregator-mappers";
import { getJobStats, needsRefresh } from "./job-aggregator-stats";
import { CompanyBoardsProvider } from "./providers/company-board";
import {
  gamesJobsDirectProvider,
  grackleProvider,
  hitmarkerPortalProvider,
  pocketGamerProvider,
  remoteGameJobsProvider,
  workWithIndiesProvider,
} from "./providers/gaming-providers";
import { GreenhouseProvider } from "./providers/greenhouse";
import { LeverProvider } from "./providers/lever";
import type { JobProvider, RawJob } from "./providers/provider-interface";

export class JobAggregator {
  private readonly providers: JobProvider[];
  private readonly cacheExpiry: number;
  private readonly logger = createServerLogger("job-aggregator");

  constructor() {
    this.providers = [
      new GreenhouseProvider(),
      new LeverProvider(),
      hitmarkerPortalProvider,
      grackleProvider,
      workWithIndiesProvider,
      remoteGameJobsProvider,
      gamesJobsDirectProvider,
      pocketGamerProvider,
      new CompanyBoardsProvider(),
    ];
    this.cacheExpiry = JOB_AGGREGATOR_CACHE_EXPIRY_MS;
  }

  private async fetchProviderJobs(): Promise<RawJob[]> {
    const results = await Promise.allSettled(
      this.providers.map((provider) => provider.fetchJobs()),
    );

    return results.flatMap((result, index) => {
      const providerName = this.providers[index]?.name || "unknown-provider";
      if (result.status === "fulfilled") {
        this.logger.info(`${providerName}: fetched ${result.value.length} jobs`);
        return result.value;
      }
      this.logger.error(
        `${providerName}: failed`,
        result.reason instanceof Error ? result.reason.message : String(result.reason),
      );
      return [];
    });
  }

  private async saveOrUpdateJob(rawJob: RawJob): Promise<"new" | "updated" | "skipped"> {
    const job = await rawJobToInsert(rawJob);
    if (!job.contentHash) {
      return "skipped";
    }

    const existing = await db
      .select()
      .from(jobs)
      .where(eq(jobs.contentHash, job.contentHash))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(jobs).values(job);
      return "new";
    }

    await db
      .update(jobs)
      .set({
        ...job,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(jobs.id, existing[0].id));
    return "updated";
  }

  async refreshJobs(): Promise<{ total: number; new: number; updated: number }> {
    this.logger.info("Starting job refresh from all providers");

    const allRawJobs = await this.fetchProviderJobs();
    const uniqueJobs = deduplicateJobs(allRawJobs);
    this.logger.debug(`Deduplicated: ${allRawJobs.length} -> ${uniqueJobs.length} jobs`);

    let newCount = 0;
    let updatedCount = 0;
    const saveResults = await Promise.allSettled(
      uniqueJobs.map((rawJob) => this.saveOrUpdateJob(rawJob)),
    );

    for (const result of saveResults) {
      if (result.status === "fulfilled") {
        if (result.value === "new") {
          newCount += 1;
        }
        if (result.value === "updated") {
          updatedCount += 1;
        }
        continue;
      }
      this.logger.error(
        "Failed to save job:",
        result.reason instanceof Error ? result.reason.message : String(result.reason),
      );
    }

    this.logger.info(`Refresh complete: ${newCount} new, ${updatedCount} updated`);

    return {
      total: uniqueJobs.length,
      new: newCount,
      updated: updatedCount,
    };
  }

  async searchJobs(filters: JobFilters = {}): Promise<JobSearchResult> {
    const limit = filters.limit ?? JOB_QUERY_DEFAULT_LIMIT;
    const page = filters.page ?? JOB_QUERY_DEFAULT_PAGE;
    const conditions = buildSearchConditions(filters);
    const queryBuilder =
      conditions.length > 0
        ? db
            .select()
            .from(jobs)
            .where(and(...conditions))
        : db.select().from(jobs);
    const offset = (page - 1) * limit;
    const results = await queryBuilder.orderBy(desc(jobs.postedDate)).limit(limit).offset(offset);
    const jobResults = results.map((row) => dbRowToJob(row));
    const filteredJobs = applyPostFilters(jobResults, filters);

    return {
      jobs: filteredJobs,
      total: filteredJobs.length,
      page,
      limit,
      filters,
    };
  }

  async getJobById(id: string): Promise<Job | null> {
    const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (result.length === 0) {
      return null;
    }
    return dbRowToJob(result[0]);
  }

  async saveJob(jobId: string): Promise<void> {
    await db.insert(savedJobs).values({
      id: crypto.randomUUID(),
      jobId,
      savedAt: new Date().toISOString(),
    });
  }

  async getSavedJobs(): Promise<Job[]> {
    const result = await db
      .select({ job: jobs })
      .from(savedJobs)
      .innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
      .orderBy(desc(savedJobs.savedAt));

    return result.map((row) => dbRowToJob(row.job));
  }

  async unsaveJob(jobId: string): Promise<void> {
    await db.delete(savedJobs).where(eq(savedJobs.jobId, jobId));
  }

  async applyToJob(jobId: string, notes?: string): Promise<string> {
    return applyToJob(jobId, notes);
  }

  async getApplications(): Promise<Array<typeof applications.$inferSelect & { job: Job }>> {
    return getApplications();
  }

  async updateApplicationStatus(
    applicationId: string,
    status: string,
    note?: string,
  ): Promise<void> {
    await updateApplicationStatus(applicationId, status, note);
  }

  async needsRefresh(): Promise<boolean> {
    return needsRefresh(this.cacheExpiry);
  }

  async getStats(): Promise<{
    total: number;
    bySource: Record<string, number>;
    byExperienceLevel: Record<string, number>;
    remoteCount: number;
    lastUpdated: string | null;
  }> {
    return getJobStats();
  }
}

export const jobAggregator = new JobAggregator();
