import { z } from "zod";

export const personalInfoSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  linkedIn: z.string().optional(),
  github: z.string().optional(),
  portfolio: z.string().optional(),
});

export const userProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  summary: z.string().optional(),
  currentRole: z.string().optional(),
  currentCompany: z.string().optional(),
  yearsExperience: z.number().min(0).optional(),
  technicalSkills: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
  gamingExperience: z
    .object({
      yearsInGaming: z.number().optional(),
      experienceLevel: z
        .enum(["entry", "junior", "mid", "senior", "lead", "principal", "director"])
        .optional(),
      specializations: z.array(z.string()).default([]),
      gameEngines: z.array(z.string()).default([]),
      platforms: z.array(z.string()).default([]),
      genres: z.array(z.string()).default([]),
      shippedTitles: z
        .array(
          z.object({
            name: z.string(),
            platforms: z.array(z.string()),
            releaseDate: z.string().optional(),
            role: z.string(),
            teamSize: z.number().optional(),
          }),
        )
        .default([]),
    })
    .default({}),
  careerGoals: z
    .object({
      desiredRoles: z.array(z.string()).default([]),
      preferredCompanySize: z.array(z.string()).optional(),
      preferredLocations: z.array(z.string()).optional(),
      remotePreference: z.enum(["onsite", "hybrid", "remote", "flexible"]).optional(),
      salaryRange: z
        .object({
          min: z.number(),
          max: z.number(),
          currency: z.string().optional(),
        })
        .optional(),
      willingToRelocate: z.boolean().optional(),
    })
    .default({}),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;
