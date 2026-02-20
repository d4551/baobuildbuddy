import * as z from "zod";

export const interviewTargetJobSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().min(1),
  description: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  source: z.string().optional(),
  postedDate: z.string().optional(),
  url: z.string().optional(),
});

export const interviewConfigSchema = z.object({
  roleType: z.string(),
  roleCategory: z.string().optional(),
  experienceLevel: z.string(),
  focusAreas: z.array(z.string()),
  duration: z.number().min(5).max(120).default(30),
  questionCount: z.number().min(1).max(20).default(5),
  includeTechnical: z.boolean().default(true),
  includeBehavioral: z.boolean().default(true),
  includeStudioSpecific: z.boolean().default(true),
  enableVoiceMode: z.boolean().optional(),
  technologies: z.array(z.string()).optional(),
  interviewMode: z.enum(["studio", "job"]).optional(),
  targetJob: interviewTargetJobSchema.optional(),
});

export const interviewResponseSchema = z.object({
  questionId: z.string(),
  transcript: z.string(),
  duration: z.number(),
  timestamp: z.number(),
  confidence: z.number().min(0).max(1),
});

export type InterviewConfigInput = z.infer<typeof interviewConfigSchema>;
export type InterviewResponseInput = z.infer<typeof interviewResponseSchema>;
