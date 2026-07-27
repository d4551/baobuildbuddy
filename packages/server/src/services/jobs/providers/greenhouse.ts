/**
 * Greenhouse ATS provider.
 */

import { SCHEMA_MAX_ITEMS_XXLARGE } from "@bao/shared/constants/schema-limits";
import { type JsonObject, safeParseJson } from "@bao/shared/utils/json";
import { JOB_AGGREGATOR_USER_AGENT, type JobProvider, type RawJob } from "./provider-interface";
import { loadJobProviderSettings } from "./provider-settings";

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  location?: {
    name?: string;
  };
  updated_at: string;
  metadata?: Array<{
    name: string;
    value: string | string[];
  }>;
  content?: string;
  departments?: Array<{
    name: string;
  }>;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

const isRecord = <T>(value: T): value is T & JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isGreenhouseJob = <T>(value: T): value is T & GreenhouseJob => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "number" &&
    typeof value.title === "string" &&
    typeof value.absolute_url === "string" &&
    typeof value.updated_at === "string"
  );
};

const isGreenhouseResponse = <T>(value: T): value is T & GreenhouseResponse =>
  isRecord(value) && Array.isArray(value.jobs) && value.jobs.every(isGreenhouseJob);

type GreenhouseFetchStatus =
  | {
      ok: true;
      jobs: GreenhouseJob[];
    }
  | {
      ok: false;
    };

type JobProviderSettings = Awaited<ReturnType<typeof loadJobProviderSettings>>;

type GreenhouseBoardContext = {
  board: string;
  company: string;
  providerSettings: JobProviderSettings;
  query?: string;
};

type GreenhouseBoardPageState = {
  page: number;
  accumulatedJobs: RawJob[];
};

/**
 * Provider for Greenhouse-hosted boards configured in settings.
 */
export class GreenhouseProvider implements JobProvider {
  name = "Greenhouse";

  async fetchJobs(filters?: { query?: string }): Promise<RawJob[]> {
    const query = filters?.query;
    const providerSettings = await loadJobProviderSettings();
    const activeBoards = providerSettings.greenhouseBoards.filter((board) => board.enabled);
    const allJobs: RawJob[] = [];

    await Promise.allSettled(
      activeBoards.map(async (board) => {
        const jobs = await this.fetchBoardJobs(board.board, board.company, providerSettings, query);
        allJobs.push(...jobs);
      }),
    );

    return allJobs;
  }

  private async fetchBoardJobs(
    board: string,
    company: string,
    providerSettings: JobProviderSettings,
    query?: string,
  ): Promise<RawJob[]> {
    return this.fetchBoardJobsPage(
      { board, company, providerSettings, query },
      { page: 1, accumulatedJobs: [] },
    );
  }

  private async fetchBoardJobsPage(
    context: GreenhouseBoardContext,
    state: GreenhouseBoardPageState,
  ): Promise<RawJob[]> {
    const { board, company, providerSettings, query } = context;
    const { page, accumulatedJobs } = state;

    if (page > providerSettings.greenhouseMaxPages) {
      return accumulatedJobs;
    }

    const fetchStatus = await this.fetchGreenhousePage(board, page, providerSettings);
    if (!fetchStatus.ok) {
      return accumulatedJobs;
    }
    if (fetchStatus.jobs.length === 0) {
      return accumulatedJobs;
    }

    const pageJobs = this.filterMappedJobs(fetchStatus.jobs, company, board, query);
    const nextJobs = [...accumulatedJobs, ...pageJobs];
    if (fetchStatus.jobs.length < SCHEMA_MAX_ITEMS_XXLARGE) {
      return nextJobs;
    }
    return this.fetchBoardJobsPage(context, { page: page + 1, accumulatedJobs: nextJobs });
  }

  private async fetchGreenhousePage(
    board: string,
    page: number,
    providerSettings: JobProviderSettings,
  ): Promise<GreenhouseFetchStatus> {
    const url = `${providerSettings.greenhouseApiBaseUrl}/${board}/jobs?content=true&page=${page}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": JOB_AGGREGATOR_USER_AGENT,
      },
      signal: AbortSignal.timeout(providerSettings.providerTimeoutMs),
    });
    if (!response.ok) {
      return { ok: false };
    }
    const rawText = await response.text();
    const parsed = safeParseJson(rawText);
    if (parsed === null || !isGreenhouseResponse(parsed)) {
      return { ok: false };
    }
    return { ok: true, jobs: parsed.jobs };
  }

  private filterMappedJobs(
    jobs: GreenhouseJob[],
    company: string,
    board: string,
    query?: string,
  ): RawJob[] {
    const queryLower = query?.toLowerCase();
    return jobs
      .map((job) => this.mapJob(job, company, board))
      .filter((rawJob) => {
        if (!queryLower) {
          return true;
        }
        const searchText = `${rawJob.title} ${rawJob.description}`.toLowerCase();
        return searchText.includes(queryLower);
      });
  }

  private mapJob(job: GreenhouseJob, company: string, board: string): RawJob {
    const departments = job.departments?.map((department) => department.name).join(", ") || "";

    return {
      title: job.title,
      company,
      location: job.location?.name || "",
      description: job.content || "",
      url: job.absolute_url,
      postedDate: job.updated_at,
      source: "Greenhouse",
      board,
      departments,
      greenhouseId: String(job.id),
      metadata: job.metadata,
    };
  }
}
