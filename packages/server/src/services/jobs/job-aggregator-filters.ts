import { DECIMAL_RADIX } from "@bao/shared/constants/client-config";
import { JOB_SALARY_PARSE_MULTIPLIER } from "@bao/shared/constants/jobs";
import { MS_PER_DAY } from "@bao/shared/constants/time";
import type { GameGenre, Job, JobFilters, Platform } from "@bao/shared/types/jobs";
import { eq, gte, inArray, like, type SQLWrapper, sql } from "drizzle-orm";
import { jobs } from "../../db/schema/jobs";

const SALARY_NUMBER_PATTERN = /\d+/g;

const extractSalaryBounds = (
  salary: Job["salary"],
): {
  min: number | undefined;
  max: number | undefined;
} => {
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
};

const applyTechnologyFilter = (allJobs: Job[], technologies: string[] | undefined): Job[] => {
  if (!(technologies && technologies.length > 0)) {
    return allJobs;
  }

  return allJobs.filter((job) => {
    if (!job.technologies) {
      return false;
    }
    const jobTechs = job.technologies.map((technology) => technology.toLowerCase());
    return technologies.some((technology) => jobTechs.includes(technology.toLowerCase()));
  });
};

const applyGenreFilter = (allJobs: Job[], gameGenres: GameGenre[] | undefined): Job[] => {
  if (!(gameGenres && gameGenres.length > 0)) {
    return allJobs;
  }

  return allJobs.filter(
    (job) => Boolean(job.gameGenres) && gameGenres.some((genre) => job.gameGenres?.includes(genre)),
  );
};

const applyPlatformFilter = (allJobs: Job[], platforms: Platform[] | undefined): Job[] => {
  if (!(platforms && platforms.length > 0)) {
    return allJobs;
  }

  return allJobs.filter(
    (job) =>
      Boolean(job.platforms) && platforms.some((platform) => job.platforms?.includes(platform)),
  );
};

const applySalaryFilter = (
  allJobs: Job[],
  salaryMin: number | undefined,
  salaryMax: number | undefined,
): Job[] => {
  if (!(salaryMin || salaryMax)) {
    return allJobs;
  }

  return allJobs.filter((job) => {
    const bounds = extractSalaryBounds(job.salary);
    if (!(bounds.min && bounds.max)) {
      return false;
    }
    if (salaryMin && bounds.max < salaryMin) {
      return false;
    }
    if (salaryMax && bounds.min > salaryMax) {
      return false;
    }
    return true;
  });
};

export const buildSearchConditions = (filters: JobFilters): SQLWrapper[] => {
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

  if (filters.company) {
    conditions.push(like(jobs.company, `%${filters.company}%`));
  }
  if (filters.location) {
    conditions.push(like(jobs.location, `%${filters.location}%`));
  }
  if (filters.remote !== undefined) {
    conditions.push(eq(jobs.remote, filters.remote));
  }
  if (filters.hybrid !== undefined) {
    conditions.push(eq(jobs.hybrid, filters.hybrid));
  }
  if (filters.experienceLevel) {
    conditions.push(eq(jobs.experienceLevel, filters.experienceLevel));
  }
  if (filters.jobType) {
    conditions.push(eq(jobs.type, filters.jobType));
  }
  if (filters.studioTypes && filters.studioTypes.length > 0) {
    conditions.push(inArray(jobs.studioType, filters.studioTypes));
  }
  if (filters.postedWithin) {
    const cutoffDate = new Date(Date.now() - filters.postedWithin * MS_PER_DAY);
    conditions.push(gte(jobs.postedDate, cutoffDate.toISOString()));
  }

  return conditions;
};

export const applyPostFilters = (allJobs: Job[], filters: JobFilters): Job[] => {
  let filtered = applyTechnologyFilter(allJobs, filters.technologies);
  filtered = applyGenreFilter(filtered, filters.gameGenres);
  filtered = applyPlatformFilter(filtered, filters.platforms);
  filtered = applySalaryFilter(filtered, filters.salaryMin, filters.salaryMax);

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
};
