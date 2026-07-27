/**
 * Job system types for gaming industry careers
 */

import type { AIProviderType } from "./ai";

/**
 * AI-generated hiring and interview context derived from a scraped job or studio.
 */
/**
 * Declared as a type alias rather than an interface: this payload is persisted
 * and re-read as JSON, so it must stay assignable to `JsonValue` when handed
 * back to `normalizeScrapePersonaEnrichment`. Only type aliases get an implicit
 * index signature, so as an interface it failed that assignment at every
 * round-trip call site.
 */
export type ScrapePersonaEnrichment = {
  summary: string;
  hiringSignals: string[];
  interviewFocusAreas: string[];
  candidatePitchAngles: string[];
  provider?: AIProviderType;
  model?: string;
  updatedAt?: string;
};

/**
 * Summary of AI enrichment completed during one scrape operation.
 */
export interface ScrapeEnrichmentRunSummary {
  enabled: boolean;
  enrichedRecords: number;
  warnings: string[];
  provider?: AIProviderType;
  model?: string;
}

/**
 * One application lifecycle event persisted on an application row.
 */
export interface ApplicationTimelineEntry {
  id?: string;
  status?: string;
  type?: string;
  date?: string;
  notes?: string;
  description?: string;
}

/**
 * Canonical result envelope returned by scraper routes and persisted by automation runs.
 */
export interface ScraperOperationResult {
  scraped: number;
  upserted: number;
  errors: string[];
  enrichment: ScrapeEnrichmentRunSummary;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  hybrid?: boolean;
  salary?: SalaryRange | string;
  description?: string;
  requirements?: string[];
  technologies?: string[];
  experienceLevel?: JobExperienceLevel;
  type: JobType;
  postedDate: string;
  url?: string;
  source?: string;
  featured?: boolean;
  matchScore?: number;
  tags?: string[];
  companyLogo?: string;
  applicationUrl?: string;
  contentHash?: string;
  // Gaming-specific
  studioType?: StudioType;
  gameGenres?: GameGenre[];
  platforms?: Platform[];
  projectType?: ProjectType;
  teamSize?: TeamSize;
  cultureInfo?: CultureInfo;
  gamingRelevance?: number;
  enrichment?: ScrapePersonaEnrichment;
}

export interface SalaryRange {
  min: number;
  max: number;
  currency?: string;
  frequency?: "yearly" | "monthly" | "hourly";
}

export interface CultureInfo {
  workStyle: string;
  values: string[];
  benefits: string[];
  diversity: boolean;
  remoteFirst: boolean;
}

export type JobExperienceLevel = "entry" | "junior" | "mid" | "senior" | "principal" | "director";
export type JobType = "full-time" | "part-time" | "contract" | "internship" | "freelance";
export type StudioType = "AAA" | "Indie" | "Mobile" | "VR/AR" | "Platform" | "Esports" | "Unknown";

export type GameGenre =
  | "Action"
  | "RPG"
  | "Strategy"
  | "Puzzle"
  | "Simulation"
  | "Sports"
  | "Racing"
  | "Shooter"
  | "Platformer"
  | "Horror"
  | "MMORPG"
  | "MOBA"
  | "Battle Royale"
  | "Roguelike"
  | "Sandbox"
  | "Adventure"
  | "Fighting"
  | "Survival"
  | "Card Game"
  | "Casual"
  | "Indie";

export type Platform =
  | "PC"
  | "Console"
  | "Mobile"
  | "VR"
  | "AR"
  | "Web"
  | "Switch"
  | "PlayStation"
  | "Xbox"
  | "Steam";

export type ProjectType = "New IP" | "Sequel" | "Remaster" | "DLC" | "Live Service" | "Prototype";
export type TeamSize = "Solo" | "Small (2-10)" | "Medium (11-50)" | "Large (51-200)" | "AAA (200+)";

export interface JobFilters {
  query?: string;
  company?: string;
  location?: string;
  remote?: boolean;
  hybrid?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: JobExperienceLevel;
  jobType?: JobType;
  technologies?: string[];
  studioTypes?: StudioType[];
  gameGenres?: GameGenre[];
  platforms?: Platform[];
  postedWithin?: number;
  featured?: boolean;
  minMatchScore?: number;
  limit?: number;
  page?: number;
}

export interface JobSearchResult {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
  filters: JobFilters;
}

export interface MatchScore {
  overall: number;
  breakdown: {
    skills: number;
    experience: number;
    location: number;
    salary: number;
    culture: number;
    technology: number;
  };
  strengths: string[];
  improvements: string[];
  missingSkills: string[];
}

export interface JobApplication {
  id: string;
  jobId: string;
  status: "applied" | "reviewing" | "interviewing" | "offered" | "rejected" | "withdrawn";
  appliedDate: string;
  lastUpdate?: string;
  notes: string;
  timeline: ApplicationEvent[];
}

export interface ApplicationEvent {
  id: string;
  type: "applied" | "viewed" | "responded" | "interviewed" | "feedback" | "decision";
  date: string;
  description: string;
}

export interface JobRecommendation {
  job: Job;
  matchScore: MatchScore;
  reasons: string[];
  skillGaps: SkillMatch[];
}

export interface SkillMatch {
  skill: string;
  userLevel: number;
  requiredLevel: number;
  importance: "critical" | "preferred" | "nice-to-have";
  match: boolean;
}
