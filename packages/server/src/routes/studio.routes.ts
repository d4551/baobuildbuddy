import { API_ERROR_STUDIO_NOT_FOUND } from "@bao/shared/constants/api-errors";
import { API_MESSAGE_STUDIO_DELETED } from "@bao/shared/constants/api-messages";
import { HTTP_STATUS_CREATED, HTTP_STATUS_NOT_FOUND } from "@bao/shared/constants/http";
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
import { generateId } from "@bao/shared/utils/validation";
import { StandardSchemaV1 } from "baobox";
import { desc, eq } from "drizzle-orm";
import Type from "baobox";
import { Elysia } from "elysia";
import { db } from "../db/client";
import { studios } from "../db/schema/studios";

export interface StudioAnalytics {
  totalStudios: number;
  byType: Record<string, number>;
  bySize: Record<string, number>;
  remoteWorkStudios: number;
  topTechnologies: Array<{ name: string; count: number }>;
}

export const studioRoutes = new Elysia({ prefix: "/studios", tags: ["Studios"] })
  .get(
    "/",
    async ({ query }) => {
      const { q = "", type, size, remoteWork } = query;

      let results = await db.select().from(studios).orderBy(desc(studios.createdAt));

      // Filter by search query
      if (q) {
        results = results.filter(
          (studio) =>
            studio.name?.toLowerCase().includes(q.toLowerCase()) ||
            studio.description?.toLowerCase().includes(q.toLowerCase()) ||
            studio.location?.toLowerCase().includes(q.toLowerCase()),
        );
      }

      // Filter by type
      if (type) {
        results = results.filter((studio) => studio.type === type);
      }

      // Filter by size
      if (size) {
        results = results.filter((studio) => studio.size === size);
      }

      // Filter by remote work
      if (remoteWork === "true") {
        results = results.filter((studio) => studio.remoteWork === true);
      } else if (remoteWork === "false") {
        results = results.filter((studio) => studio.remoteWork === false);
      }

      return results;
    },
    {
      query: StandardSchemaV1(
        Type.Object({
          q: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
          type: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
          size: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
          remoteWork: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_TINY })),
        }),
      ),
    },
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      const rows = await db.select().from(studios).where(eq(studios.id, params.id));
      if (rows.length === 0) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_STUDIO_NOT_FOUND };
      }
      return rows[0];
    },
    {
      params: StandardSchemaV1(
        Type.Object(
          {
            id: Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
          },
          { required: ["id"] },
        ),
      ),
    },
  )
  .post(
    "/",
    async ({ body, set }) => {
      const newStudio = {
        id: generateId(),
        name: body.name,
        description: body.description || null,
        website: body.website || null,
        location: body.location || null,
        type: body.type || null,
        size: body.size || null,
        founded: body.founded || null,
        remoteWork: body.remoteWork,
        technologies: body.technologies || [],
        genres: body.genres || [],
        platforms: body.platforms || [],
        culture: body.culture || null,
        benefits: body.benefits || [],
        socialMedia: body.socialMedia || null,
        notableGames: body.notableGames || [],
      };

      await db.insert(studios).values(newStudio);
      set.status = HTTP_STATUS_CREATED;
      return newStudio;
    },
    {
      body: StandardSchemaV1(
        Type.Object(
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
        ),
      ),
    },
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const existing = await db.select().from(studios).where(eq(studios.id, params.id));
      if (existing.length === 0) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_STUDIO_NOT_FOUND };
      }

      const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
      for (const [key, val] of Object.entries(body)) {
        if (val !== undefined) updates[key] = val;
      }

      await db.update(studios).set(updates).where(eq(studios.id, params.id));
      const updated = await db.select().from(studios).where(eq(studios.id, params.id));
      return updated[0];
    },
    {
      params: StandardSchemaV1(
        Type.Object({ id: Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }) }, { required: ["id"] }),
      ),
      body: StandardSchemaV1(
        Type.Object({
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
        }),
      ),
    },
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      const existing = await db.select().from(studios).where(eq(studios.id, params.id));
      if (existing.length === 0) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_STUDIO_NOT_FOUND };
      }

      await db.delete(studios).where(eq(studios.id, params.id));
      return { message: API_MESSAGE_STUDIO_DELETED, id: params.id };
    },
    {
      params: StandardSchemaV1(
        Type.Object({ id: Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }) }, { required: ["id"] }),
      ),
    },
  )
  .get("/analytics", async (): Promise<StudioAnalytics> => {
    const allStudios = await db.select().from(studios);

    const analytics: StudioAnalytics = {
      totalStudios: allStudios.length,
      byType: {},
      bySize: {},
      remoteWorkStudios: allStudios.filter((s) => s.remoteWork === true).length,
      topTechnologies: [],
    };

    // Count by type
    for (const studio of allStudios) {
      if (studio.type) {
        analytics.byType[studio.type] = (analytics.byType[studio.type] || 0) + 1;
      }
    }

    // Count by size
    for (const studio of allStudios) {
      if (studio.size) {
        analytics.bySize[studio.size] = (analytics.bySize[studio.size] || 0) + 1;
      }
    }

    // Count technologies
    const techCount: Record<string, number> = {};
    for (const studio of allStudios) {
      if (studio.technologies) {
        for (const tech of studio.technologies) {
          techCount[tech] = (techCount[tech] || 0) + 1;
        }
      }
    }

    analytics.topTechnologies = Object.entries(techCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return analytics;
  });
