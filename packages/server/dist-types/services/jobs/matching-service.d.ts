/**
 * Job matching and scoring service
 * Calculates match scores between user profiles and job postings
 */
import type { Job, MatchScore } from "@bao/shared";
import type { MatchedJob, UserProfile } from "./matching-service-contracts";
export type { UserProfile } from "./matching-service-contracts";
export declare function calculateMatchScore(userProfile: UserProfile, job: Job): {
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
};
export declare function calculateMatchScores(userProfile: UserProfile, jobs: Job[]): MatchedJob[];
export declare function sortByMatchScore(jobs: Array<Job & {
    matchScore?: number | MatchScore;
}>): Array<Job & {
    matchScore?: number | MatchScore;
}>;
