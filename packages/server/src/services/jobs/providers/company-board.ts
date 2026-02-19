import { generateId } from "@navi/shared";
import type { Job, JobFilters, JobProvider } from "./provider-interface";

type ATSType =
  | "greenhouse"
  | "lever"
  | "recruitee"
  | "workable"
  | "ashby"
  | "smartrecruiters"
  | "teamtailor"
  | "workday";

interface CompanyBoardConfig {
  name: string;
  token: string;
  type: ATSType;
  priority?: number;
}

const BASE_URLS: Record<ATSType, (token: string) => string> = {
  greenhouse: (token) => `https://boards-api.greenhouse.io/v1/boards/${token}/jobs`,
  lever: (token) => `https://api.lever.co/v0/postings/${token}?mode=json`,
  recruitee: (token) => `https://api.recruitee.com/c/${token}/offers`,
  workable: (token) => `https://apply.workable.com/api/v1/widget/accounts/${token}`,
  ashby: (token) => `https://api.ashbyhq.com/posting-api/job-board/${token}`,
  smartrecruiters: (token) => `https://api.smartrecruiters.com/v1/companies/${token}/postings`,
  teamtailor: (token) => "https://api.teamtailor.com/v1/jobs",
  workday: (token) => `https://${token}.wd1.myworkdayjobs.com/wday/cxs/${token}/External/jobs`,
};

export class CompanyBoardProvider implements JobProvider {
  name: string;
  type: string;
  enabled = true;
  private config: CompanyBoardConfig;

  constructor(config: CompanyBoardConfig) {
    this.config = config;
    this.name = config.name;
    this.type = config.type;
  }

  async fetchJobs(filters: JobFilters): Promise<Job[]> {
    const url = BASE_URLS[this.config.type](this.config.token);

    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) return [];

      const data = await response.json();
      return this.parseJobs(data);
    } catch {
      return [];
    }
  }

  private parseJobs(data: unknown): Job[] {
    switch (this.config.type) {
      case "greenhouse":
        return this.parseGreenhouseJobs(data);
      case "lever":
        return this.parseLeverJobs(data);
      case "smartrecruiters":
        return this.parseSmartRecruitersJobs(data);
      default:
        return this.parseGenericJobs(data);
    }
  }

  private parseGreenhouseJobs(data: unknown): Job[] {
    const jobs = data?.jobs || data || [];
    if (!Array.isArray(jobs)) return [];

    return jobs.slice(0, 50).map((job: unknown) => ({
      id: generateId(),
      title: job.title || "",
      company: this.config.name,
      location: job.location?.name || job.offices?.[0]?.name || "Unknown",
      remote: /remote/i.test(job.location?.name || ""),
      description: job.content || "",
      url: job.absolute_url || "",
      source: `greenhouse:${this.config.token}`,
      postedDate: job.updated_at || job.created_at || new Date().toISOString(),
      contentHash: `gh-${this.config.token}-${job.id}`,
    }));
  }

  private parseLeverJobs(data: unknown): Job[] {
    const jobs = Array.isArray(data) ? data : [];

    return jobs.slice(0, 50).map((job: unknown) => ({
      id: generateId(),
      title: job.text || "",
      company: this.config.name,
      location: job.categories?.location || "Unknown",
      remote: /remote/i.test(job.categories?.location || ""),
      description: job.descriptionPlain || job.description || "",
      url: job.hostedUrl || "",
      source: `lever:${this.config.token}`,
      postedDate: job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
      contentHash: `lv-${this.config.token}-${job.id}`,
    }));
  }

  private parseSmartRecruitersJobs(data: unknown): Job[] {
    const jobs = data?.content || data?.postings || [];
    if (!Array.isArray(jobs)) return [];

    return jobs.slice(0, 50).map((job: unknown) => ({
      id: generateId(),
      title: job.name || job.title || "",
      company: this.config.name,
      location: job.location?.city || "Unknown",
      remote: /remote/i.test(job.location?.city || ""),
      description: "",
      url: job.applyUrl || job.ref || "",
      source: `smartrecruiters:${this.config.token}`,
      postedDate: job.releasedDate || new Date().toISOString(),
      contentHash: `sr-${this.config.token}-${job.id}`,
    }));
  }

  private parseGenericJobs(data: unknown): Job[] {
    const jobs = data?.jobs || data?.results || data?.data || (Array.isArray(data) ? data : []);
    if (!Array.isArray(jobs)) return [];

    return jobs.slice(0, 50).map((job: unknown) => ({
      id: generateId(),
      title: job.title || job.name || job.text || "",
      company: this.config.name,
      location: job.location?.name || job.location?.city || job.location || "Unknown",
      remote: /remote/i.test(JSON.stringify(job.location || "")),
      description: job.description || job.content || "",
      url: job.url || job.absolute_url || job.hostedUrl || "",
      source: `${this.config.type}:${this.config.token}`,
      postedDate: job.created_at || job.createdAt || new Date().toISOString(),
      contentHash: `${this.config.type.slice(0, 2)}-${this.config.token}-${job.id || Math.random().toString(36).slice(2)}`,
    }));
  }
}
