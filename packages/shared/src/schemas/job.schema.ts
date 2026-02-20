import * as z from "zod";

export const jobFiltersSchema = z.object({
  query: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  remote: z.boolean().optional(),
  hybrid: z.boolean().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  experienceLevel: z.enum(["entry", "junior", "mid", "senior", "principal", "director"]).optional(),
  jobType: z.enum(["full-time", "part-time", "contract", "internship", "freelance"]).optional(),
  technologies: z.array(z.string()).optional(),
  studioTypes: z.array(z.string()).optional(),
  gameGenres: z.array(z.string()).optional(),
  platforms: z.array(z.string()).optional(),
  postedWithin: z.number().optional(),
  featured: z.boolean().optional(),
  minMatchScore: z.number().optional(),
  limit: z.number().min(1).max(100).default(20),
  page: z.number().min(1).default(1),
});

export type JobFiltersInput = z.infer<typeof jobFiltersSchema>;
