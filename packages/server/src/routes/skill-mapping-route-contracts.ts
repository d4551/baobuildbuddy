import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_GONE,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import {
  SCHEMA_MAX_ITEMS_LARGE,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LABEL,
  SCHEMA_MAX_LENGTH_SHORT,
} from "@bao/shared/constants/schema-limits";
import { t } from "elysia";
import type { Static } from "typebox";
import { simpleErrorResponseSchema } from "./route-error-envelope";

export type SkillMappingsQuery = {
  category?: string;
  search?: string;
};

export type SkillMappingMutationBody = {
  gameExpression: string;
  transferableSkill: string;
  industryApplications?: unknown;
  evidence?: unknown;
  confidence?: number;
  category?: string;
  demandLevel?: string;
  aiGenerated?: boolean;
};

export type SkillMappingUpdateBody = Partial<SkillMappingMutationBody>;

export type SkillAnalyzeBody = {
  gameExperience?: Record<string, unknown>;
  resume?: Record<string, unknown>;
  autoCreateMappings?: boolean;
};

export type SkillMappingRouteSetState = {
  status?: number | string;
};

export const skillMappingsQuerySchema = t.Object({
  category: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  search: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
});
export type SkillMappingsRouteQuery = Static<typeof skillMappingsQuerySchema>;

export const skillMappingIdParamsSchema = t.Object(
  {
    id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["id"] },
);
export type SkillMappingIdParams = Static<typeof skillMappingIdParamsSchema>;

export const skillMappingCreateBodySchema = t.Object(
  {
    gameExpression: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    transferableSkill: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    industryApplications: t.Optional(
      t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }), {
        maxItems: SCHEMA_MAX_ITEMS_LARGE,
      }),
    ),
    evidence: t.Optional(
      t.Array(t.Record(t.String(), t.Unknown()), { maxItems: SCHEMA_MAX_ITEMS_LARGE }),
    ),
    confidence: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
    category: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
    demandLevel: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
    aiGenerated: t.Optional(t.Boolean()),
  },
  { required: ["gameExpression", "transferableSkill"] },
);
export type SkillMappingCreateRouteBody = Static<typeof skillMappingCreateBodySchema>;

export const skillMappingUpdateBodySchema = t.Object({
  gameExpression: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  transferableSkill: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  industryApplications: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }), {
      maxItems: SCHEMA_MAX_ITEMS_LARGE,
    }),
  ),
  evidence: t.Optional(
    t.Array(t.Record(t.String(), t.Unknown()), { maxItems: SCHEMA_MAX_ITEMS_LARGE }),
  ),
  confidence: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
  category: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  demandLevel: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  aiGenerated: t.Optional(t.Boolean()),
});
export type SkillMappingUpdateRouteBody = Static<typeof skillMappingUpdateBodySchema>;

export const skillAnalysisBodySchema = t.Object({
  gameExperience: t.Optional(t.Record(t.String(), t.Unknown())),
  resume: t.Optional(t.Record(t.String(), t.Unknown())),
  autoCreateMappings: t.Optional(t.Boolean()),
});
export type SkillAnalysisRouteBody = Static<typeof skillAnalysisBodySchema>;

export const skillReadinessQuerySchema = t.Object({
  jobId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
});
export type SkillReadinessRouteQuery = Static<typeof skillReadinessQuerySchema>;

const nullableStringSchema = t.Union([t.String(), t.Null()]);
const nullableNumberSchema = t.Union([t.Number(), t.Null()]);
const nullableBooleanSchema = t.Union([t.Boolean(), t.Null()]);
const nullableStringArraySchema = t.Union([t.Array(t.String()), t.Null()]);
const nullableUnknownArraySchema = t.Union([t.Array(t.Unknown()), t.Null()]);

export const skillMappingRowResponseSchema = t.Object({
  id: t.String(),
  gameExpression: t.String(),
  transferableSkill: t.String(),
  industryApplications: nullableStringArraySchema,
  evidence: nullableUnknownArraySchema,
  confidence: nullableNumberSchema,
  category: nullableStringSchema,
  demandLevel: nullableStringSchema,
  aiGenerated: nullableBooleanSchema,
  createdAt: t.String(),
  updatedAt: t.String(),
});

export const skillEvidenceResponseSchema = t.Object({
  id: t.String(),
  type: t.String(),
  title: t.String(),
  description: t.String(),
  url: t.Optional(t.String()),
  verificationStatus: t.String(),
});

export const skillMappingResponseSchema = t.Object({
  id: t.String(),
  gameExpression: t.String(),
  transferableSkill: t.String(),
  industryApplications: t.Array(t.String()),
  evidenceSuggestions: t.Optional(t.Array(t.String())),
  evidence: t.Array(skillEvidenceResponseSchema),
  confidence: t.Number(),
  category: t.String(),
  demandLevel: t.String(),
  verified: t.Boolean(),
  aiGenerated: t.Optional(t.Boolean()),
});

const pathwayStageResponseSchema = t.Object({
  title: t.String(),
  duration: t.String(),
  description: t.String(),
  completed: t.Optional(t.Boolean()),
  current: t.Optional(t.Boolean()),
  requirements: t.Optional(t.Array(t.String())),
  outcomes: t.Optional(t.Array(t.String())),
});

export const careerPathwayResponseSchema = t.Object({
  id: t.String(),
  title: t.String(),
  description: t.String(),
  detailedDescription: t.Optional(t.String()),
  matchScore: t.Number(),
  stages: t.Array(pathwayStageResponseSchema),
  requiredSkills: t.Array(t.String()),
  estimatedTimeToEntry: t.String(),
  icon: t.Optional(t.String()),
  averageSalary: t.Optional(
    t.Object({
      min: t.Number(),
      max: t.Number(),
      currency: t.Optional(t.String()),
    }),
  ),
  jobMarketTrend: t.String(),
});

const categoryAssessmentResponseSchema = t.Object({
  score: t.Number(),
  feedbackId: t.String(),
  strengths: t.Optional(t.Array(t.String())),
  improvements: t.Optional(t.Array(t.String())),
});

const roleReadinessResponseSchema = t.Object({
  roleId: t.String(),
  roleTitle: t.String(),
  readinessScore: t.Number(),
  missingSkills: t.Array(t.String()),
  matchingSkills: t.Array(t.String()),
  timeToReady: t.Optional(t.String()),
  recommendedActions: t.Array(t.String()),
});

export const skillReadinessResponseSchema = t.Object({
  overallScore: t.Number(),
  categories: t.Object({
    technical: categoryAssessmentResponseSchema,
    softSkills: categoryAssessmentResponseSchema,
    industryKnowledge: categoryAssessmentResponseSchema,
    portfolio: categoryAssessmentResponseSchema,
  }),
  improvementSuggestions: t.Array(t.String()),
  nextSteps: t.Array(t.String()),
  targetRoleReadiness: t.Optional(t.Array(roleReadinessResponseSchema)),
  jobId: t.Optional(t.String()),
});

export const skillAnalysisResponseSchema = t.Object({
  message: t.String(),
  detectedSkills: t.Array(t.String()),
  suggestedMappings: t.Array(t.Record(t.String(), t.Unknown())),
  recommendations: t.Array(t.String()),
  provider: t.Optional(t.String()),
});

export const skillMappingDeleteResponseSchema = t.Object({
  message: t.String(),
  id: t.String(),
});

export const skillMappingsListResponses = {
  [HTTP_STATUS_OK]: t.Array(skillMappingRowResponseSchema),
};

export const skillMappingCreateResponses = {
  [HTTP_STATUS_CREATED]: skillMappingResponseSchema,
};

export const skillMappingUpdateResponses = {
  [HTTP_STATUS_OK]: skillMappingResponseSchema,
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
};

export const skillMappingDeleteResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
  [HTTP_STATUS_GONE]: t.Unknown(),
  [HTTP_STATUS_NOT_FOUND]: t.Unknown(),
};

export const skillPathwaysResponses = {
  [HTTP_STATUS_OK]: t.Array(careerPathwayResponseSchema),
};

export const skillReadinessResponses = {
  [HTTP_STATUS_OK]: skillReadinessResponseSchema,
};

export const skillAnalysisResponses = {
  [HTTP_STATUS_OK]: skillAnalysisResponseSchema,
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: skillAnalysisResponseSchema,
};
