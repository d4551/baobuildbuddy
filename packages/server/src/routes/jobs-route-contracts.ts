import type { Static } from "typebox";
import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
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

export const jobEntityResponseSchema = t.Object({
  id: t.String(),
  title: t.String(),
  company: t.String(),
  location: t.String(),
  remote: t.Optional(t.Union([t.Boolean(), t.Null()])),
  hybrid: t.Optional(t.Union([t.Boolean(), t.Null()])),
  salary: t.Optional(t.Union([t.Record(t.String(), t.Unknown()), t.Null()])),
  description: t.Optional(t.Union([t.String(), t.Null()])),
  requirements: t.Optional(t.Union([t.Array(t.String()), t.Null()])),
  technologies: t.Optional(t.Union([t.Array(t.String()), t.Null()])),
  experienceLevel: t.Optional(t.Union([t.String(), t.Null()])),
  type: t.Optional(t.Union([t.String(), t.Null()])),
  postedDate: t.Optional(t.Union([t.String(), t.Null()])),
  url: t.Optional(t.Union([t.String(), t.Null()])),
  source: t.Optional(t.Union([t.String(), t.Null()])),
  studioType: t.Optional(t.Union([t.String(), t.Null()])),
  gameGenres: t.Optional(t.Union([t.Array(t.String()), t.Null()])),
  platforms: t.Optional(t.Union([t.Array(t.String()), t.Null()])),
  contentHash: t.Optional(t.Union([t.String(), t.Null()])),
  tags: t.Optional(t.Union([t.Array(t.String()), t.Null()])),
  companyLogo: t.Optional(t.Union([t.String(), t.Null()])),
  applicationUrl: t.Optional(t.Union([t.String(), t.Null()])),
  enrichment: t.Optional(t.Union([t.Record(t.String(), t.Unknown()), t.Null()])),
  createdAt: t.Optional(t.String()),
  updatedAt: t.Optional(t.String()),
  matchScore: t.Optional(t.Number()),
  matchReason: t.Optional(t.String()),
  rank: t.Optional(t.Number()),
});

export const jobsListResponseSchema = t.Object({
  jobs: t.Array(jobEntityResponseSchema),
  page: t.Number(),
  limit: t.Number(),
  total: t.Number(),
});

export const savedJobResponseSchema = t.Object({
  id: t.String(),
  jobId: t.String(),
  savedAt: t.String(),
});

export const applicationResponseSchema = t.Object({
  id: t.String(),
  jobId: t.String(),
  status: t.String(),
  appliedDate: t.Optional(t.Union([t.String(), t.Null()])),
  notes: t.Optional(t.Union([t.String(), t.Null()])),
  timeline: t.Optional(t.Union([t.Array(t.Record(t.String(), t.Unknown())), t.Null()])),
});

export const jobsRefreshResponseSchema = t.Object({
  message: t.String(),
  status: t.String(),
  totalJobs: t.Number(),
  newJobs: t.Number(),
  updatedJobs: t.Number(),
});

export const jobsListResponses = {
  [HTTP_STATUS_OK]: jobsListResponseSchema,
} as const;

export const jobEntityResponses = {
  [HTTP_STATUS_OK]: jobEntityResponseSchema,
} as const;

export const saveJobResponses = {
  [HTTP_STATUS_OK]: t.Object({
    message: t.Optional(t.String()),
    saved: t.Optional(savedJobResponseSchema),
    id: t.Optional(t.String()),
    jobId: t.Optional(t.String()),
    savedAt: t.Optional(t.String()),
    error: t.Optional(t.String()),
  }),
  [HTTP_STATUS_CREATED]: savedJobResponseSchema,
} as const;

export const deleteSavedJobResponses = {
  [HTTP_STATUS_OK]: t.Object({
    success: t.Boolean(),
    deleted: t.Unknown(),
  }),
} as const;

export const savedJobsListResponses = {
  [HTTP_STATUS_OK]: t.Array(
    t.Object({
      id: t.String(),
      jobId: t.String(),
      savedAt: t.String(),
      job: t.Union([jobEntityResponseSchema, t.Null()]),
    }),
  ),
} as const;

export const applyJobResponses = {
  [HTTP_STATUS_OK]: t.Object({
    message: t.Optional(t.String()),
    application: t.Optional(applicationResponseSchema),
    id: t.Optional(t.String()),
    jobId: t.Optional(t.String()),
    status: t.Optional(t.String()),
    appliedDate: t.Optional(t.String()),
    notes: t.Optional(t.String()),
    timeline: t.Optional(t.Array(t.Record(t.String(), t.Unknown()))),
    error: t.Optional(t.String()),
  }),
  [HTTP_STATUS_CREATED]: applicationResponseSchema,
} as const;

export const updateApplicationResponses = {
  [HTTP_STATUS_OK]: applicationResponseSchema,
} as const;

export const applicationsListResponses = {
  [HTTP_STATUS_OK]: t.Array(applicationResponseSchema),
} as const;

export const recommendationsResponses = {
  [HTTP_STATUS_OK]: t.Object({
    recommendations: t.Array(jobEntityResponseSchema),
    reason: t.String(),
    aiPowered: t.Boolean(),
    provider: t.Optional(t.String()),
  }),
} as const;

export const jobsRefreshResponses = {
  [HTTP_STATUS_OK]: jobsRefreshResponseSchema,
} as const;

export { HTTP_STATUS_CREATED };
