import type { Static } from "typebox";
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
