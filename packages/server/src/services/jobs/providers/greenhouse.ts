/**
 * Greenhouse ATS Provider
 * Fetches jobs from Greenhouse board APIs for major gaming studios
 */

import { JOB_AGGREGATOR_USER_AGENT, type JobProvider, type RawJob } from "./provider-interface";

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  location: {
    name: string;
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

export class GreenhouseProvider implements JobProvider {
  name = "Greenhouse";

  // Major gaming studios using Greenhouse
  private defaultBoards = [
    "riotgames",
    "epicgames",
    "unity",
    "nvidia",
    "valvesoftware",
    "bungie",
    "blizzard",
    "respawn",
    "obsidianent",
    "insomniacgames",
    "gearboxsoftware",
    "playground-games",
    "treyarch",
    "sledgehammergames",
    "infinityward",
    "mojangstudios",
    "doublefine",
    "nightdive",
    "devolver",
    "coffee-stain",
    "embark-studios",
  ];

  private boards: string[];
  private baseUrl = "https://boards-api.greenhouse.io/v1/boards";

  constructor(boards?: string[]) {
    this.boards = boards?.length ? boards : this.defaultBoards;
  }

  async fetchJobs(query?: string): Promise<RawJob[]> {
    const allJobs: RawJob[] = [];

    await Promise.allSettled(
      this.boards.map(async (board) => {
        try {
          const jobs = await this.fetchBoardJobs(board, query);
          allJobs.push(...jobs);
        } catch (error) {
          console.error(`Failed to fetch from Greenhouse board ${board}:`, error);
        }
      }),
    );

    return allJobs;
  }

  private async fetchBoardJobs(board: string, query?: string): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    let page = 1;
    const maxPages = 5; // Limit pagination to avoid rate limits

    while (page <= maxPages) {
      try {
        const url = `${this.baseUrl}/${board}/jobs?page=${page}`;
        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": JOB_AGGREGATOR_USER_AGENT,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            // Board not found, skip silently
            break;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = (await response.json()) as GreenhouseResponse;

        if (!data.jobs || data.jobs.length === 0) {
          break;
        }

        for (const job of data.jobs) {
          const rawJob = this.mapJob(job, board);

          // Apply query filter if provided
          if (query) {
            const searchText = `${rawJob.title} ${rawJob.description}`.toLowerCase();
            if (!searchText.includes(query.toLowerCase())) {
              continue;
            }
          }

          jobs.push(rawJob);
        }

        // Check if there are more pages
        if (data.jobs.length < 100) {
          // Greenhouse typically returns 100 per page
          break;
        }

        page++;
      } catch (error) {
        console.error(`Error fetching page ${page} from ${board}:`, error);
        break;
      }
    }

    return jobs;
  }

  private mapJob(job: GreenhouseJob, board: string): RawJob {
    const departments = job.departments?.map((d) => d.name).join(", ") || "";

    return {
      title: job.title,
      company: this.normalizeCompanyName(board),
      location: job.location.name,
      description: job.content || "",
      url: job.absolute_url,
      postedDate: job.updated_at,
      source: "Greenhouse",
      board,
      departments,
      greenhouseId: job.id.toString(),
      metadata: job.metadata,
    };
  }

  private normalizeCompanyName(board: string): string {
    const companyMap: Record<string, string> = {
      riotgames: "Riot Games",
      epicgames: "Epic Games",
      unity: "Unity Technologies",
      nvidia: "NVIDIA",
      valvesoftware: "Valve",
      bungie: "Bungie",
      blizzard: "Blizzard Entertainment",
      respawn: "Respawn Entertainment",
      obsidianent: "Obsidian Entertainment",
      insomniacgames: "Insomniac Games",
      gearboxsoftware: "Gearbox Software",
      "playground-games": "Playground Games",
      treyarch: "Treyarch",
      sledgehammergames: "Sledgehammer Games",
      infinityward: "Infinity Ward",
      mojangstudios: "Mojang Studios",
      doublefine: "Double Fine Productions",
      nightdive: "Nightdive Studios",
      devolver: "Devolver Digital",
      "coffee-stain": "Coffee Stain Studios",
      "embark-studios": "Embark Studios",
    };

    return (
      companyMap[board] ||
      board
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );
  }
}
