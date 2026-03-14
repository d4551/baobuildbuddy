/**
 * Job matching and scoring service
 * Calculates match scores between user profiles and job postings
 */

import type { Job, JobExperienceLevel, MatchScore } from "@bao/shared";
import {
  DEFAULT_SCORE_NEUTRAL,
  JOB_SALARY_PARSE_MULTIPLIER,
  MATCHING_IMPROVEMENT_THRESHOLD,
  MATCHING_STRENGTH_THRESHOLD,
  MATCHING_WEIGHTS,
} from "@bao/shared";

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

type MatchedJob = Omit<Job, "matchScore"> & { matchScore: MatchScore };
type ParsedSalaryRange = {
  min: number;
  max: number;
};

function resolveMatchScore(value: number | MatchScore | undefined): number {
  if (typeof value === "number") {
    return value;
  }
  if (value && typeof value === "object") {
    return value.overall;
  }
  return 0;
}

function parseSalaryRange(salary: Job["salary"]): ParsedSalaryRange | null {
  if (!salary) {
    return null;
  }

  if (typeof salary === "string") {
    const numbers = salary.match(/\d+/g);
    if (!(numbers && numbers.length >= 1)) {
      return null;
    }
    const min = Number.parseInt(numbers[0], 10) * JOB_SALARY_PARSE_MULTIPLIER;
    const max =
      numbers.length > 1 ? Number.parseInt(numbers[1], 10) * JOB_SALARY_PARSE_MULTIPLIER : min;
    return { min, max };
  }

  if (
    typeof salary === "object" &&
    typeof salary.min === "number" &&
    typeof salary.max === "number"
  ) {
    return { min: salary.min, max: salary.max };
  }

  return null;
}

function calculateOverlapScore(
  salaryRange: ParsedSalaryRange,
  userMin: number,
  userMax: number,
): number {
  const overlapStart = Math.max(salaryRange.min, userMin);
  const overlapEnd = Math.min(salaryRange.max, userMax);
  const overlapSize = overlapEnd - overlapStart;
  const userRangeSize = userMax - userMin;
  const overlapPercent = overlapSize / userRangeSize;
  return Math.min(100, Math.round(overlapPercent * 100 + 50));
}

/**
 * Calculate a comprehensive match score between a user profile and a job
 * Returns a score from 0-100 with detailed breakdown
 */
export function calculateMatchScore(userProfile: UserProfile, job: Job): MatchScore {
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

  const strengths: string[] = [];
  const improvements: string[] = [];
  const missingSkills: string[] = [];

  if (scores.skills > MATCHING_STRENGTH_THRESHOLD) strengths.push("Strong skill match");
  if (scores.technology > MATCHING_STRENGTH_THRESHOLD) strengths.push("Technology stack alignment");
  if (scores.experience > MATCHING_STRENGTH_THRESHOLD) strengths.push("Experience level fit");
  if (scores.location > MATCHING_STRENGTH_THRESHOLD) strengths.push("Location preference match");
  if (scores.salary > MATCHING_STRENGTH_THRESHOLD) strengths.push("Salary expectations aligned");

  if (scores.skills < MATCHING_IMPROVEMENT_THRESHOLD) {
    improvements.push("Develop additional required skills");
    missingSkills.push(...findMissingSkills(userProfile, job));
  }
  if (scores.experience < MATCHING_IMPROVEMENT_THRESHOLD)
    improvements.push("Gain more relevant experience");
  if (scores.technology < MATCHING_IMPROVEMENT_THRESHOLD)
    improvements.push("Learn required technologies");

  return {
    overall,
    breakdown: scores,
    strengths,
    improvements,
    missingSkills,
  };
}

/**
 * Calculate skill match score
 */
function calculateSkillMatch(profile: UserProfile, job: Job): number {
  if (!job.requirements || job.requirements.length === 0) {
    return DEFAULT_SCORE_NEUTRAL;
  }

  const userSkills = new Set(profile.skills.map((s) => s.toLowerCase().trim()));

  const requiredSkills = job.requirements.map((r) => r.toLowerCase().trim());

  let matchCount = 0;
  for (const skill of requiredSkills) {
    // Check for exact match or partial match
    if (userSkills.has(skill)) {
      matchCount++;
    } else {
      // Check for partial matches (e.g., "C++" in "C++ Programming")
      for (const userSkill of userSkills) {
        if (userSkill.includes(skill) || skill.includes(userSkill)) {
          matchCount += 0.5;
          break;
        }
      }
    }
  }

  return Math.min(100, Math.round((matchCount / requiredSkills.length) * 100));
}

/**
 * Calculate experience level match
 */
function calculateExperienceMatch(profile: UserProfile, job: Job): number {
  if (!job.experienceLevel) {
    return 60; // Neutral score if not specified
  }

  if (!profile.experienceLevel) {
    return DEFAULT_SCORE_NEUTRAL;
  }

  const levels: Record<JobExperienceLevel, number> = {
    entry: 0,
    junior: 1,
    mid: 2,
    senior: 3,
    principal: 4,
    director: 5,
  };

  const userLevel = levels[profile.experienceLevel];
  const jobLevel = levels[job.experienceLevel];

  // Perfect match
  if (userLevel === jobLevel) {
    return 100;
  }

  // One level difference is good
  if (Math.abs(userLevel - jobLevel) === 1) {
    return 75;
  }

  if (Math.abs(userLevel - jobLevel) === 2) {
    return DEFAULT_SCORE_NEUTRAL;
  }

  // More than two levels is a poor match
  return 25;
}

/**
 * Calculate location match score
 */
function calculateLocationMatch(profile: UserProfile, job: Job): number {
  // Remote jobs are generally preferred
  if (job.remote && profile.remotePreference) {
    return 100;
  }

  if (job.hybrid && profile.hybridPreference) {
    return 90;
  }

  if (job.remote && !profile.remotePreference) {
    return 80;
  }

  // Check preferred locations
  if (profile.preferredLocations && profile.preferredLocations.length > 0) {
    const jobLocation = job.location.toLowerCase();
    for (const preferred of profile.preferredLocations) {
      if (jobLocation.includes(preferred.toLowerCase())) {
        return 85;
      }
    }
    return 40; // Location doesn't match preferences
  }

  return 60; // Neutral if no preferences specified
}

/**
 * Calculate salary match score
 */
function calculateSalaryMatch(profile: UserProfile, job: Job): number {
  if (!(profile.salaryExpectation && job.salary)) {
    return 60; // Neutral if no salary info
  }

  const salaryRange = parseSalaryRange(job.salary);
  if (!salaryRange) {
    return 60;
  }

  const userMin = profile.salaryExpectation.min || 0;
  const userMax = profile.salaryExpectation.max || Number.POSITIVE_INFINITY;

  // Check if ranges overlap
  if (salaryRange.max >= userMin && salaryRange.min <= userMax) {
    return calculateOverlapScore(salaryRange, userMin, userMax);
  }

  // No overlap
  if (salaryRange.max < userMin) {
    return 20; // Below expectations
  }

  return 40; // Above expectations (could still be good)
}

/**
 * Calculate culture/work environment match
 */
function calculateCultureMatch(profile: UserProfile, job: Job): number {
  let score = 60; // Base neutral score

  // Studio type preference
  if (profile.preferredStudioTypes && profile.preferredStudioTypes.length > 0 && job.studioType) {
    if (profile.preferredStudioTypes.includes(job.studioType)) {
      score += 20;
    }
  }

  // Genre preference
  if (profile.preferredGenres && profile.preferredGenres.length > 0 && job.gameGenres) {
    const matchingGenres = job.gameGenres.filter((g) => profile.preferredGenres?.includes(g));
    if (matchingGenres.length > 0) {
      score += 10;
    }
  }

  // Platform preference
  if (profile.preferredPlatforms && profile.preferredPlatforms.length > 0 && job.platforms) {
    const matchingPlatforms = job.platforms.filter((p) => profile.preferredPlatforms?.includes(p));
    if (matchingPlatforms.length > 0) {
      score += 10;
    }
  }

  return Math.min(100, score);
}

/**
 * Calculate technology stack match
 */
function calculateTechnologyMatch(profile: UserProfile, job: Job): number {
  if (!job.technologies || job.technologies.length === 0) {
    return DEFAULT_SCORE_NEUTRAL;
  }

  const userTech = new Set(profile.technologies.map((t) => t.toLowerCase().trim()));

  const requiredTech = job.technologies.map((t) => t.toLowerCase().trim());

  let matchCount = 0;
  for (const tech of requiredTech) {
    if (userTech.has(tech)) {
      matchCount++;
    } else {
      // Check for similar technologies (e.g., "unity" and "unity3d")
      for (const userT of userTech) {
        if (userT.includes(tech) || tech.includes(userT)) {
          matchCount += 0.7;
          break;
        }
      }
    }
  }

  return Math.min(100, Math.round((matchCount / requiredTech.length) * 100));
}

/**
 * Find missing skills from job requirements
 */
function findMissingSkills(profile: UserProfile, job: Job): string[] {
  if (!job.requirements) {
    return [];
  }

  const userSkills = new Set(profile.skills.map((s) => s.toLowerCase().trim()));

  const missing: string[] = [];

  for (const requirement of job.requirements) {
    const reqLower = requirement.toLowerCase().trim();
    let found = false;

    for (const userSkill of userSkills) {
      if (userSkill.includes(reqLower) || reqLower.includes(userSkill)) {
        found = true;
        break;
      }
    }

    if (!found) {
      missing.push(requirement);
    }
  }

  return missing;
}

/**
 * Batch calculate match scores for multiple jobs
 */
export function calculateMatchScores(userProfile: UserProfile, jobs: Job[]): MatchedJob[] {
  return jobs.map((job) => ({
    ...job,
    matchScore: calculateMatchScore(userProfile, job),
  }));
}

/**
 * Sort jobs by match score (highest first)
 */
export function sortByMatchScore(
  jobs: Array<Job & { matchScore?: number | MatchScore }>,
): Array<Job & { matchScore?: number | MatchScore }> {
  return jobs.sort((a, b) => {
    const scoreA = resolveMatchScore(a.matchScore);
    const scoreB = resolveMatchScore(b.matchScore);
    return scoreB - scoreA;
  });
}
