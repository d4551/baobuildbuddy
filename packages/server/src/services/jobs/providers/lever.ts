/**
 * Lever ATS Provider
 * Fetches jobs from Lever postings API for gaming studios
 */

import { JOB_AGGREGATOR_USER_AGENT, type JobProvider, type RawJob } from "./provider-interface";

interface LeverJob {
  id: string;
  text: string; // job title
  categories: {
    commitment?: string;
    department?: string;
    team?: string;
    location?: string;
  };
  description: string;
  descriptionPlain: string;
  lists: Array<{
    text: string;
    content: string;
  }>;
  additional?: string;
  additionalPlain?: string;
  hostedUrl: string;
  applyUrl: string;
  createdAt: number;
  workplaceType?: string;
}

interface LeverResponse {
  ok: boolean;
  data?: LeverJob[];
  hasNext?: boolean;
  next?: number;
}

export class LeverProvider implements JobProvider {
  name = "Lever";

  // Gaming studios using Lever
  private defaultCompanies = [
    "rockstargames",
    "ubisoft",
    "squareenix",
    "ea",
    "activision",
    "supercell",
    "roblox",
    "discord",
    "epicgames",
    "doublefine",
    "sucker-punch-productions",
    "arkane-studios",
    "firaxis",
    "amplitude-studios",
    "machinegames",
    "avalanche",
    "ionlands",
    "new-blood-interactive",
    "hopoo",
    "monomi-park",
    "innersloth",
    "giant-squid",
    "annapurna-interactive",
  ];

  private companies: string[];
  private baseUrl = "https://api.lever.co/v0/postings";

  constructor(companies?: string[]) {
    this.companies = companies?.length ? companies : this.defaultCompanies;
  }

  async fetchJobs(query?: string): Promise<RawJob[]> {
    const allJobs: RawJob[] = [];

    await Promise.allSettled(
      this.companies.map(async (company) => {
        try {
          const jobs = await this.fetchCompanyJobs(company, query);
          allJobs.push(...jobs);
        } catch (error) {
          console.error(`Failed to fetch from Lever company ${company}:`, error);
        }
      }),
    );

    return allJobs;
  }

  private async fetchCompanyJobs(company: string, query?: string): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    let offset: number | undefined = undefined;
    const maxPages = 5;

    for (let page = 0; page < maxPages; page++) {
      try {
        let url = `${this.baseUrl}/${company}?mode=json`;
        if (offset !== undefined) {
          url += `&offset=${offset}`;
        }
        if (query) {
          url += `&team=${encodeURIComponent(query)}`;
        }

        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": JOB_AGGREGATOR_USER_AGENT,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            // Company not found, skip silently
            break;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = (await response.json()) as LeverJob[];

        // Lever returns array directly, not wrapped in response object
        if (!Array.isArray(data) || data.length === 0) {
          break;
        }

        for (const job of data) {
          const rawJob = this.mapJob(job, company);

          // Apply query filter if provided
          if (query) {
            const searchText = `${rawJob.title} ${rawJob.description}`.toLowerCase();
            if (!searchText.includes(query.toLowerCase())) {
              continue;
            }
          }

          jobs.push(rawJob);
        }

        // Lever doesn't provide explicit pagination info in basic endpoint
        // If we got fewer than expected, assume no more pages
        if (data.length < 100) {
          break;
        }

        offset = (offset || 0) + data.length;
      } catch (error) {
        console.error(`Error fetching page ${page} from ${company}:`, error);
        break;
      }
    }

    return jobs;
  }

  private mapJob(job: LeverJob, company: string): RawJob {
    const location = job.categories.location || "Remote";
    const department = job.categories.department || "";
    const team = job.categories.team || "";
    const commitment = job.categories.commitment || "Full-time";

    return {
      title: job.text,
      company: this.normalizeCompanyName(company),
      location,
      description: job.descriptionPlain || job.description,
      url: job.hostedUrl,
      postedDate: new Date(job.createdAt).toISOString(),
      source: "Lever",
      companySlug: company,
      department,
      team,
      commitment,
      workplaceType: job.workplaceType,
      leverId: job.id,
      applyUrl: job.applyUrl,
    };
  }

  private normalizeCompanyName(company: string): string {
    const companyMap: Record<string, string> = {
      rockstargames: "Rockstar Games",
      ubisoft: "Ubisoft",
      squareenix: "Square Enix",
      ea: "Electronic Arts",
      activision: "Activision",
      supercell: "Supercell",
      roblox: "Roblox",
      discord: "Discord",
      epicgames: "Epic Games",
      doublefine: "Double Fine Productions",
      "sucker-punch-productions": "Sucker Punch Productions",
      "arkane-studios": "Arkane Studios",
      firaxis: "Firaxis Games",
      "amplitude-studios": "Amplitude Studios",
      machinegames: "MachineGames",
      avalanche: "Avalanche Studios",
      ionlands: "Ionlands",
      "new-blood-interactive": "New Blood Interactive",
      hopoo: "Hopoo Games",
      "monomi-park": "Monomi Park",
      innersloth: "Innersloth",
      "giant-squid": "Giant Squid Studios",
      "annapurna-interactive": "Annapurna Interactive",
    };

    return (
      companyMap[company] ||
      company
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );
  }
}
