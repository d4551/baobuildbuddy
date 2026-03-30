import {
  type CompanyBoardConfig,
  generateId,
  type JobProviderSettings,
  safeParseJson,
  settle,
} from "@bao/shared";
import type { JobProvider, RawJob } from "./provider-interface";
import { loadJobProviderSettings } from "./provider-settings";
import {
  type ATSResponse,
  isAtsResponse,
  resolveBoardUrl,
  resolveHashFragment,
  resolveJobs,
  resolveLocation,
  toISODate,
} from "./company-board-support";

const REMOTE_PATTERN = /remote/i;

/**
 * Provider that normalizes a single ATS board payload into `RawJob[]`.
 */
export class CompanyBoardProvider implements JobProvider {
  name: string;
  type = "company-board";
  enabled = true;
  private readonly config: CompanyBoardConfig;

  constructor(config: CompanyBoardConfig) {
    this.config = config;
    this.name = config.name;
    this.enabled = config.enabled;
  }

  async fetchJobs(): Promise<RawJob[]> {
    const providerSettings = await loadJobProviderSettings();
    return this.fetchJobsWithSettings(providerSettings);
  }

  async fetchJobsWithSettings(providerSettings: JobProviderSettings): Promise<RawJob[]> {
    if (!this.config.enabled) {
      return [];
    }

    const url = resolveBoardUrl(this.config.type, this.config.token, providerSettings);
    const responseResult = await settle(
      fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(providerSettings.providerTimeoutMs),
      }),
    );
    if (responseResult.status === "rejected") {
      return [];
    }
    const response = responseResult.value;
    if (!response.ok) {
      return [];
    }

    const rawText = await response.text();
    const parsed = safeParseJson(rawText);
    if (parsed === null) {
      return [];
    }
    if (!isAtsResponse(parsed)) {
      return [];
    }
    return this.parseJobs(parsed, providerSettings);
  }

  private parseJobs(data: ATSResponse, providerSettings: JobProviderSettings): RawJob[] {
    switch (this.config.type) {
      case "greenhouse":
        return this.parseGreenhouseJobs(data, providerSettings);
      case "lever":
        return this.parseLeverJobs(data, providerSettings);
      case "smartrecruiters":
        return this.parseSmartRecruitersJobs(data, providerSettings);
      default:
        return this.parseGenericJobs(data, providerSettings);
    }
  }

  private parseGreenhouseJobs(data: ATSResponse, providerSettings: JobProviderSettings): RawJob[] {
    const jobs = resolveJobs(data, ["jobs"]);

    return jobs.slice(0, providerSettings.companyBoardResultLimit).map((job) => {
      const location =
        resolveLocation(job.location) ||
        job.offices?.[0]?.name ||
        providerSettings.unknownLocationLabel;

      return {
        id: generateId(),
        title: job.title || "",
        company: this.config.name,
        location,
        remote: REMOTE_PATTERN.test(location),
        description: job.content || "",
        url: job.absolute_url || "",
        source: `greenhouse:${this.config.token}`,
        postedDate: toISODate(job.updated_at || job.created_at),
        contentHash: `gh-${this.config.token}-${resolveHashFragment(job)}`,
      };
    });
  }

  private parseLeverJobs(data: ATSResponse, providerSettings: JobProviderSettings): RawJob[] {
    const jobs = resolveJobs(data, ["data", "jobs", "results"]);

    return jobs.slice(0, providerSettings.companyBoardResultLimit).map((job) => {
      const location =
        job.categories?.location ||
        resolveLocation(job.location) ||
        providerSettings.unknownLocationLabel;

      return {
        id: generateId(),
        title: job.text || "",
        company: this.config.name,
        location,
        remote: REMOTE_PATTERN.test(location),
        description: job.descriptionPlain || job.description || "",
        url: job.hostedUrl || job.url || "",
        source: `lever:${this.config.token}`,
        postedDate: toISODate(job.createdAt),
        contentHash: `lv-${this.config.token}-${resolveHashFragment(job)}`,
      };
    });
  }

  private parseSmartRecruitersJobs(
    data: ATSResponse,
    providerSettings: JobProviderSettings,
  ): RawJob[] {
    const jobs = resolveJobs(data, ["content", "postings"]);

    return jobs.slice(0, providerSettings.companyBoardResultLimit).map((job) => {
      const location = resolveLocation(job.location) || providerSettings.unknownLocationLabel;

      return {
        id: generateId(),
        title: job.name || job.title || "",
        company: this.config.name,
        location,
        remote: REMOTE_PATTERN.test(location),
        description: job.description || job.content || "",
        url: job.applyUrl || job.ref || job.url || "",
        source: `smartrecruiters:${this.config.token}`,
        postedDate: toISODate(job.releasedDate),
        contentHash: `sr-${this.config.token}-${resolveHashFragment(job)}`,
      };
    });
  }

  private parseGenericJobs(data: ATSResponse, providerSettings: JobProviderSettings): RawJob[] {
    const jobs = resolveJobs(data, ["jobs", "results", "data", "content", "postings"]);

    return jobs.slice(0, providerSettings.companyBoardResultLimit).map((job) => {
      const location = resolveLocation(job.location) || providerSettings.unknownLocationLabel;
      const remoteProbe =
        typeof job.location === "string" ? job.location : JSON.stringify(job.location ?? "");

      return {
        id: generateId(),
        title: job.title || job.name || job.text || "",
        company: this.config.name,
        location,
        remote: REMOTE_PATTERN.test(remoteProbe),
        description: job.description || job.content || "",
        url: job.url || job.absolute_url || job.hostedUrl || "",
        source: `${this.config.type}:${this.config.token}`,
        postedDate: toISODate(job.created_at || job.createdAt || job.releasedDate),
        contentHash: `${this.config.type.slice(0, 2)}-${this.config.token}-${resolveHashFragment(job)}`,
      };
    });
  }
}

/**
 * Provider that fetches all configured company-board ATS sources.
 */
export class CompanyBoardsProvider implements JobProvider {
  name = "Company Boards";
  type = "company-board";
  enabled = true;

  async fetchJobs(): Promise<RawJob[]> {
    const providerSettings = await loadJobProviderSettings();
    const boards = [...providerSettings.companyBoards]
      .filter((board) => board.enabled)
      .sort((left, right) => right.priority - left.priority);

    if (boards.length === 0) {
      return [];
    }

    const results = await Promise.allSettled(
      boards.map((board) =>
        new CompanyBoardProvider(board).fetchJobsWithSettings(providerSettings),
      ),
    );

    const jobs: RawJob[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        jobs.push(...result.value);
      }
    }

    return jobs;
  }
}
