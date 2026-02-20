import * as z from "zod";

export const resumePersonalInfoSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  linkedIn: z.string().optional(),
  github: z.string().optional(),
  portfolio: z.string().optional(),
});

export const resumeExperienceSchema = z.object({
  title: z.string(),
  company: z.string(),
  startDate: z.string(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  achievements: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
});

export const resumeEducationSchema = z.object({
  degree: z.string(),
  field: z.string(),
  school: z.string(),
  year: z.string(),
  gpa: z.string().optional(),
});

export const resumeSkillsSchema = z.object({
  technical: z.array(z.string()).optional(),
  soft: z.array(z.string()).optional(),
  gaming: z.array(z.string()).optional(),
});

export const resumeProjectSchema = z.object({
  title: z.string(),
  description: z.string(),
  technologies: z.array(z.string()).optional(),
  link: z.string().optional(),
});

export const resumeDataSchema = z.object({
  name: z.string().optional(),
  personalInfo: resumePersonalInfoSchema.optional(),
  summary: z.string().optional(),
  experience: z.array(resumeExperienceSchema).optional(),
  education: z.array(resumeEducationSchema).optional(),
  skills: resumeSkillsSchema.optional(),
  projects: z.array(resumeProjectSchema).optional(),
  gamingExperience: z
    .object({
      gameEngines: z.string().optional(),
      platforms: z.string().optional(),
      genres: z.string().optional(),
      shippedTitles: z.string().optional(),
    })
    .optional(),
  template: z.enum(["modern", "classic", "gaming", "creative", "minimal"]).optional(),
  theme: z.enum(["light", "dark"]).optional(),
  isDefault: z.boolean().optional(),
});

export type ResumeDataInput = z.infer<typeof resumeDataSchema>;
