import * as z from "zod/v3";

import type {
  CareerPathway,
  CategoryAssessment,
  ReadinessAssessment,
  RoleReadiness,
} from "../types/skill-mapping";

export const categoryAssessmentSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string(),
  strengths: z.array(z.string()).optional(),
  improvements: z.array(z.string()).optional(),
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
  improvementSuggestions: z.array(z.string()),
  nextSteps: z.array(z.string()),
  targetRoleReadiness: z.array(roleReadinessSchema).optional(),
});

export const careerPathwaysSchema = z.array(careerPathwaySchema);

/**
 * Type aliases for compatibility between shared schema and runtime types.
 */
export type ReadinessAssessmentSchema = ReadinessAssessment;
export type CategoryAssessmentSchema = CategoryAssessment;
export type RoleReadinessSchema = RoleReadiness;
export type CareerPathwaySchema = CareerPathway;
