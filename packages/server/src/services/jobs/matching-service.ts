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

  // Weighted average - adjust weights based on importance
  const weights = {
    skills: 0.25,
    experience: 0.2,
    location: 0.15,
    salary: 0.15,
    culture: 0.1,
    technology: 0.15,
  };

  const overall = Math.round(
    scores.skills * weights.skills +
      scores.experience * weights.experience +
      scores.location * weights.location +
      scores.salary * weights.salary +
      scores.culture * weights.culture +
      scores.technology * weights.technology,
  );

  const strengths: string[] = [];
  const improvements: string[] = [];
  const missingSkills: string[] = [];

  // Identify strengths (scores > 70)
  if (scores.skills > 70) strengths.push("Strong skill match");
  if (scores.technology > 70) strengths.push("Technology stack alignment");
  if (scores.experience > 70) strengths.push("Experience level fit");
  if (scores.location > 70) strengths.push("Location preference match");
  if (scores.salary > 70) strengths.push("Salary expectations aligned");

  // Identify areas for improvement (scores < 50)
  if (scores.skills < 50) {
    improvements.push("Develop additional required skills");
    missingSkills.push(...findMissingSkills(userProfile, job));
  }
  if (scores.experience < 50) improvements.push("Gain more relevant experience");
  if (scores.technology < 50) improvements.push("Learn required technologies");

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
    return 50; // Neutral score if no requirements specified
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
    return 50; // Can't determine without user experience level
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

  // Two levels difference is acceptable
  if (Math.abs(userLevel - jobLevel) === 2) {
    return 50;
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
  if (!profile.salaryExpectation || !job.salary) {
    return 60; // Neutral if no salary info
  }

  // Handle both string and object salary formats
  let jobMin: number | undefined;
  let jobMax: number | undefined;

  if (typeof job.salary === "string") {
    // Try to parse salary from string
    const numbers = job.salary.match(/\d+/g);
    if (numbers && numbers.length >= 1) {
      jobMin = Number.parseInt(numbers[0]) * 1000; // Assume K format
      jobMax = numbers.length > 1 ? Number.parseInt(numbers[1]) * 1000 : jobMin;
    }
  } else if (typeof job.salary === "object") {
    jobMin = job.salary.min;
    jobMax = job.salary.max;
  }

  if (!jobMin || !jobMax) {
    return 60;
  }

  const userMin = profile.salaryExpectation.min || 0;
  const userMax = profile.salaryExpectation.max || Number.POSITIVE_INFINITY;

  // Check if ranges overlap
  if (jobMax >= userMin && jobMin <= userMax) {
    // Calculate overlap percentage
    const overlapStart = Math.max(jobMin, userMin);
    const overlapEnd = Math.min(jobMax, userMax);
    const overlapSize = overlapEnd - overlapStart;
    const userRangeSize = userMax - userMin;
    const overlapPercent = overlapSize / userRangeSize;

    return Math.min(100, Math.round(overlapPercent * 100 + 50));
  }

  // No overlap
  if (jobMax < userMin) {
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
    return 50; // Neutral if no tech specified
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
export function calculateMatchScores(
  userProfile: UserProfile,
  jobs: Job[],
): Array<Job & { matchScore: MatchScore }> {
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
): typeof jobs {
  return jobs.sort((a, b) => {
    const scoreA = typeof a.matchScore === "number" ? a.matchScore : a.matchScore?.overall || 0;
    const scoreB = typeof b.matchScore === "number" ? b.matchScore : b.matchScore?.overall || 0;
    return scoreB - scoreA;
  });
}
