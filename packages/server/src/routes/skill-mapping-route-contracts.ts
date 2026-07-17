import type { Static } from "typebox";
import {
  SCHEMA_MAX_ITEMS_LARGE,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LABEL,
  SCHEMA_MAX_LENGTH_SHORT,
} from "@bao/shared/constants/schema-limits";
import { t } from "elysia";

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
