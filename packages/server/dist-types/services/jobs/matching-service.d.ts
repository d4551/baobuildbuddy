/**
 * Job matching and scoring service
 * Calculates match scores between user profiles and job postings
 */
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
type MatchedJob = Omit<Job, "matchScore"> & {
    matchScore: MatchScore;
};
/**
 * Calculate a comprehensive match score between a user profile and a job
 * Returns a score from 0-100 with detailed breakdown
 */
export declare function calculateMatchScore(userProfile: UserProfile, job: Job): MatchScore;
/**
 * Batch calculate match scores for multiple jobs
 */
export declare function calculateMatchScores(userProfile: UserProfile, jobs: Job[]): MatchedJob[];
/**
 * Sort jobs by match score (highest first)
 */
export declare function sortByMatchScore(jobs: Array<Job & {
    matchScore?: number | MatchScore;
}>): Array<Job & {
    matchScore?: number | MatchScore;
}>;
export {};
