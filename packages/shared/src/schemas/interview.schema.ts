import z from "zod";
import { AI_PROVIDER_IDS } from "../types/ai";

export const scrapePersonaEnrichmentSchema = z.object({
  summary: z.string().min(1),
  hiringSignals: z.array(z.string()).default([]),
  interviewFocusAreas: z.array(z.string()).default([]),
  candidatePitchAngles: z.array(z.string()).default([]),
  provider: z.enum(AI_PROVIDER_IDS).optional(),
  model: z.string().optional(),
  updatedAt: z.string().optional(),
});

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
  enrichment: scrapePersonaEnrichmentSchema.optional(),
});

export const interviewCandidateContextSchema = z.object({
  resumeId: z.string().optional(),
  coverLetterId: z.string().optional(),
  portfolioId: z.string().optional(),
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
  conversationStyle: z.enum(["natural", "structured"]).optional(),
  targetJob: interviewTargetJobSchema.optional(),
  candidateContext: interviewCandidateContextSchema.optional(),
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
