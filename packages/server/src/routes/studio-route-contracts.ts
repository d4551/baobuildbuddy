import type { Static } from "typebox";
import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import {
  SCHEMA_MAX_ITEMS_LARGE,
  SCHEMA_MAX_LENGTH_DESCRIPTION,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LABEL,
  SCHEMA_MAX_LENGTH_SHORT,
  SCHEMA_MAX_LENGTH_TINY,
  SCHEMA_MAX_LENGTH_URL,
} from "@bao/shared/constants/schema-limits";
import { t } from "elysia";
import { simpleErrorResponseSchema } from "./route-error-envelope";

export const studioListQuerySchema = t.Object({
  q: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  type: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  size: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  remoteWork: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_TINY })),
});
export type StudioListRouteQuery = Static<typeof studioListQuerySchema>;

export const studioIdParamsSchema = t.Object(
  {
    id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["id"] },
);
export type StudioIdParams = Static<typeof studioIdParamsSchema>;

export const studioMutationBodySchema = t.Object(
  {
    name: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    description: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
    website: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
    location: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
    type: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
    size: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
    remoteWork: t.Optional(t.Boolean()),
    technologies: t.Optional(
      t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
        maxItems: SCHEMA_MAX_ITEMS_LARGE,
      }),
    ),
    games: t.Optional(
      t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }), {
        maxItems: SCHEMA_MAX_ITEMS_LARGE,
      }),
    ),
    culture: t.Optional(t.Record(t.String(), t.Unknown())),
    interviewStyle: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
    logo: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  },
  { required: ["name"] },
);
export type StudioMutationRouteBody = Static<typeof studioMutationBodySchema>;

export const studioUpdateBodySchema = t.Object({
  name: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  description: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
  website: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  location: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  type: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  size: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  remoteWork: t.Optional(t.Boolean()),
  technologies: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_LARGE,
    }),
  ),
  games: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }), {
      maxItems: SCHEMA_MAX_ITEMS_LARGE,
    }),
  ),
  culture: t.Optional(t.Record(t.String(), t.Unknown())),
  interviewStyle: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
  logo: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
});
export type StudioUpdateRouteBody = Static<typeof studioUpdateBodySchema>;

export const studioEntityResponseSchema = t.Object({
  id: t.String(),
  name: t.String(),
  logo: t.Union([t.String(), t.Null()]),
  website: t.Union([t.String(), t.Null()]),
  location: t.Union([t.String(), t.Null()]),
  size: t.Union([t.String(), t.Null()]),
  type: t.Union([t.String(), t.Null()]),
  description: t.Union([t.String(), t.Null()]),
  games: t.Optional(t.Union([t.Array(t.String()), t.Null()])),
  technologies: t.Optional(t.Union([t.Array(t.String()), t.Null()])),
  culture: t.Optional(t.Union([t.Record(t.String(), t.Unknown()), t.Null()])),
  interviewStyle: t.Optional(t.Union([t.String(), t.Null()])),
  remoteWork: t.Optional(t.Union([t.Boolean(), t.Null()])),
  enrichment: t.Optional(t.Union([t.Record(t.String(), t.Unknown()), t.Null()])),
  createdAt: t.Optional(t.String()),
  updatedAt: t.Optional(t.String()),
});

export const studioDeleteResponseSchema = t.Object({
  message: t.String(),
  id: t.String(),
});

export const studioAnalyticsResponseSchema = t.Object({
  totalStudios: t.Number(),
  byType: t.Record(t.String(), t.Number()),
  bySize: t.Record(t.String(), t.Number()),
  remoteWorkStudios: t.Number(),
  topTechnologies: t.Array(
    t.Object({
      name: t.String(),
      count: t.Number(),
    }),
  ),
});

export const studioListResponses = {
  [HTTP_STATUS_OK]: t.Array(studioEntityResponseSchema),
} as const;

export const studioEntityResponses = {
  [HTTP_STATUS_OK]: studioEntityResponseSchema,
  [HTTP_STATUS_CREATED]: studioEntityResponseSchema,
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
} as const;

export const studioDeleteResponses = {
  [HTTP_STATUS_OK]: studioDeleteResponseSchema,
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
} as const;

export const studioAnalyticsResponses = {
  [HTTP_STATUS_OK]: studioAnalyticsResponseSchema,
} as const;
