import type { Job, JobExperienceLevel, MatchScore } from "@bao/shared";

export interface UserProfile {
  skills: string[];
  technologies: string[];
  experienceLevel?: JobExperienceLevel;
  preferredLocations?: string[];
  remotePreference?: boolean;
  hybridPreference?: boolean;
  salaryExpectation?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  preferredStudioTypes?: string[];
  preferredGenres?: string[];
  preferredPlatforms?: string[];
  yearsOfExperience?: number;
}

export type MatchedJob = Omit<Job, "matchScore"> & { matchScore: MatchScore };

export type ParsedSalaryRange = {
  min: number;
  max: number;
};
