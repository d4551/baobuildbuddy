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
    providerSettings: Awaited<ReturnType<typeof loadJobProviderSettings>>,
    query?: string,
  ): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    let offset: number | undefined;

    for (let page = 0; page < providerSettings.leverMaxPages; page++) {
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
        if (response.status === 404) {
          break;
        }
        return jobs;
      }

      const data = (await response.json()) as LeverJob[];
      if (!Array.isArray(data) || data.length === 0) {
        break;
      }

      for (const job of data) {
        const rawJob = this.mapJob(job, companySlug, companyName);

        if (query) {
          const searchText = `${rawJob.title} ${rawJob.description}`.toLowerCase();
          if (!searchText.includes(query.toLowerCase())) {
            continue;
          }
        }

        jobs.push(rawJob);
      }

      if (data.length < 100) {
        break;
      }

      offset = (offset ?? 0) + data.length;
    }

    return jobs;
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
