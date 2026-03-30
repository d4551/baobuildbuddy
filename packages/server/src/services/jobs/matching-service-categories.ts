import type { Job, JobExperienceLevel } from "@bao/shared";
import {
  DEFAULT_SCORE_NEUTRAL,
  MATCHING_IMPROVEMENT_THRESHOLD,
  MATCHING_STRENGTH_THRESHOLD,
} from "@bao/shared";
import type { UserProfile } from "./matching-service-contracts";
import { calculateOverlapScore, parseSalaryRange } from "./matching-service-helpers";

export const calculateSkillMatch = (profile: UserProfile, job: Job): number => {
  if (!job.requirements || job.requirements.length === 0) {
    return DEFAULT_SCORE_NEUTRAL;
  }

  const userSkills = new Set(profile.skills.map((skill) => skill.toLowerCase().trim()));
  const requiredSkills = job.requirements.map((requirement) => requirement.toLowerCase().trim());
  let matchCount = 0;

  for (const skill of requiredSkills) {
    if (userSkills.has(skill)) {
      matchCount += 1;
      continue;
    }

    for (const userSkill of userSkills) {
      if (userSkill.includes(skill) || skill.includes(userSkill)) {
        matchCount += 0.5;
        break;
      }
    }
  }

  return Math.min(100, Math.round((matchCount / requiredSkills.length) * 100));
};

export const calculateExperienceMatch = (profile: UserProfile, job: Job): number => {
  if (!job.experienceLevel) {
    return 60;
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

  if (userLevel === jobLevel) {
    return 100;
  }
  if (Math.abs(userLevel - jobLevel) === 1) {
    return 75;
  }
  if (Math.abs(userLevel - jobLevel) === 2) {
    return DEFAULT_SCORE_NEUTRAL;
  }
  return 25;
};

export const calculateLocationMatch = (profile: UserProfile, job: Job): number => {
  if (job.remote && profile.remotePreference) {
    return 100;
  }
  if (job.hybrid && profile.hybridPreference) {
    return 90;
  }
  if (job.remote && !profile.remotePreference) {
    return 80;
  }

  if (profile.preferredLocations && profile.preferredLocations.length > 0) {
    const jobLocation = job.location.toLowerCase();
    for (const preferred of profile.preferredLocations) {
      if (jobLocation.includes(preferred.toLowerCase())) {
        return 85;
      }
    }
    return 40;
  }

  return 60;
};

export const calculateSalaryMatch = (profile: UserProfile, job: Job): number => {
  if (!(profile.salaryExpectation && job.salary)) {
    return 60;
  }

  const salaryRange = parseSalaryRange(job.salary);
  if (!salaryRange) {
    return 60;
  }

  const userMin = profile.salaryExpectation.min || 0;
  const userMax = profile.salaryExpectation.max || Number.POSITIVE_INFINITY;
  if (salaryRange.max >= userMin && salaryRange.min <= userMax) {
    return calculateOverlapScore(salaryRange, userMin, userMax);
  }
  if (salaryRange.max < userMin) {
    return 20;
  }
  return 40;
};

export const calculateCultureMatch = (profile: UserProfile, job: Job): number => {
  let score = 60;

  if (profile.preferredStudioTypes && profile.preferredStudioTypes.length > 0 && job.studioType) {
    if (profile.preferredStudioTypes.includes(job.studioType)) {
      score += 20;
    }
  }

  if (profile.preferredGenres && profile.preferredGenres.length > 0 && job.gameGenres) {
    const matchingGenres = job.gameGenres.filter((genre) =>
      profile.preferredGenres?.includes(genre),
    );
    if (matchingGenres.length > 0) {
      score += 10;
    }
  }

  if (profile.preferredPlatforms && profile.preferredPlatforms.length > 0 && job.platforms) {
    const matchingPlatforms = job.platforms.filter((platform) =>
      profile.preferredPlatforms?.includes(platform),
    );
    if (matchingPlatforms.length > 0) {
      score += 10;
    }
  }

  return Math.min(100, score);
};

export const calculateTechnologyMatch = (profile: UserProfile, job: Job): number => {
  if (!job.technologies || job.technologies.length === 0) {
    return DEFAULT_SCORE_NEUTRAL;
  }

  const userTech = new Set(profile.technologies.map((technology) => technology.toLowerCase().trim()));
  const requiredTech = job.technologies.map((technology) => technology.toLowerCase().trim());
  let matchCount = 0;

  for (const tech of requiredTech) {
    if (userTech.has(tech)) {
      matchCount += 1;
      continue;
    }

    for (const userTechnology of userTech) {
      if (userTechnology.includes(tech) || tech.includes(userTechnology)) {
        matchCount += 0.7;
        break;
      }
    }
  }

  return Math.min(100, Math.round((matchCount / requiredTech.length) * 100));
};

export const findMissingSkills = (profile: UserProfile, job: Job): string[] => {
  if (!job.requirements) {
    return [];
  }

  const userSkills = new Set(profile.skills.map((skill) => skill.toLowerCase().trim()));
  const missing: string[] = [];

  for (const requirement of job.requirements) {
    const normalizedRequirement = requirement.toLowerCase().trim();
    let found = false;

    for (const userSkill of userSkills) {
      if (userSkill.includes(normalizedRequirement) || normalizedRequirement.includes(userSkill)) {
        found = true;
        break;
      }
    }

    if (!found) {
      missing.push(requirement);
    }
  }

  return missing;
};

export const buildMatchNarrative = (scores: {
  skills: number;
  experience: number;
  location: number;
  salary: number;
  culture: number;
  technology: number;
}) => {
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (scores.skills > MATCHING_STRENGTH_THRESHOLD) strengths.push("Strong skill match");
  if (scores.technology > MATCHING_STRENGTH_THRESHOLD) strengths.push("Technology stack alignment");
  if (scores.experience > MATCHING_STRENGTH_THRESHOLD) strengths.push("Experience level fit");
  if (scores.location > MATCHING_STRENGTH_THRESHOLD) strengths.push("Location preference match");
  if (scores.salary > MATCHING_STRENGTH_THRESHOLD) strengths.push("Salary expectations aligned");

  if (scores.skills < MATCHING_IMPROVEMENT_THRESHOLD) {
    improvements.push("Develop additional required skills");
  }
  if (scores.experience < MATCHING_IMPROVEMENT_THRESHOLD) {
    improvements.push("Gain more relevant experience");
  }
  if (scores.technology < MATCHING_IMPROVEMENT_THRESHOLD) {
    improvements.push("Learn required technologies");
  }

  return { strengths, improvements };
};
