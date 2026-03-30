/**
 * Job matching and scoring service
 * Calculates match scores between user profiles and job postings
 */

import type { Job, MatchScore } from "@bao/shared";
import { MATCHING_IMPROVEMENT_THRESHOLD, MATCHING_WEIGHTS } from "@bao/shared";
import type { MatchedJob, UserProfile } from "./matching-service-contracts";
import {
  buildMatchNarrative,
  calculateCultureMatch,
  calculateExperienceMatch,
  calculateLocationMatch,
  calculateSalaryMatch,
  calculateSkillMatch,
  calculateTechnologyMatch,
  findMissingSkills,
} from "./matching-service-categories";
import { resolveMatchScore } from "./matching-service-helpers";

export type { UserProfile } from "./matching-service-contracts";

export function calculateMatchScore(userProfile: UserProfile, job: Job) {
  const scores = {
    skills: calculateSkillMatch(userProfile, job),
    experience: calculateExperienceMatch(userProfile, job),
    location: calculateLocationMatch(userProfile, job),
    salary: calculateSalaryMatch(userProfile, job),
    culture: calculateCultureMatch(userProfile, job),
    technology: calculateTechnologyMatch(userProfile, job),
  };

  const overall = Math.round(
    scores.skills * MATCHING_WEIGHTS.skills +
      scores.experience * MATCHING_WEIGHTS.experience +
      scores.location * MATCHING_WEIGHTS.location +
      scores.salary * MATCHING_WEIGHTS.salary +
      scores.culture * MATCHING_WEIGHTS.culture +
      scores.technology * MATCHING_WEIGHTS.technology,
  );

  const narrative = buildMatchNarrative(scores);
  const missingSkills =
    scores.skills < MATCHING_IMPROVEMENT_THRESHOLD ? findMissingSkills(userProfile, job) : [];

  return {
    overall,
    breakdown: scores,
    strengths: narrative.strengths,
    improvements: narrative.improvements,
    missingSkills,
  };
}

export function calculateMatchScores(userProfile: UserProfile, jobs: Job[]): MatchedJob[] {
  return jobs.map((job) => ({
    ...job,
    matchScore: calculateMatchScore(userProfile, job),
  }));
}

export function sortByMatchScore(
  jobs: Array<Job & { matchScore?: number | MatchScore }>,
): Array<Job & { matchScore?: number | MatchScore }> {
  return jobs.sort((a, b) => resolveMatchScore(b.matchScore) - resolveMatchScore(a.matchScore));
}
