import type { Static } from "typebox";
import { HTTP_STATUS_CREATED } from "@bao/shared/constants/http";
import {
  SCHEMA_MAX_LENGTH_DESCRIPTION,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LABEL,
  SCHEMA_MAX_LENGTH_SHORT,
  SCHEMA_MAX_LENGTH_TINY,
} from "@bao/shared/constants/schema-limits";
import { t } from "elysia";

export type JobListQuery = {
  q?: string;
  location?: string;
  remote?: string;
  experienceLevel?: string;
  studioType?: string;
  platform?: string;
  genre?: string;
  page?: string;
  limit?: string;
};

export const jobsListQuerySchema = t.Object({
  q: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  location: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  remote: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_TINY })),
  experienceLevel: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  studioType: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  platform: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  genre: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  page: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_TINY })),
  limit: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_TINY })),
});

export const jobIdParamsSchema = t.Object(
  {
    id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["id"] },
);
export type JobIdParams = Static<typeof jobIdParamsSchema>;

export const saveJobBodySchema = t.Object(
  {
    jobId: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["jobId"] },
);
export type SaveJobBody = Static<typeof saveJobBodySchema>;

export const savedJobParamsSchema = t.Object(
  {
    jobId: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["jobId"] },
);
export type SavedJobParams = Static<typeof savedJobParamsSchema>;

export const applyJobBodySchema = t.Object(
  {
    jobId: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
    notes: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
  },
  { required: ["jobId"] },
);
export type ApplyJobBody = Static<typeof applyJobBodySchema>;

export const updateApplicationParamsSchema = t.Object(
  {
    id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["id"] },
);
export type UpdateApplicationParams = Static<typeof updateApplicationParamsSchema>;

export const updateApplicationBodySchema = t.Object({
  status: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  notes: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
});
export type UpdateApplicationBody = Static<typeof updateApplicationBodySchema>;

export { HTTP_STATUS_CREATED };
