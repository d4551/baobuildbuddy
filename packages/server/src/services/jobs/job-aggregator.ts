/**
 * Job Aggregator Service
 * Orchestrates job fetching, caching, and searching across multiple providers
 */

import type {
  GameGenre,
  Job,
  JobExperienceLevel,
  JobFilters,
  JobSearchResult,
  JobType,
  Platform,
  StudioType,
} from "@bao/shared";
import { and, desc, eq, gte, inArray, like, lte, sql } from "drizzle-orm";
import { db } from "../../db/client";
import { applications, jobs, savedJobs } from "../../db/schema/jobs";
import { deduplicateJobs, generateContentHash } from "./deduplication";
import {
  CompanyBoardsProvider,
  GreenhouseProvider,
  type JobProvider,
  LeverProvider,
  type RawJob,
  gameDevNetProvider,
  gamesJobsDirectProvider,
  grackleProvider,
  hitmarkerProvider,
  pocketGamerProvider,
  remoteGameJobsProvider,
  workWithIndiesProvider,
} from "./providers";

export class JobAggregator {
  private providers: JobProvider[];
  private cacheExpiry: number; // milliseconds
  private readonly studioTypes: ReadonlySet<StudioType> = new Set([
    "AAA",
    "Indie",
    "Mobile",
    "VR/AR",
    "Platform",
    "Esports",
    "Unknown",
  ]);
  private readonly genres: ReadonlySet<GameGenre> = new Set([
    "Action",
    "RPG",
    "Strategy",
    "Puzzle",
    "Simulation",
    "Sports",
    "Racing",
    "Shooter",
    "Platformer",
    "Horror",
    "MMORPG",
    "MOBA",
    "Battle Royale",
    "Roguelike",
    "Sandbox",
    "Adventure",
    "Fighting",
    "Survival",
    "Card Game",
    "Casual",
    "Indie",
  ]);
  private readonly platformsSet: ReadonlySet<Platform> = new Set([
    "PC",
    "Console",
    "Mobile",
    "VR",
    "AR",
    "Web",
    "Switch",
    "PlayStation",
    "Xbox",
    "Steam",
  ]);

  constructor() {
    this.providers = [
      // API-native providers
      new GreenhouseProvider(),
      new LeverProvider(),
      hitmarkerProvider,

      // RPA-backed scrapers
      gameDevNetProvider,
      grackleProvider,
      workWithIndiesProvider,
      remoteGameJobsProvider,
      gamesJobsDirectProvider,
      pocketGamerProvider,

      // Multi-ATS company boards (SmartRecruiters, Workday, Ashby, etc.)
      new CompanyBoardsProvider(),
    ];

    // Cache jobs for 6 hours by default
    this.cacheExpiry = 6 * 60 * 60 * 1000;
  }

  /**
   * Refresh jobs from all providers and update cache
   */
  async refreshJobs(): Promise<{ total: number; new: number; updated: number }> {
    console.log("Starting job refresh from all providers...");

    // Fetch from all providers in parallel
    const results = await Promise.allSettled(
      this.providers.map((provider) => provider.fetchJobs()),
    );

    // Collect all successful results
    const allRawJobs: RawJob[] = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled") {
        allRawJobs.push(...result.value);
        console.log(`${this.providers[i].name}: fetched ${result.value.length} jobs`);
      } else {
        console.error(`${this.providers[i].name}: failed -`, result.reason);
      }
    }

    // Deduplicate across providers
    const uniqueJobs = deduplicateJobs(allRawJobs);
    console.log(`Deduplicated: ${allRawJobs.length} -> ${uniqueJobs.length} jobs`);

    // Convert to Job format and save to database
    let newCount = 0;
    let updatedCount = 0;

    for (const rawJob of uniqueJobs) {
      try {
        const job = this.rawJobToJob(rawJob);
        if (!job.contentHash) {
          continue;
        }

        const existing = await db
          .select()
          .from(jobs)
          .where(eq(jobs.contentHash, job.contentHash))
          .limit(1);

        if (existing.length === 0) {
          // Insert new job
          await db.insert(jobs).values(job);
          newCount++;
        } else {
          // Update existing job
          await db
            .update(jobs)
            .set({
              ...job,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(jobs.id, existing[0].id));
          updatedCount++;
        }
      } catch (error) {
        console.error("Failed to save job:", error);
      }
    }

    console.log(`Refresh complete: ${newCount} new, ${updatedCount} updated`);

    return {
      total: uniqueJobs.length,
      new: newCount,
      updated: updatedCount,
    };
  }

  /**
   * Search jobs with filters and pagination
   */
  async searchJobs(filters: JobFilters = {}): Promise<JobSearchResult> {
    const {
      query,
      company,
      location,
      remote,
      hybrid,
      salaryMin,
      salaryMax,
      experienceLevel,
      jobType,
      technologies,
      studioTypes,
      gameGenres,
      platforms,
      postedWithin,
      featured,
      minMatchScore,
      limit = 20,
      page = 1,
    } = filters;

    // Build query conditions
    const conditions = [];

    // Text search across title, company, description
    if (query) {
      const searchPattern = `%${query}%`;
      conditions.push(
        sql`(
          ${jobs.title} LIKE ${searchPattern} OR
          ${jobs.company} LIKE ${searchPattern} OR
          ${jobs.description} LIKE ${searchPattern}
        )`,
      );
    }

    // Company filter
    if (company) {
      conditions.push(like(jobs.company, `%${company}%`));
    }

    // Location filter
    if (location) {
      conditions.push(like(jobs.location, `%${location}%`));
    }

    // Remote/Hybrid filters
    if (remote !== undefined) {
      conditions.push(eq(jobs.remote, remote));
    }

    if (hybrid !== undefined) {
      conditions.push(eq(jobs.hybrid, hybrid));
    }

    // Experience level
    if (experienceLevel) {
      conditions.push(eq(jobs.experienceLevel, experienceLevel));
    }

    // Job type
    if (jobType) {
      conditions.push(eq(jobs.type, jobType));
    }

    // Studio types
    if (studioTypes && studioTypes.length > 0) {
      conditions.push(inArray(jobs.studioType, studioTypes));
    }

    // Posted date filter
    if (postedWithin) {
      const cutoffDate = new Date(Date.now() - postedWithin * 24 * 60 * 60 * 1000);
      conditions.push(gte(jobs.postedDate, cutoffDate.toISOString()));
    }

    // Build the query
    const query_builder =
      conditions.length > 0
        ? db
            .select()
            .from(jobs)
            .where(and(...conditions))
        : db.select().from(jobs);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    // Apply ordering and pagination
    const offset = (page - 1) * limit;
    const results = await query_builder.orderBy(desc(jobs.postedDate)).limit(limit).offset(offset);

    // Convert results to Job format
    const jobResults: Job[] = results.map((row) => this.dbRowToJob(row));

    // Apply additional filters that require post-processing
    let filteredJobs = jobResults;

    // Technology filter
    if (technologies && technologies.length > 0) {
      filteredJobs = filteredJobs.filter((job) => {
        if (!job.technologies) return false;
        const jobTechs = job.technologies.map((t) => t.toLowerCase());
        return technologies.some((t) => jobTechs.includes(t.toLowerCase()));
      });
    }

    // Genre filter
    if (gameGenres && gameGenres.length > 0) {
      filteredJobs = filteredJobs.filter((job) => {
        if (!job.gameGenres) return false;
        return gameGenres.some((g) => job.gameGenres?.includes(g));
      });
    }

    // Platform filter
    if (platforms && platforms.length > 0) {
      filteredJobs = filteredJobs.filter((job) => {
        if (!job.platforms) return false;
        return platforms.some((p) => job.platforms?.includes(p));
      });
    }

    // Salary filter (requires parsing)
    if (salaryMin || salaryMax) {
      filteredJobs = filteredJobs.filter((job) => {
        if (!job.salary) return false;

        let jobMin: number | undefined;
        let jobMax: number | undefined;

        if (typeof job.salary === "string") {
          const numbers = job.salary.match(/\d+/g);
          if (numbers) {
            jobMin = Number.parseInt(numbers[0]) * 1000;
            jobMax = numbers.length > 1 ? Number.parseInt(numbers[1]) * 1000 : jobMin;
          }
        } else {
          jobMin = job.salary.min;
          jobMax = job.salary.max;
        }

        if (salaryMin && jobMax && jobMax < salaryMin) return false;
        if (salaryMax && jobMin && jobMin > salaryMax) return false;

        return true;
      });
    }

    // Match score filter
    if (minMatchScore !== undefined) {
      filteredJobs = filteredJobs.filter(
        (job) => job.matchScore && job.matchScore >= minMatchScore,
      );
    }

    // Featured filter
    if (featured !== undefined) {
      filteredJobs = filteredJobs.filter((job) => job.featured === featured);
    }

    return {
      jobs: filteredJobs,
      total: filteredJobs.length,
      page,
      limit,
      filters,
    };
  }

  /**
   * Get a single job by ID
   */
  async getJobById(id: string): Promise<Job | null> {
    const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.dbRowToJob(result[0]);
  }

  /**
   * Save a job for later
   */
  async saveJob(jobId: string): Promise<void> {
    const saveId = crypto.randomUUID();
    await db.insert(savedJobs).values({
      id: saveId,
      jobId,
      savedAt: new Date().toISOString(),
    });
  }

  /**
   * Get all saved jobs
   */
  async getSavedJobs(): Promise<Job[]> {
    const result = await db
      .select({
        job: jobs,
      })
      .from(savedJobs)
      .innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
      .orderBy(desc(savedJobs.savedAt));

    return result.map((r) => this.dbRowToJob(r.job));
  }

  /**
   * Remove a saved job
   */
  async unsaveJob(jobId: string): Promise<void> {
    await db.delete(savedJobs).where(eq(savedJobs.jobId, jobId));
  }

  /**
   * Apply to a job
   */
  async applyToJob(jobId: string, notes?: string): Promise<string> {
    const applicationId = crypto.randomUUID();

    await db.insert(applications).values({
      id: applicationId,
      jobId,
      status: "applied",
      appliedDate: new Date().toISOString(),
      notes: notes || "",
      timeline: [
        {
          id: crypto.randomUUID(),
          type: "applied",
          date: new Date().toISOString(),
          description: "Application submitted",
        },
      ],
    });

    return applicationId;
  }

  /**
   * Get all applications
   */
  async getApplications(): Promise<Array<typeof applications.$inferSelect & { job: Job }>> {
    const result = await db
      .select({
        application: applications,
        job: jobs,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .orderBy(desc(applications.appliedDate));

    return result.map((r) => ({
      ...r.application,
      job: this.dbRowToJob(r.job),
    }));
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    applicationId: string,
    status: string,
    note?: string,
  ): Promise<void> {
    const app = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (app.length === 0) {
      throw new Error("Application not found");
    }

    const timeline = app[0].timeline || [];
    const normalizedStatus = status.trim() || "applied";
    timeline.push({
      id: crypto.randomUUID(),
      type: normalizedStatus,
      date: new Date().toISOString(),
      description: note || `Status changed to ${normalizedStatus}`,
    });

    await db
      .update(applications)
      .set({
        status,
        timeline,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(applications.id, applicationId));
  }

  /**
   * Check if cache needs refresh
   */
  async needsRefresh(): Promise<boolean> {
    const result = await db
      .select({ updatedAt: jobs.updatedAt })
      .from(jobs)
      .orderBy(desc(jobs.updatedAt))
      .limit(1);

    if (result.length === 0) {
      return true; // No jobs in cache
    }

    const lastUpdate = new Date(result[0].updatedAt).getTime();
    const now = Date.now();

    return now - lastUpdate > this.cacheExpiry;
  }

  /**
   * Get statistics about cached jobs
   */
  async getStats(): Promise<{
    total: number;
    bySource: Record<string, number>;
    byExperienceLevel: Record<string, number>;
    remoteCount: number;
    lastUpdated: string | null;
  }> {
    const allJobs = await db.select().from(jobs);

    const bySource: Record<string, number> = {};
    const byExperienceLevel: Record<string, number> = {};
    let remoteCount = 0;

    for (const job of allJobs) {
      // Count by source
      const source = job.source || "Unknown";
      bySource[source] = (bySource[source] || 0) + 1;

      // Count by experience level
      if (job.experienceLevel) {
        byExperienceLevel[job.experienceLevel] = (byExperienceLevel[job.experienceLevel] || 0) + 1;
      }

      // Count remote jobs
      if (job.remote) {
        remoteCount++;
      }
    }

    const lastUpdated =
      allJobs.length > 0
        ? allJobs.reduce(
            (latest, job) => (new Date(job.updatedAt) > new Date(latest) ? job.updatedAt : latest),
            allJobs[0].updatedAt,
          )
        : null;

    return {
      total: allJobs.length,
      bySource,
      byExperienceLevel,
      remoteCount,
      lastUpdated,
    };
  }

  /**
   * Convert RawJob to Job format
   */
  private rawJobToJob(raw: RawJob): typeof jobs.$inferInsert {
    const contentHash = generateContentHash(raw);

    return {
      id: crypto.randomUUID(),
      title: raw.title,
      company: raw.company,
      location: raw.location,
      remote: this.detectRemote(raw.location),
      hybrid: this.detectHybrid(raw.location),
      description: raw.description || "",
      requirements: this.extractRequirements(raw.description),
      technologies: this.extractTechnologies(raw.description),
      experienceLevel: this.detectExperienceLevel(raw.title),
      type: this.detectJobType(raw.title),
      postedDate: raw.postedDate || new Date().toISOString(),
      url: raw.url,
      source: raw.source || "unknown",
      contentHash,
      studioType: this.detectStudioType(raw.company),
      gameGenres: this.extractGenres(raw.description),
      platforms: this.extractPlatforms(raw.description),
      tags: this.generateTags(raw),
      applicationUrl: (raw.applyUrl as string) || raw.url,
    };
  }

  /**
   * Convert database row to Job format
   */
  private dbRowToJob(row: typeof jobs.$inferSelect): Job {
    return {
      id: row.id,
      title: row.title,
      company: row.company,
      location: row.location,
      remote: row.remote ?? false,
      hybrid: row.hybrid ?? undefined,
      salary: (row.salary as Job["salary"]) ?? undefined,
      description: row.description ?? "",
      requirements: row.requirements ?? undefined,
      technologies: row.technologies ?? undefined,
      experienceLevel: (row.experienceLevel as JobExperienceLevel) ?? undefined,
      type: (row.type || "full-time") as JobType,
      postedDate: row.postedDate || new Date().toISOString(),
      url: row.url,
      source: row.source,
      contentHash: row.contentHash ?? undefined,
      studioType: this.normalizeStudioType(row.studioType),
      gameGenres: this.normalizeGameGenres(row.gameGenres),
      platforms: this.normalizePlatforms(row.platforms),
      tags: row.tags ?? undefined,
      companyLogo: row.companyLogo ?? undefined,
      applicationUrl: row.applicationUrl ?? undefined,
    };
  }

  // Helper methods for data enrichment

  private detectRemote(location: string): boolean {
    const remotKeywords = ["remote", "work from home", "wfh", "anywhere"];
    const locationLower = location.toLowerCase();
    return remotKeywords.some((keyword) => locationLower.includes(keyword));
  }

  private normalizeStudioType(value: string | null): StudioType | undefined {
    if (!value) return undefined;
    return this.studioTypes.has(value as StudioType) ? (value as StudioType) : undefined;
  }

  private normalizeGameGenres(value: string[] | null): GameGenre[] | undefined {
    if (!Array.isArray(value)) return undefined;
    return value.filter((genre): genre is GameGenre => this.genres.has(genre as GameGenre));
  }

  private normalizePlatforms(value: string[] | null): Platform[] | undefined {
    if (!Array.isArray(value)) return undefined;
    return value.filter((platform): platform is Platform =>
      this.platformsSet.has(platform as Platform),
    );
  }

  private detectHybrid(location: string): boolean {
    const hybridKeywords = ["hybrid"];
    return hybridKeywords.some((keyword) => location.toLowerCase().includes(keyword));
  }

  private detectExperienceLevel(title: string): JobExperienceLevel | undefined {
    const titleLower = title.toLowerCase();

    if (titleLower.includes("director") || titleLower.includes("vp")) return "director";
    if (titleLower.includes("principal") || titleLower.includes("staff")) return "principal";
    if (titleLower.includes("senior") || titleLower.includes("sr")) return "senior";
    if (titleLower.includes("mid") || titleLower.includes("intermediate")) return "mid";
    if (titleLower.includes("junior") || titleLower.includes("jr")) return "junior";
    if (titleLower.includes("entry") || titleLower.includes("intern")) return "entry";

    return undefined;
  }

  private detectJobType(title: string): JobType {
    const titleLower = title.toLowerCase();

    if (titleLower.includes("contract") || titleLower.includes("contractor")) return "contract";
    if (titleLower.includes("intern") || titleLower.includes("internship")) return "internship";
    if (titleLower.includes("part-time") || titleLower.includes("part time")) return "part-time";
    if (titleLower.includes("freelance")) return "freelance";

    return "full-time";
  }

  private detectStudioType(company: string): StudioType {
    const companyLower = company.toLowerCase();

    const aaaStudios = [
      "riot",
      "epic",
      "blizzard",
      "electronic arts",
      "ea",
      "activision",
      "ubisoft",
      "rockstar",
      "bungie",
      "naughty dog",
      "insomniac",
      "respawn",
      "guerrilla",
      "treyarch",
      "sledgehammer",
      "infinity ward",
      "2k",
      "square enix",
      "obsidian",
      "gearbox",
      "playground games",
      "sucker punch",
      "arkane",
      "machinegames",
      "machine games",
      "cd projekt",
      "wargaming",
      "mojang",
      "firaxis",
      "avalanche",
      "amplitude",
      "cloud imperium",
      "cloud chamber",
      "netflix games",
      "lightspeed",
      "striking distance",
      "bandai namco",
      "capcom",
      "sega",
      "konami",
      "take-two",
      "take two",
      "bethesda",
      "larian",
      "double fine",
      "second dinner",
      "archetype entertainment",
    ];
    const mobileStudios = [
      "supercell",
      "zynga",
      "king",
      "jam city",
      "wildlife",
      "playq",
      "voodoo",
      "niantic",
      "pokemon",
      "demiurge",
    ];
    const vrStudios = ["meta", "oculus"];
    const platformStudios = ["valve", "unity", "unreal", "nvidia", "roblox", "discord"];
    const esportsStudios = ["esl", "faceit", "hitmarker"];

    if (aaaStudios.some((s) => companyLower.includes(s))) return "AAA";
    if (mobileStudios.some((s) => companyLower.includes(s))) return "Mobile";
    if (vrStudios.some((s) => companyLower.includes(s))) return "VR/AR";
    if (platformStudios.some((s) => companyLower.includes(s))) return "Platform";
    if (esportsStudios.some((s) => companyLower.includes(s))) return "Esports";

    return "Indie";
  }

  private extractRequirements(description?: string): string[] {
    if (!description) return [];

    const requirements: string[] = [];
    const descLower = description.toLowerCase();

    // Common gaming industry requirements
    const commonReqs = [
      "C++",
      "C#",
      "Unity",
      "Unreal Engine",
      "Python",
      "Java",
      "JavaScript",
      "Graphics Programming",
      "Game Design",
      "Level Design",
      "3D Modeling",
      "Animation",
      "UI/UX",
      "Networking",
      "Multiplayer",
      "AI Programming",
    ];

    for (const req of commonReqs) {
      if (descLower.includes(req.toLowerCase())) {
        requirements.push(req);
      }
    }

    return requirements;
  }

  private extractTechnologies(description?: string): string[] {
    if (!description) return [];

    const technologies: string[] = [];
    const descLower = description.toLowerCase();

    const techKeywords = [
      "Unity",
      "Unreal Engine",
      "Godot",
      "CryEngine",
      "Blender",
      "Maya",
      "3ds Max",
      "Substance Painter",
      "ZBrush",
      "Photoshop",
      "Git",
      "Perforce",
      "Jira",
      "C++",
      "C#",
      "Python",
      "Lua",
      "DirectX",
      "OpenGL",
      "Vulkan",
      "Metal",
      "AWS",
      "Azure",
      "Docker",
      "Kubernetes",
    ];

    for (const tech of techKeywords) {
      if (descLower.includes(tech.toLowerCase())) {
        technologies.push(tech);
      }
    }

    return technologies;
  }

  private extractGenres(description?: string): string[] {
    if (!description) return [];

    const genres: string[] = [];
    const descLower = description.toLowerCase();

    const genreKeywords = [
      "RPG",
      "FPS",
      "MMORPG",
      "MOBA",
      "Battle Royale",
      "Strategy",
      "Simulation",
      "Sports",
      "Racing",
      "Horror",
      "Platformer",
      "Puzzle",
    ];

    for (const genre of genreKeywords) {
      if (descLower.includes(genre.toLowerCase())) {
        genres.push(genre);
      }
    }

    return genres;
  }

  private extractPlatforms(description?: string): string[] {
    if (!description) return [];

    const platforms: string[] = [];
    const descLower = description.toLowerCase();

    const platformKeywords = [
      "PC",
      "Console",
      "Mobile",
      "PlayStation",
      "Xbox",
      "Switch",
      "Steam",
      "VR",
      "AR",
      "Web",
    ];

    for (const platform of platformKeywords) {
      if (descLower.includes(platform.toLowerCase())) {
        platforms.push(platform);
      }
    }

    return platforms;
  }

  private generateTags(raw: RawJob): string[] {
    const tags: string[] = [];

    if (this.detectRemote(raw.location)) tags.push("Remote");
    if (this.detectHybrid(raw.location)) tags.push("Hybrid");

    const description = raw.description?.toLowerCase() || "";
    if (description.includes("senior")) tags.push("Senior");
    if (description.includes("junior")) tags.push("Junior");
    if (description.includes("lead")) tags.push("Leadership");

    return tags;
  }
}

// Export singleton instance
export const jobAggregator = new JobAggregator();
