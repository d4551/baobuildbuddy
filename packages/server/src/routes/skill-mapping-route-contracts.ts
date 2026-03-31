import { SCHEMA_MAX_ITEMS_LARGE, SCHEMA_MAX_LENGTH_ID, SCHEMA_MAX_LENGTH_LABEL, SCHEMA_MAX_LENGTH_SHORT } from "@bao/shared/constants/schema-limits";
import Type from "baobox";

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

export const skillMappingsQuerySchema = Type.Object({
  category: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  search: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
});

export const skillMappingIdParamsSchema = Type.Object(
  {
    id: Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["id"] },
);

export const skillMappingCreateBodySchema = Type.Object(
  {
    gameExpression: Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    transferableSkill: Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    industryApplications: Type.Optional(
      Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }), {
        maxItems: SCHEMA_MAX_ITEMS_LARGE,
      }),
    ),
    evidence: Type.Optional(
      Type.Array(Type.Record(Type.String(), Type.Unknown()), { maxItems: SCHEMA_MAX_ITEMS_LARGE }),
    ),
    confidence: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
    category: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
    demandLevel: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
    aiGenerated: Type.Optional(Type.Boolean()),
  },
  { required: ["gameExpression", "transferableSkill"] },
);

export const skillMappingUpdateBodySchema = Type.Object({
  gameExpression: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  transferableSkill: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  industryApplications: Type.Optional(
    Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }), {
      maxItems: SCHEMA_MAX_ITEMS_LARGE,
    }),
  ),
  evidence: Type.Optional(
    Type.Array(Type.Record(Type.String(), Type.Unknown()), { maxItems: SCHEMA_MAX_ITEMS_LARGE }),
  ),
  confidence: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
  category: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  demandLevel: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  aiGenerated: Type.Optional(Type.Boolean()),
});

export const skillAnalysisBodySchema = Type.Object({
  gameExperience: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  resume: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  autoCreateMappings: Type.Optional(Type.Boolean()),
});

export const skillReadinessQuerySchema = Type.Object({
  jobId: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
});
