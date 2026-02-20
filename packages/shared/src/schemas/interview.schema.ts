import { z } from "zod";

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
