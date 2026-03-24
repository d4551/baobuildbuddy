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
  SalaryRange,
  StudioType,
} from "@bao/shared";
import {
  API_ERROR_APPLICATION_NOT_FOUND,
  DECIMAL_RADIX,
  JOB_AGGREGATOR_CACHE_EXPIRY_MS,
  JOB_EXPERIENCE_LEVELS,
  JOB_GAME_GENRES,
  JOB_QUERY_DEFAULT_LIMIT,
  JOB_QUERY_DEFAULT_PAGE,
  JOB_SALARY_PARSE_MULTIPLIER,
  JOB_STUDIO_TYPES,
  JOB_SUPPORTED_PLATFORMS,
  JOB_TYPES,
  MS_PER_DAY,
} from "@bao/shared";
import { and, desc, eq, gte, inArray, like, type SQLWrapper, sql } from "drizzle-orm";
import { db } from "../../db/client";
import { applications, jobs, savedJobs } from "../../db/schema/jobs";
import { createServerLogger } from "../../utils/logger";
import { deduplicateJobs, generateContentHash } from "./deduplication";
import { CompanyBoardsProvider } from "./providers/company-board";
import {
  gamesJobsDirectProvider,
  grackleProvider,
  hitmarkerPortalProvider,
  hitmarkerProvider,
  pocketGamerProvider,
  remoteGameJobsProvider,
  workWithIndiesProvider,
} from "./providers/gaming-providers";
import { GreenhouseProvider } from "./providers/greenhouse";
import { LeverProvider } from "./providers/lever";
import type { JobProvider, RawJob } from "./providers/provider-interface";

const isOneOf = <T extends string>(values: readonly T[], value: unknown): value is T => {
  if (typeof value !== "string") {
    return false;
  }
  return values.some((entry) => entry === value);
};

const REMOTE_KEYWORDS = ["remote", "work from home", "wfh", "anywhere"];
const HYBRID_KEYWORDS = ["hybrid"];
const SALARY_NUMBER_PATTERN = /\d+/g;
const AAA_STUDIO_KEYWORDS = [
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
] as const;
const MOBILE_STUDIO_KEYWORDS = [
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
] as const;
const VR_STUDIO_KEYWORDS = ["meta", "oculus"] as const;
const PLATFORM_STUDIO_KEYWORDS = [
  "valve",
  "unity",
  "unreal",
  "nvidia",
  "roblox",
  "discord",
] as const;
const ESPORTS_STUDIO_KEYWORDS = ["esl", "faceit", "hitmarker"] as const;
const STUDIO_KEYWORD_GROUPS: ReadonlyArray<readonly [StudioType, readonly string[]]> = [
  ["AAA", AAA_STUDIO_KEYWORDS],
  ["Mobile", MOBILE_STUDIO_KEYWORDS],
  ["VR/AR", VR_STUDIO_KEYWORDS],
  ["Platform", PLATFORM_STUDIO_KEYWORDS],
  ["Esports", ESPORTS_STUDIO_KEYWORDS],
];

export class JobAggregator {
  private providers: JobProvider[];
  private cacheExpiry: number; // milliseconds
  private logger = createServerLogger("job-aggregator");

  constructor() {
    this.providers = [
      // API-native providers
      new GreenhouseProvider(),
      new LeverProvider(),
      hitmarkerProvider,

      // RPA-backed scrapers
      hitmarkerPortalProvider,
      grackleProvider,
      workWithIndiesProvider,
      remoteGameJobsProvider,
      gamesJobsDirectProvider,
      pocketGamerProvider,

      // Multi-ATS company boards (SmartRecruiters, Workday, Ashby, etc.)
      new CompanyBoardsProvider(),
    ];

    this.cacheExpiry = JOB_AGGREGATOR_CACHE_EXPIRY_MS;
  }

  private async fetchProviderJobs(): Promise<RawJob[]> {
    const results = await Promise.allSettled(
      this.providers.map((provider) => provider.fetchJobs()),
    );
    return results.flatMap((result, index) => {
      const providerName = this.providers[index]?.name || "unknown-provider";
      if (result.status === "fulfilled") {
        this.logger.info(`${providerName}: fetched ${result.value.length} jobs`);
        return result.value;
      }
      this.logger.error(`${providerName}: failed`, result.reason);
      return [];
    });
  }

  private async saveOrUpdateJob(rawJob: RawJob): Promise<"new" | "updated" | "skipped"> {
    const job = this.rawJobToJob(rawJob);
    if (!job.contentHash) {
      return "skipped";
    }

    const existing = await db
      .select()
      .from(jobs)
      .where(eq(jobs.contentHash, job.contentHash))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(jobs).values(job);
      return "new";
    }

    await db
      .update(jobs)
      .set({
        ...job,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(jobs.id, existing[0].id));
    return "updated";
  }

  private buildSearchConditions(filters: JobFilters): SQLWrapper[] {
    const conditions: SQLWrapper[] = [];
    if (filters.query) {
      const searchPattern = `%${filters.query}%`;
      conditions.push(
        sql`(
          ${jobs.title} LIKE ${searchPattern} OR
          ${jobs.company} LIKE ${searchPattern} OR
          ${jobs.description} LIKE ${searchPattern}
        )`,
      );
    }
    if (filters.company) conditions.push(like(jobs.company, `%${filters.company}%`));
    if (filters.location) conditions.push(like(jobs.location, `%${filters.location}%`));
    if (filters.remote !== undefined) conditions.push(eq(jobs.remote, filters.remote));
    if (filters.hybrid !== undefined) conditions.push(eq(jobs.hybrid, filters.hybrid));
    if (filters.experienceLevel) conditions.push(eq(jobs.experienceLevel, filters.experienceLevel));
    if (filters.jobType) conditions.push(eq(jobs.type, filters.jobType));
    if (filters.studioTypes && filters.studioTypes.length > 0) {
      conditions.push(inArray(jobs.studioType, filters.studioTypes));
    }
    if (filters.postedWithin) {
      const cutoffDate = new Date(Date.now() - filters.postedWithin * MS_PER_DAY);
      conditions.push(gte(jobs.postedDate, cutoffDate.toISOString()));
    }
    return conditions;
  }

  private applyTechnologyFilter(allJobs: Job[], technologies: string[] | undefined): Job[] {
    if (!(technologies && technologies.length > 0)) {
      return allJobs;
    }
    return allJobs.filter((job) => {
      if (!job.technologies) return false;
      const jobTechs = job.technologies.map((technology) => technology.toLowerCase());
      return technologies.some((technology) => jobTechs.includes(technology.toLowerCase()));
    });
  }

  private applyGenreFilter(allJobs: Job[], gameGenres: GameGenre[] | undefined): Job[] {
    if (!(gameGenres && gameGenres.length > 0)) {
      return allJobs;
    }
    return allJobs.filter(
      (job) =>
        Boolean(job.gameGenres) && gameGenres.some((genre) => job.gameGenres?.includes(genre)),
    );
  }

  private applyPlatformFilter(allJobs: Job[], platforms: Platform[] | undefined): Job[] {
    if (!(platforms && platforms.length > 0)) {
      return allJobs;
    }
    return allJobs.filter(
      (job) =>
        Boolean(job.platforms) && platforms.some((platform) => job.platforms?.includes(platform)),
    );
  }

  private extractSalaryBounds(salary: Job["salary"]): {
    min: number | undefined;
    max: number | undefined;
  } {
    if (!salary) {
      return { min: undefined, max: undefined };
    }
    if (typeof salary === "string") {
      const numbers = salary.match(SALARY_NUMBER_PATTERN);
      if (!numbers) {
        return { min: undefined, max: undefined };
      }
      const min = Number.parseInt(numbers[0], DECIMAL_RADIX) * JOB_SALARY_PARSE_MULTIPLIER;
      const max =
        numbers.length > 1
          ? Number.parseInt(numbers[1], DECIMAL_RADIX) * JOB_SALARY_PARSE_MULTIPLIER
          : min;
      return { min, max };
    }
    return {
      min: salary.min,
      max: salary.max,
    };
  }

  private applySalaryFilter(
    allJobs: Job[],
    salaryMin: number | undefined,
    salaryMax: number | undefined,
  ): Job[] {
    if (!(salaryMin || salaryMax)) {
      return allJobs;
    }
    return allJobs.filter((job) => {
      const bounds = this.extractSalaryBounds(job.salary);
      if (!(bounds.min && bounds.max)) {
        return false;
      }
      if (salaryMin && bounds.max < salaryMin) return false;
      if (salaryMax && bounds.min > salaryMax) return false;
      return true;
    });
  }

  private applyPostFilters(allJobs: Job[], filters: JobFilters): Job[] {
    let filtered = this.applyTechnologyFilter(allJobs, filters.technologies);
    filtered = this.applyGenreFilter(filtered, filters.gameGenres);
    filtered = this.applyPlatformFilter(filtered, filters.platforms);
    filtered = this.applySalaryFilter(filtered, filters.salaryMin, filters.salaryMax);
    const minMatchScore = filters.minMatchScore;
    if (minMatchScore !== undefined) {
      filtered = filtered.filter(
        (job) => job.matchScore !== undefined && job.matchScore >= minMatchScore,
      );
    }
    if (filters.featured !== undefined) {
      filtered = filtered.filter((job) => job.featured === filters.featured);
    }
    return filtered;
  }

  /**
   * Refresh jobs from all providers and update cache
   */
  async refreshJobs(): Promise<{ total: number; new: number; updated: number }> {
    this.logger.info("Starting job refresh from all providers");

    const allRawJobs = await this.fetchProviderJobs();
    const uniqueJobs = deduplicateJobs(allRawJobs);
    this.logger.debug(`Deduplicated: ${allRawJobs.length} -> ${uniqueJobs.length} jobs`);

    let newCount = 0;
    let updatedCount = 0;
    const saveResults = await Promise.allSettled(
      uniqueJobs.map((rawJob) => this.saveOrUpdateJob(rawJob)),
    );
    for (const result of saveResults) {
      if (result.status === "fulfilled") {
        if (result.value === "new") newCount += 1;
        if (result.value === "updated") updatedCount += 1;
        continue;
      }
      this.logger.error("Failed to save job:", result.reason);
    }

    this.logger.info(`Refresh complete: ${newCount} new, ${updatedCount} updated`);

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
    const limit = filters.limit ?? JOB_QUERY_DEFAULT_LIMIT;
    const page = filters.page ?? JOB_QUERY_DEFAULT_PAGE;
    const conditions = this.buildSearchConditions(filters);
    const queryBuilder =
      conditions.length > 0
        ? db
            .select()
            .from(jobs)
            .where(and(...conditions))
        : db.select().from(jobs);
    const offset = (page - 1) * limit;
    const results = await queryBuilder.orderBy(desc(jobs.postedDate)).limit(limit).offset(offset);
    const jobResults: Job[] = results.map((row) => this.dbRowToJob(row));
    const filteredJobs = this.applyPostFilters(jobResults, filters);

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
      throw new Error(API_ERROR_APPLICATION_NOT_FOUND);
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
    const applyUrl = typeof raw.applyUrl === "string" && raw.applyUrl.trim() ? raw.applyUrl : null;

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
      applicationUrl: applyUrl || raw.url,
    };
  }

  /**
   * Convert database row to Job format
   */
  private dbRowToJob(row: typeof jobs.$inferSelect): Job {
    const baseJob: Job = {
      id: row.id,
      title: row.title,
      company: row.company,
      location: row.location,
      remote: row.remote ?? false,
      salary: this.normalizeSalary(row.salary),
      description: row.description ?? "",
      type: this.normalizeJobType(row.type),
      postedDate: row.postedDate || new Date().toISOString(),
      studioType: this.normalizeStudioType(row.studioType),
      gameGenres: this.normalizeGameGenres(row.gameGenres),
      platforms: this.normalizePlatforms(row.platforms),
    };
    return this.applyOptionalRowFields(baseJob, row);
  }

  private applyOptionalRowFields(job: Job, row: typeof jobs.$inferSelect): Job {
    return {
      ...job,
      hybrid: row.hybrid ?? undefined,
      requirements: Array.isArray(row.requirements) ? row.requirements : undefined,
      technologies: Array.isArray(row.technologies) ? row.technologies : undefined,
      experienceLevel: this.normalizeExperienceLevel(row.experienceLevel),
      url: row.url ?? undefined,
      source: row.source ?? undefined,
      contentHash: row.contentHash ?? undefined,
      tags: Array.isArray(row.tags) ? row.tags : undefined,
      companyLogo: row.companyLogo ?? undefined,
      applicationUrl: row.applicationUrl ?? undefined,
    };
  }

  private normalizeSalary(value: Record<string, unknown> | null): Job["salary"] | undefined {
    if (!value) return;

    if (typeof value.label === "string" && value.label.trim().length > 0) {
      return value.label;
    }

    const min = typeof value.min === "number" ? value.min : undefined;
    const max = typeof value.max === "number" ? value.max : undefined;
    if (min !== undefined && max !== undefined) {
      const normalized: SalaryRange = {
        min,
        max,
        currency: typeof value.currency === "string" ? value.currency : undefined,
        frequency:
          value.frequency === "yearly" ||
          value.frequency === "monthly" ||
          value.frequency === "hourly"
            ? value.frequency
            : undefined,
      };
      return normalized;
    }

    return;
  }

  // Helper methods for data enrichment

  private detectRemote(location: string): boolean {
    const locationLower = location.toLowerCase();
    return REMOTE_KEYWORDS.some((keyword) => locationLower.includes(keyword));
  }

  private normalizeStudioType(value: string | null): StudioType | undefined {
    if (!isOneOf(JOB_STUDIO_TYPES, value)) return;
    return value;
  }

  private normalizeGameGenres(value: string[] | null): GameGenre[] | undefined {
    if (!Array.isArray(value)) return;
    return value.filter((genre): genre is GameGenre => isOneOf(JOB_GAME_GENRES, genre));
  }

  private normalizePlatforms(value: string[] | null): Platform[] | undefined {
    if (!Array.isArray(value)) return;
    return value.filter((platform): platform is Platform =>
      isOneOf(JOB_SUPPORTED_PLATFORMS, platform),
    );
  }

  private normalizeExperienceLevel(value: string | null): JobExperienceLevel | undefined {
    if (!isOneOf(JOB_EXPERIENCE_LEVELS, value)) return;
    return value;
  }

  private normalizeJobType(value: string | null): JobType {
    if (!isOneOf(JOB_TYPES, value)) return "full-time";
    return value;
  }

  private detectHybrid(location: string): boolean {
    return HYBRID_KEYWORDS.some((keyword) => location.toLowerCase().includes(keyword));
  }

  private detectExperienceLevel(title: string): JobExperienceLevel | undefined {
    const titleLower = title.toLowerCase();

    if (titleLower.includes("director") || titleLower.includes("vp")) return "director";
    if (titleLower.includes("principal") || titleLower.includes("staff")) return "principal";
    if (titleLower.includes("senior") || titleLower.includes("sr")) return "senior";
    if (titleLower.includes("mid") || titleLower.includes("intermediate")) return "mid";
    if (titleLower.includes("junior") || titleLower.includes("jr")) return "junior";
    if (titleLower.includes("entry") || titleLower.includes("intern")) return "entry";

    return;
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
    for (const [studioType, keywords] of STUDIO_KEYWORD_GROUPS) {
      if (keywords.some((keyword) => companyLower.includes(keyword))) {
        return studioType;
      }
    }

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
