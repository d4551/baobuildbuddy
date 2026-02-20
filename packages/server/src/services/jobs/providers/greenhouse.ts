/**
 * Greenhouse ATS provider.
 */

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
    providerSettings: Awaited<ReturnType<typeof loadJobProviderSettings>>,
    query?: string,
  ): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    let page = 1;

    while (page <= providerSettings.greenhouseMaxPages) {
      const url = `${providerSettings.greenhouseApiBaseUrl}/${board}/jobs?page=${page}`;
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": JOB_AGGREGATOR_USER_AGENT,
        },
        signal: AbortSignal.timeout(providerSettings.providerTimeoutMs),
      });

      if (!response.ok) {
        if (response.status === 404) {
          break;
        }
        return jobs;
      }

      const data = (await response.json()) as GreenhouseResponse;

      if (!data.jobs || data.jobs.length === 0) {
        break;
      }

      for (const job of data.jobs) {
        const rawJob = this.mapJob(job, company, board);

        if (query) {
          const searchText = `${rawJob.title} ${rawJob.description}`.toLowerCase();
          if (!searchText.includes(query.toLowerCase())) {
            continue;
          }
        }

        jobs.push(rawJob);
      }

      if (data.jobs.length < 100) {
        break;
      }

      page++;
    }

    return jobs;
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
