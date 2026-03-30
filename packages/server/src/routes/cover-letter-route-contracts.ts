import {
  COVER_LETTER_TEMPLATE_OPTIONS,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_MICRO,
  SCHEMA_MAX_LENGTH_SHORT,
} from "@bao/shared";
import { t } from "elysia";

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

export const coverLetterTemplateBodySchema = t.String({
  enum: COVER_LETTER_TEMPLATE_OPTIONS,
});

export const coverLetterIdParamsSchema = t.Object({
  id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
});

export const coverLetterMutationBodySchema = t.Object({
  company: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  position: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  jobInfo: t.Optional(t.Record(t.String(), t.Unknown())),
  content: t.Optional(t.Record(t.String(), t.Unknown())),
  template: t.Optional(coverLetterTemplateBodySchema),
});

export const coverLetterUpdateBodySchema = t.Object({
  company: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  position: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  jobInfo: t.Optional(t.Record(t.String(), t.Unknown())),
  content: t.Optional(t.Record(t.String(), t.Unknown())),
  template: t.Optional(coverLetterTemplateBodySchema),
});

export const generateCoverLetterBodySchema = t.Object({
  company: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  position: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  jobInfo: t.Optional(t.Record(t.String(), t.Unknown())),
  resumeId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  template: t.Optional(coverLetterTemplateBodySchema),
  save: t.Optional(t.Boolean()),
});

export const coverLetterExportBodySchema = t.Object({
  format: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MICRO })),
});
