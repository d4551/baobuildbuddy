import { HTTP_STATUS_CREATED } from "@bao/shared/constants/http";
import {
  SCHEMA_MAX_LENGTH_DESCRIPTION,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LABEL,
  SCHEMA_MAX_LENGTH_SHORT,
  SCHEMA_MAX_LENGTH_TINY,
} from "@bao/shared/constants/schema-limits";
import Type, { type StaticParse } from "baobox";

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

export const jobsListQuerySchema = Type.Object({
  q: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  location: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  remote: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_TINY })),
  experienceLevel: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  studioType: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  platform: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  genre: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  page: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_TINY })),
  limit: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_TINY })),
});

export const jobIdParamsSchema = Type.Object(
  {
    id: Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["id"] },
);
export type JobIdParams = StaticParse<typeof jobIdParamsSchema>;

export const saveJobBodySchema = Type.Object(
  {
    jobId: Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["jobId"] },
);
export type SaveJobBody = StaticParse<typeof saveJobBodySchema>;

export const savedJobParamsSchema = Type.Object(
  {
    jobId: Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["jobId"] },
);
export type SavedJobParams = StaticParse<typeof savedJobParamsSchema>;

export const applyJobBodySchema = Type.Object(
  {
    jobId: Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
    notes: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
  },
  { required: ["jobId"] },
);
export type ApplyJobBody = StaticParse<typeof applyJobBodySchema>;

export const updateApplicationParamsSchema = Type.Object(
  {
    id: Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["id"] },
);
export type UpdateApplicationParams = StaticParse<typeof updateApplicationParamsSchema>;

export const updateApplicationBodySchema = Type.Object({
  status: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  notes: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
});
export type UpdateApplicationBody = StaticParse<typeof updateApplicationBodySchema>;

export { HTTP_STATUS_CREATED };
