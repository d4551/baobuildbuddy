/**
 * Lever ATS provider.
 */

import { JOB_AGGREGATOR_USER_AGENT, type JobProvider, type RawJob } from "./provider-interface";
import { loadJobProviderSettings } from "./provider-settings";

interface LeverJob {
  id: string;
  text: string;
  categories: {
    commitment?: string;
    department?: string;
    team?: string;
    location?: string;
  };
  description: string;
  descriptionPlain: string;
  hostedUrl: string;
  applyUrl: string;
  createdAt: number;
  workplaceType?: string;
}

type JobProviderSettings = Awaited<ReturnType<typeof loadJobProviderSettings>>;

type LeverCompanyContext = {
  companySlug: string;
  companyName: string;
  providerSettings: JobProviderSettings;
  query?: string;
};

type LeverCompanyPageState = {
  page: number;
  offset: number | undefined;
  accumulatedJobs: RawJob[];
};

/**
 * Provider for Lever-hosted companies configured in settings.
 */
export class LeverProvider implements JobProvider {
  name = "Lever";

  async fetchJobs(filters?: { query?: string }): Promise<RawJob[]> {
    const query = filters?.query;
    const providerSettings = await loadJobProviderSettings();
    const activeCompanies = providerSettings.leverCompanies.filter((company) => company.enabled);
    const allJobs: RawJob[] = [];

    await Promise.allSettled(
      activeCompanies.map(async (company) => {
        const jobs = await this.fetchCompanyJobs(
          company.slug,
          company.company,
          providerSettings,
          query,
        );
        allJobs.push(...jobs);
      }),
    );

    return allJobs;
  }

  private async fetchCompanyJobs(
    companySlug: string,
    companyName: string,
    providerSettings: JobProviderSettings,
    query?: string,
  ): Promise<RawJob[]> {
    return this.fetchCompanyJobsPage(
      { companySlug, companyName, providerSettings, query },
      {
        page: 0,
        offset: undefined,
        accumulatedJobs: [],
      },
    );
  }

  private async fetchCompanyJobsPage(
    context: LeverCompanyContext,
    state: LeverCompanyPageState,
  ): Promise<RawJob[]> {
    const { companySlug, companyName, providerSettings, query } = context;
    const { page, offset, accumulatedJobs } = state;

    if (page >= providerSettings.leverMaxPages) {
      return accumulatedJobs;
    }

    const data = await this.fetchLeverPage(companySlug, providerSettings, query, offset);
    if (!data || data.length === 0) {
      return accumulatedJobs;
    }

    const queryLower = query?.toLowerCase();
    const pageJobs = data
      .map((job) => this.mapJob(job, companySlug, companyName))
      .filter((rawJob) => {
        if (!queryLower) {
          return true;
        }
        const searchText = `${rawJob.title} ${rawJob.description}`.toLowerCase();
        return searchText.includes(queryLower);
      });
    const nextJobs = [...accumulatedJobs, ...pageJobs];
    if (data.length < 100) {
      return nextJobs;
    }

    const nextOffset = (offset ?? 0) + data.length;
    return this.fetchCompanyJobsPage(context, {
      page: page + 1,
      offset: nextOffset,
      accumulatedJobs: nextJobs,
    });
  }

  private async fetchLeverPage(
    companySlug: string,
    providerSettings: JobProviderSettings,
    query: string | undefined,
    offset: number | undefined,
  ): Promise<LeverJob[] | null> {
    let requestUrl = `${providerSettings.leverApiBaseUrl}/${companySlug}?mode=json`;
    if (offset !== undefined) {
      requestUrl += `&offset=${offset}`;
    }
    if (query) {
      requestUrl += `&team=${encodeURIComponent(query)}`;
    }

    const response = await fetch(requestUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": JOB_AGGREGATOR_USER_AGENT,
      },
      signal: AbortSignal.timeout(providerSettings.providerTimeoutMs),
    });
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as LeverJob[];
    return Array.isArray(data) ? data : [];
  }

  private mapJob(job: LeverJob, companySlug: string, companyName: string): RawJob {
    const location = job.categories.location || "";

    return {
      title: job.text,
      company: companyName,
      location,
      description: job.descriptionPlain || job.description,
      url: job.hostedUrl,
      postedDate: new Date(job.createdAt).toISOString(),
      source: "Lever",
      companySlug,
      department: job.categories.department || "",
      team: job.categories.team || "",
      commitment: job.categories.commitment || "",
      workplaceType: job.workplaceType,
      leverId: job.id,
      applyUrl: job.applyUrl,
    };
  }
}
