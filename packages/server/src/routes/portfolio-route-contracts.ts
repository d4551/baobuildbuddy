import type { Static } from "typebox";
import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import {
  SCHEMA_MAX_ITEMS_LARGE,
  SCHEMA_MAX_ITEMS_MEDIUM,
  SCHEMA_MAX_ITEMS_SMALL,
  SCHEMA_MAX_LENGTH_DESCRIPTION,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LABEL,
  SCHEMA_MAX_LENGTH_MICRO,
  SCHEMA_MAX_LENGTH_SHORT,
  SCHEMA_MAX_LENGTH_URL,
} from "@bao/shared/constants/schema-limits";
import type { PortfolioMetadata } from "@bao/shared/types/portfolio";
import { t } from "elysia";

export type PortfolioMetadataRecord = PortfolioMetadata;

export const portfolioUpdateBodySchema = t.Object(
  {
    metadata: t.Record(t.String(), t.Unknown()),
  },
  { required: ["metadata"] },
);
export type PortfolioUpdateRouteBody = Static<typeof portfolioUpdateBodySchema>;

export const portfolioProjectCreateBodySchema = t.Object(
  {
    title: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    description: t.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION }),
    technologies: t.Optional(
      t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
        maxItems: SCHEMA_MAX_ITEMS_LARGE,
      }),
    ),
    image: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
    liveUrl: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
    githubUrl: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
    tags: t.Optional(
      t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }), {
        maxItems: SCHEMA_MAX_ITEMS_MEDIUM,
      }),
    ),
    featured: t.Optional(t.Boolean()),
    role: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
    platforms: t.Optional(
      t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }), {
        maxItems: SCHEMA_MAX_ITEMS_SMALL,
      }),
    ),
    engines: t.Optional(
      t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }), {
        maxItems: SCHEMA_MAX_ITEMS_SMALL,
      }),
    ),
    sortOrder: t.Optional(t.Number()),
  },
  { required: ["title", "description"] },
);
export type PortfolioProjectCreateRouteBody = Static<typeof portfolioProjectCreateBodySchema>;

export const portfolioProjectReorderBodySchema = t.Object(
  {
    orderedIds: t.Array(t.String({ minLength: 1 })),
  },
  { required: ["orderedIds"] },
);
export type PortfolioProjectReorderRouteBody = Static<
  typeof portfolioProjectReorderBodySchema
>;

export const portfolioProjectIdParamsSchema = t.Object(
  {
    id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["id"] },
);
export type PortfolioProjectIdParams = Static<typeof portfolioProjectIdParamsSchema>;

export const portfolioProjectUpdateBodySchema = t.Object({
  title: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  description: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
  technologies: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_LARGE,
    }),
  ),
  image: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  liveUrl: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  githubUrl: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  tags: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }), {
      maxItems: SCHEMA_MAX_ITEMS_MEDIUM,
    }),
  ),
  featured: t.Optional(t.Boolean()),
  role: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  platforms: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }), {
      maxItems: SCHEMA_MAX_ITEMS_SMALL,
    }),
  ),
  engines: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }), {
      maxItems: SCHEMA_MAX_ITEMS_SMALL,
    }),
  ),
  sortOrder: t.Optional(t.Number()),
});
export type PortfolioProjectUpdateRouteBody = Static<typeof portfolioProjectUpdateBodySchema>;

export const portfolioExportBodySchema = t.Object({
  format: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MICRO })),
});
export type PortfolioExportRouteBody = Static<typeof portfolioExportBodySchema>;

export const portfolioProjectResponseSchema = t.Object({
  id: t.Optional(t.String()),
  portfolioId: t.Optional(t.String()),
  title: t.String(),
  description: t.String(),
  technologies: t.Optional(t.Union([t.Array(t.String()), t.Null()])),
  image: t.Optional(t.Union([t.String(), t.Null()])),
  liveUrl: t.Optional(t.Union([t.String(), t.Null()])),
  githubUrl: t.Optional(t.Union([t.String(), t.Null()])),
  tags: t.Optional(t.Union([t.Array(t.String()), t.Null()])),
  featured: t.Optional(t.Union([t.Boolean(), t.Null()])),
  role: t.Optional(t.Union([t.String(), t.Null()])),
  platforms: t.Optional(t.Union([t.Array(t.String()), t.Null()])),
  engines: t.Optional(t.Union([t.Array(t.String()), t.Null()])),
  sortOrder: t.Optional(t.Union([t.Number(), t.Null()])),
  createdAt: t.Optional(t.String()),
  updatedAt: t.Optional(t.String()),
});

export const portfolioResponseSchema = t.Object({
  id: t.Optional(t.String()),
  metadata: t.Optional(t.Record(t.String(), t.Unknown())),
  projects: t.Array(portfolioProjectResponseSchema),
  createdAt: t.Optional(t.String()),
  updatedAt: t.Optional(t.String()),
});

export const portfolioProjectDeleteResponseSchema = t.Object({
  success: t.Boolean(),
  id: t.String(),
});

export const portfolioResponses = {
  [HTTP_STATUS_OK]: portfolioResponseSchema,
};

export const portfolioMutationResponses = {
  [HTTP_STATUS_OK]: portfolioResponseSchema,
};

export const portfolioProjectMutationResponses = {
  [HTTP_STATUS_OK]: portfolioProjectResponseSchema,
  [HTTP_STATUS_CREATED]: portfolioProjectResponseSchema,
};

export const portfolioProjectReorderResponses = {
  [HTTP_STATUS_OK]: portfolioResponseSchema,
};

export const portfolioProjectDeleteResponses = {
  [HTTP_STATUS_OK]: portfolioProjectDeleteResponseSchema,
};

export const portfolioExportResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
};
