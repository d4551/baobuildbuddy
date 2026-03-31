import z from "zod";

import type {
  CareerPathway,
  CategoryAssessment,
  ReadinessAssessment,
  RoleReadiness,
} from "../types/skill-mapping";
import {
  SKILL_READINESS_FEEDBACK_IDS,
  SKILL_READINESS_IMPROVEMENT_IDS,
  SKILL_READINESS_NEXT_STEP_IDS,
} from "../types/skill-mapping";

export const categoryAssessmentSchema = z.object({
  score: z.number().min(0).max(100),
  feedbackId: z.enum(SKILL_READINESS_FEEDBACK_IDS),
  strengths: z.array(z.string()).optional(),
  improvements: z.array(z.enum(SKILL_READINESS_IMPROVEMENT_IDS)).optional(),
});

export const roleReadinessSchema = z.object({
  roleId: z.string(),
  roleTitle: z.string(),
  readinessScore: z.number().min(0).max(100),
  missingSkills: z.array(z.string()),
  matchingSkills: z.array(z.string()),
  timeToReady: z.string().optional(),
  recommendedActions: z.array(z.string()),
});

export const careerPathwaySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  detailedDescription: z.string().optional(),
  matchScore: z.number().min(0).max(100),
  stages: z.array(
    z.object({
      title: z.string(),
      duration: z.string(),
      description: z.string(),
      completed: z.boolean().optional(),
      current: z.boolean().optional(),
      requirements: z.array(z.string()).optional(),
      outcomes: z.array(z.string()).optional(),
    }),
  ),
  requiredSkills: z.array(z.string()),
  estimatedTimeToEntry: z.string(),
  icon: z.string().optional(),
  averageSalary: z
    .object({
      min: z.number(),
      max: z.number(),
      currency: z.string().optional(),
    })
    .optional(),
  jobMarketTrend: z.enum(["growing", "stable", "declining"]),
});

export const readinessAssessmentSchema = z.object({
  overallScore: z.number().min(0).max(100),
  categories: z.object({
    technical: categoryAssessmentSchema,
    softSkills: categoryAssessmentSchema,
    industryKnowledge: categoryAssessmentSchema,
    portfolio: categoryAssessmentSchema,
  }),
  improvementSuggestions: z.array(z.enum(SKILL_READINESS_IMPROVEMENT_IDS)),
  nextSteps: z.array(z.enum(SKILL_READINESS_NEXT_STEP_IDS)),
  targetRoleReadiness: z.array(roleReadinessSchema).optional(),
});

export const careerPathwaysSchema = z.array(careerPathwaySchema);

/**
 * Type aliases that keep shared schema and runtime types aligned.
 */
export type ReadinessAssessmentSchema = ReadinessAssessment;
export type CategoryAssessmentSchema = CategoryAssessment;
export type RoleReadinessSchema = RoleReadiness;
export type CareerPathwaySchema = CareerPathway;
