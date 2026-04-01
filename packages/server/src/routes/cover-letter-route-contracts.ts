import { COVER_LETTER_TEMPLATE_OPTIONS } from "@bao/shared/constants/cover-letter";
import {
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_MICRO,
  SCHEMA_MAX_LENGTH_SHORT,
} from "@bao/shared/constants/schema-limits";
import Type, { type StaticParse } from "baobox";

export type GenerateCoverLetterBody = {
  company: string;
  position: string;
  jobInfo?: Record<string, unknown>;
  resumeId?: string;
  template?: string;
  save?: boolean;
};

export type RouteSetState = {
  status?: number | string;
};

export const coverLetterTemplateBodySchema = Type.Union(
  COVER_LETTER_TEMPLATE_OPTIONS.map((template) => Type.Literal(template)),
);

export const coverLetterIdParamsSchema = Type.Object(
  {
    id: Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["id"] },
);
export type CoverLetterIdParams = StaticParse<typeof coverLetterIdParamsSchema>;

export const coverLetterMutationBodySchema = Type.Object(
  {
    company: Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    position: Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    jobInfo: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    content: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    template: Type.Optional(coverLetterTemplateBodySchema),
  },
  { required: ["company", "position"] },
);
export type CoverLetterMutationBody = StaticParse<typeof coverLetterMutationBodySchema>;

export const coverLetterUpdateBodySchema = Type.Object({
  company: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  position: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  jobInfo: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  content: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  template: Type.Optional(coverLetterTemplateBodySchema),
});
export type CoverLetterUpdateBody = StaticParse<typeof coverLetterUpdateBodySchema>;

export const generateCoverLetterBodySchema = Type.Object(
  {
    company: Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    position: Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    jobInfo: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    resumeId: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
    template: Type.Optional(coverLetterTemplateBodySchema),
    save: Type.Optional(Type.Boolean()),
  },
  { required: ["company", "position"] },
);
export type GenerateCoverLetterRouteBody = StaticParse<typeof generateCoverLetterBodySchema>;

export const coverLetterExportBodySchema = Type.Object({
  format: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_MICRO })),
});
export type CoverLetterExportBody = StaticParse<typeof coverLetterExportBodySchema>;
