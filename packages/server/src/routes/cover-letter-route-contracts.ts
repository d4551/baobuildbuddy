import type { Static } from "typebox";
import { COVER_LETTER_TEMPLATE_OPTIONS } from "@bao/shared/constants/cover-letter";
import {
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_MICRO,
  SCHEMA_MAX_LENGTH_SHORT,
} from "@bao/shared/constants/schema-limits";
import { t } from "elysia";

export type GenerateCoverLetterBody = {
  company: string;
  position: string;
  jobInfo?: Record<string, unknown>;
  resumeId?: string;
  template?: string;
  save?: boolean;
};

export const coverLetterTemplateBodySchema = t.Union(
  COVER_LETTER_TEMPLATE_OPTIONS.map((template) => t.Literal(template)),
);

export const coverLetterIdParamsSchema = t.Object(
  {
    id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["id"] },
);
export type CoverLetterIdParams = Static<typeof coverLetterIdParamsSchema>;

export const coverLetterMutationBodySchema = t.Object(
  {
    company: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    position: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    jobInfo: t.Optional(t.Record(t.String(), t.Unknown())),
    content: t.Optional(t.Record(t.String(), t.Unknown())),
    template: t.Optional(coverLetterTemplateBodySchema),
  },
  { required: ["company", "position"] },
);
export type CoverLetterMutationBody = Static<typeof coverLetterMutationBodySchema>;

export const coverLetterUpdateBodySchema = t.Object({
  company: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  position: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  jobInfo: t.Optional(t.Record(t.String(), t.Unknown())),
  content: t.Optional(t.Record(t.String(), t.Unknown())),
  template: t.Optional(coverLetterTemplateBodySchema),
});
export type CoverLetterUpdateBody = Static<typeof coverLetterUpdateBodySchema>;

export const generateCoverLetterBodySchema = t.Object(
  {
    company: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    position: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    jobInfo: t.Optional(t.Record(t.String(), t.Unknown())),
    resumeId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
    template: t.Optional(coverLetterTemplateBodySchema),
    save: t.Optional(t.Boolean()),
  },
  { required: ["company", "position"] },
);
export type GenerateCoverLetterRouteBody = Static<typeof generateCoverLetterBodySchema>;

export const coverLetterExportBodySchema = t.Object({
  format: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MICRO })),
});
export type CoverLetterExportBody = Static<typeof coverLetterExportBodySchema>;
