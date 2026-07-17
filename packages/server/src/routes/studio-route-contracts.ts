import type { Static } from "typebox";
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
import { t } from "elysia";

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
    founded: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_TINY })),
    remoteWork: t.Optional(t.Boolean()),
    technologies: t.Optional(
      t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
        maxItems: SCHEMA_MAX_ITEMS_LARGE,
      }),
    ),
    genres: t.Optional(
      t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
        maxItems: SCHEMA_MAX_ITEMS_MEDIUM,
      }),
    ),
    platforms: t.Optional(
      t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
        maxItems: SCHEMA_MAX_ITEMS_SMALL,
      }),
    ),
    culture: t.Optional(t.Record(t.String(), t.Unknown())),
    benefits: t.Optional(
      t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }), {
        maxItems: SCHEMA_MAX_ITEMS_MEDIUM,
      }),
    ),
    socialMedia: t.Optional(t.Record(t.String(), t.String())),
    notableGames: t.Optional(
      t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }), {
        maxItems: SCHEMA_MAX_ITEMS_LARGE,
      }),
    ),
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
  founded: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_TINY })),
  remoteWork: t.Optional(t.Boolean()),
  technologies: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_LARGE,
    }),
  ),
  genres: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_MEDIUM,
    }),
  ),
  platforms: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_SMALL,
    }),
  ),
  culture: t.Optional(t.Record(t.String(), t.Unknown())),
  benefits: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }), {
      maxItems: SCHEMA_MAX_ITEMS_MEDIUM,
    }),
  ),
  socialMedia: t.Optional(t.Record(t.String(), t.String())),
  notableGames: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }), {
      maxItems: SCHEMA_MAX_ITEMS_LARGE,
    }),
  ),
});
export type StudioUpdateRouteBody = Static<typeof studioUpdateBodySchema>;
