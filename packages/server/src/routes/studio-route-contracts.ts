import {
  SCHEMA_MAX_ITEMS_LARGE,
  SCHEMA_MAX_ITEMS_MEDIUM,
  SCHEMA_MAX_ITEMS_SMALL,
  SCHEMA_MAX_LENGTH_DESCRIPTION,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LABEL,
  SCHEMA_MAX_LENGTH_SHORT,
  SCHEMA_MAX_LENGTH_TINY,
  SCHEMA_MAX_LENGTH_URL,
} from "@bao/shared/constants/schema-limits";
import Type, { type StaticParse } from "baobox";

export const studioListQuerySchema = Type.Object({
  q: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  type: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  size: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  remoteWork: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_TINY })),
});
export type StudioListRouteQuery = StaticParse<typeof studioListQuerySchema>;

export const studioIdParamsSchema = Type.Object(
  {
    id: Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["id"] },
);
export type StudioIdParams = StaticParse<typeof studioIdParamsSchema>;

export const studioMutationBodySchema = Type.Object(
  {
    name: Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    description: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
    website: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
    location: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
    type: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
    size: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
    founded: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_TINY })),
    remoteWork: Type.Optional(Type.Boolean()),
    technologies: Type.Optional(
      Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
        maxItems: SCHEMA_MAX_ITEMS_LARGE,
      }),
    ),
    genres: Type.Optional(
      Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
        maxItems: SCHEMA_MAX_ITEMS_MEDIUM,
      }),
    ),
    platforms: Type.Optional(
      Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
        maxItems: SCHEMA_MAX_ITEMS_SMALL,
      }),
    ),
    culture: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    benefits: Type.Optional(
      Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }), {
        maxItems: SCHEMA_MAX_ITEMS_MEDIUM,
      }),
    ),
    socialMedia: Type.Optional(Type.Record(Type.String(), Type.String())),
    notableGames: Type.Optional(
      Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }), {
        maxItems: SCHEMA_MAX_ITEMS_LARGE,
      }),
    ),
  },
  { required: ["name"] },
);
export type StudioMutationRouteBody = StaticParse<typeof studioMutationBodySchema>;

export const studioUpdateBodySchema = Type.Object({
  name: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  description: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
  website: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  location: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  type: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  size: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  founded: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_TINY })),
  remoteWork: Type.Optional(Type.Boolean()),
  technologies: Type.Optional(
    Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_LARGE,
    }),
  ),
  genres: Type.Optional(
    Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_MEDIUM,
    }),
  ),
  platforms: Type.Optional(
    Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_SMALL,
    }),
  ),
  culture: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  benefits: Type.Optional(
    Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }), {
      maxItems: SCHEMA_MAX_ITEMS_MEDIUM,
    }),
  ),
  socialMedia: Type.Optional(Type.Record(Type.String(), Type.String())),
  notableGames: Type.Optional(
    Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }), {
      maxItems: SCHEMA_MAX_ITEMS_LARGE,
    }),
  ),
});
export type StudioUpdateRouteBody = StaticParse<typeof studioUpdateBodySchema>;
