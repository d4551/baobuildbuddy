import { generateId } from "@navi/shared";
import type { Job, JobFilters, JobProvider } from "./provider-interface";
import { scraperService } from "../../scraper-service";

export class HitmarkerProvider implements JobProvider {
  name = "Hitmarker";
  type = "gaming-board";
  enabled = true;

  async fetchJobs(filters: JobFilters): Promise<Job[]> {
    try {
      const query = filters.query || "game";
      const url = `https://hitmarker.net/api/jobs?search=${encodeURIComponent(query)}&limit=30`;

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) return [];
      const data = await response.json();
      const jobs = data?.jobs || data?.data || (Array.isArray(data) ? data : []);

      return jobs.slice(0, 30).map((job: unknown) => ({
        id: generateId(),
        title: job.title || "",
        company: job.company?.name || job.company || "Unknown",
        location: job.location || "Remote",
        remote: /remote/i.test(job.location || ""),
        description: job.description || "",
        url: job.url || `https://hitmarker.net/jobs/${job.slug || job.id}`,
        source: "hitmarker",
        postedDate: job.created_at || new Date().toISOString(),
        contentHash: `hm-${job.id || Math.random().toString(36).slice(2)}`,
      }));
    } catch {
      return [];
    }
  }
}

export class GameDevNetProvider implements JobProvider {
  name = "GameDev.net";
  type = "gaming-board";
  enabled = true;

  async fetchJobs(_filters: JobFilters): Promise<Job[]> {
    try {
      const scraped = await scraperService.scrapeGameDevNetJobsRaw();
      return scraped.map((j) => ({
        id: generateId(),
        title: j.title,
        company: j.company,
        location: j.location,
        remote: !!j.remote,
        description: j.description || "",
        url: j.url || "https://www.gamedev.net/jobs/",
        source: j.source || "gamedev-net",
        postedDate: j.postedDate || new Date().toISOString(),
        contentHash: j.contentHash,
      }));
    } catch {
      return [];
    }
  }
}

export const hitmarkerProvider = new HitmarkerProvider();
export const gameDevNetProvider = new GameDevNetProvider();
