import type { Static } from "typebox";
import { COVER_LETTER_TEMPLATE_OPTIONS } from "@bao/shared/constants/cover-letter";
import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  HTTP_STATUS_SERVICE_UNAVAILABLE,
} from "@bao/shared/constants/http";
import {
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_MICRO,
  SCHEMA_MAX_LENGTH_SHORT,
} from "@bao/shared/constants/schema-limits";
import { t } from "elysia";
import { simpleErrorResponseSchema } from "./route-error-envelope";

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

export const coverLetterEntityResponseSchema = t.Object({
  id: t.String(),
  company: t.String(),
  position: t.String(),
  jobInfo: t.Optional(t.Union([t.Record(t.String(), t.Unknown()), t.Null()])),
  content: t.Optional(t.Union([t.Record(t.String(), t.Unknown()), t.Null()])),
  template: t.Optional(t.Union([t.String(), t.Null()])),
  createdAt: t.Optional(t.String()),
  updatedAt: t.Optional(t.String()),
});

export const coverLetterDeleteResponseSchema = t.Object({
  success: t.Boolean(),
  id: t.String(),
});

export const generatedCoverLetterContentResponseSchema = t.Object({
  introduction: t.String(),
  body: t.String(),
  conclusion: t.String(),
});

export const generateCoverLetterResponseSchema = t.Object({
  message: t.String(),
  content: generatedCoverLetterContentResponseSchema,
});

export const generateCoverLetterSavedResponseSchema = t.Object({
  message: t.String(),
  coverLetter: coverLetterEntityResponseSchema,
});

export const coverLettersListResponses = {
  [HTTP_STATUS_OK]: t.Array(coverLetterEntityResponseSchema),
};

export const coverLetterEntityResponses = {
  [HTTP_STATUS_OK]: coverLetterEntityResponseSchema,
  [HTTP_STATUS_CREATED]: coverLetterEntityResponseSchema,
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
};

export const coverLetterDeleteResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
  [HTTP_STATUS_NOT_FOUND]: t.Unknown(),
};

export const generateCoverLetterResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
  [HTTP_STATUS_CREATED]: t.Unknown(),
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: t.Unknown(),
  [HTTP_STATUS_SERVICE_UNAVAILABLE]: t.Unknown(),
};

export const coverLetterExportResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
  [HTTP_STATUS_NOT_FOUND]: t.Unknown(),
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: t.Unknown(),
};
