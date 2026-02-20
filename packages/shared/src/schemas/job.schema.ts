import * as z from "zod";
import {
  JOB_EXPERIENCE_LEVELS,
  JOB_GAME_GENRES,
  JOB_QUERY_DEFAULT_LIMIT,
  JOB_QUERY_DEFAULT_PAGE,
  JOB_QUERY_MAX_LIMIT,
  JOB_STUDIO_TYPES,
  JOB_SUPPORTED_PLATFORMS,
  JOB_TYPES,
} from "../constants/jobs";

export const jobFiltersSchema = z.object({
  query: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  remote: z.boolean().optional(),
  hybrid: z.boolean().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  experienceLevel: z.enum(JOB_EXPERIENCE_LEVELS).optional(),
  jobType: z.enum(JOB_TYPES).optional(),
  technologies: z.array(z.string()).optional(),
  studioTypes: z.array(z.enum(JOB_STUDIO_TYPES)).optional(),
  gameGenres: z.array(z.enum(JOB_GAME_GENRES)).optional(),
  platforms: z.array(z.enum(JOB_SUPPORTED_PLATFORMS)).optional(),
  postedWithin: z.number().optional(),
  featured: z.boolean().optional(),
  minMatchScore: z.number().optional(),
  limit: z.number().min(1).max(JOB_QUERY_MAX_LIMIT).default(JOB_QUERY_DEFAULT_LIMIT),
  page: z.number().min(1).default(JOB_QUERY_DEFAULT_PAGE),
});

export type JobFiltersInput = z.infer<typeof jobFiltersSchema>;
