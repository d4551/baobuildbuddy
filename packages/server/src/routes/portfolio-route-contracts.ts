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
import Type, { type StaticParse } from "baobox";

export type PortfolioMetadataRecord = PortfolioMetadata;

export const portfolioUpdateBodySchema = Type.Object(
  {
    metadata: Type.Record(Type.String(), Type.Unknown()),
  },
  { required: ["metadata"] },
);
export type PortfolioUpdateRouteBody = StaticParse<typeof portfolioUpdateBodySchema>;

export const portfolioProjectCreateBodySchema = Type.Object(
  {
    title: Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    description: Type.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION }),
    technologies: Type.Optional(
      Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
        maxItems: SCHEMA_MAX_ITEMS_LARGE,
      }),
    ),
    image: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
    liveUrl: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
    githubUrl: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
    tags: Type.Optional(
      Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }), {
        maxItems: SCHEMA_MAX_ITEMS_MEDIUM,
      }),
    ),
    featured: Type.Optional(Type.Boolean()),
    role: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
    platforms: Type.Optional(
      Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }), {
        maxItems: SCHEMA_MAX_ITEMS_SMALL,
      }),
    ),
    engines: Type.Optional(
      Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }), {
        maxItems: SCHEMA_MAX_ITEMS_SMALL,
      }),
    ),
    sortOrder: Type.Optional(Type.Number()),
  },
  { required: ["title", "description"] },
);
export type PortfolioProjectCreateRouteBody = StaticParse<typeof portfolioProjectCreateBodySchema>;

export const portfolioProjectReorderBodySchema = Type.Object(
  {
    orderedIds: Type.Array(Type.String({ minLength: 1 })),
  },
  { required: ["orderedIds"] },
);
export type PortfolioProjectReorderRouteBody = StaticParse<
  typeof portfolioProjectReorderBodySchema
>;

export const portfolioProjectIdParamsSchema = Type.Object(
  {
    id: Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["id"] },
);
export type PortfolioProjectIdParams = StaticParse<typeof portfolioProjectIdParamsSchema>;

export const portfolioProjectUpdateBodySchema = Type.Object({
  title: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  description: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
  technologies: Type.Optional(
    Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_LARGE,
    }),
  ),
  image: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  liveUrl: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  githubUrl: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  tags: Type.Optional(
    Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }), {
      maxItems: SCHEMA_MAX_ITEMS_MEDIUM,
    }),
  ),
  featured: Type.Optional(Type.Boolean()),
  role: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  platforms: Type.Optional(
    Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }), {
      maxItems: SCHEMA_MAX_ITEMS_SMALL,
    }),
  ),
  engines: Type.Optional(
    Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }), {
      maxItems: SCHEMA_MAX_ITEMS_SMALL,
    }),
  ),
  sortOrder: Type.Optional(Type.Number()),
});
export type PortfolioProjectUpdateRouteBody = StaticParse<typeof portfolioProjectUpdateBodySchema>;

export const portfolioExportBodySchema = Type.Object({
  format: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_MICRO })),
});
export type PortfolioExportRouteBody = StaticParse<typeof portfolioExportBodySchema>;
