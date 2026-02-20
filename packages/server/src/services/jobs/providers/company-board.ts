import { generateId } from "@bao/shared";
import type { CompanyBoardATSType, CompanyBoardConfig, JobProviderSettings } from "@bao/shared";
import type { JobFilters, JobProvider, RawJob } from "./provider-interface";
import { loadJobProviderSettings } from "./provider-settings";

interface ATSJob extends Record<string, unknown> {
  id?: string;
  title?: string;
  text?: string;
  name?: string;
  content?: string;
  description?: string;
  descriptionPlain?: string;
  location?: { name?: string; city?: string } | string;
  offices?: Array<{ name?: string }>;
  categories?: { location?: string };
  absolute_url?: string;
  hostedUrl?: string;
  applyUrl?: string;
  url?: string;
  ref?: string;
  updated_at?: string;
  created_at?: string;
  createdAt?: number | string;
  releasedDate?: string;
}

type ATSResponseFields = {
  jobs?: ATSJob[];
  content?: ATSJob[];
  postings?: ATSJob[];
  results?: ATSJob[];
  data?: ATSJob[];
};

type ATSResponse = ATSJob[] | (ATSResponseFields & Record<string, unknown>);

const REMOTE_PATTERN = /remote/i;

const resolveLocation = (location: ATSJob["location"]): string => {
  if (typeof location === "string") {
    return location;
  }
  return location?.name ?? location?.city ?? "";
};

const toISODate = (value?: string | number): string => {
  if (typeof value === "number") {
    return new Date(value).toISOString();
  }
  if (typeof value === "string" && value.length > 0) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }
  return new Date().toISOString();
};

const sanitizeHashFragment = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");

const resolveHashFragment = (job: ATSJob): string => {
  const candidate =
    job.id ??
    job.url ??
    job.absolute_url ??
    job.hostedUrl ??
    job.applyUrl ??
    job.ref ??
    job.title ??
    job.name ??
    job.text ??
    generateId();

  return sanitizeHashFragment(String(candidate)) || generateId();
};

const resolveJobs = (data: ATSResponse, keys: ReadonlyArray<keyof ATSResponseFields>): ATSJob[] => {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    const candidate = data[key];
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const resolveBoardUrl = (
  providerType: CompanyBoardATSType,
  token: string,
  settings: JobProviderSettings,
): string => {
  const template = settings.companyBoardApiTemplates[providerType];
  return template.replaceAll("{token}", token);
};

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

  async fetchJobs(_filters?: JobFilters): Promise<RawJob[]> {
    const providerSettings = await loadJobProviderSettings();
    return this.fetchJobsWithSettings(providerSettings);
  }

  async fetchJobsWithSettings(providerSettings: JobProviderSettings): Promise<RawJob[]> {
    if (!this.config.enabled) {
      return [];
    }

    const url = resolveBoardUrl(this.config.type, this.config.token, providerSettings);
    return fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(providerSettings.providerTimeoutMs),
    })
      .then(async (response) => {
        if (!response.ok) {
          return [];
        }

        const data = (await response.json()) as ATSResponse;
        return this.parseJobs(data, providerSettings);
      })
      .catch(() => []);
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

  async fetchJobs(_filters?: JobFilters): Promise<RawJob[]> {
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
