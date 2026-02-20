import { generateId } from "@bao/shared";
import { desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { studios } from "../db/schema/studios";

export const studioRoutes = new Elysia({ prefix: "/studios" })
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
      query: t.Object({
        q: t.Optional(t.String({ maxLength: 200 })),
        type: t.Optional(t.String({ maxLength: 50 })),
        size: t.Optional(t.String({ maxLength: 50 })),
        remoteWork: t.Optional(t.String({ maxLength: 10 })),
      }),
    },
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      const rows = await db.select().from(studios).where(eq(studios.id, params.id));
      if (rows.length === 0) {
        set.status = 404;
        return { error: "Studio not found" };
      }
      return rows[0];
    },
    {
      params: t.Object({
        id: t.String({ maxLength: 100 }),
      }),
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
        remoteWork: body.remoteWork || false,
        technologies: body.technologies || [],
        genres: body.genres || [],
        platforms: body.platforms || [],
        culture: body.culture || null,
        benefits: body.benefits || [],
        socialMedia: body.socialMedia || null,
        notableGames: body.notableGames || [],
      };

      await db.insert(studios).values(newStudio);
      set.status = 201;
      return newStudio;
    },
    {
      body: t.Object({
        name: t.String({ maxLength: 200 }),
        description: t.Optional(t.String({ maxLength: 5000 })),
        website: t.Optional(t.String({ maxLength: 500 })),
        location: t.Optional(t.String({ maxLength: 200 })),
        type: t.Optional(t.String({ maxLength: 50 })),
        size: t.Optional(t.String({ maxLength: 50 })),
        founded: t.Optional(t.String({ maxLength: 10 })),
        remoteWork: t.Optional(t.Boolean()),
        technologies: t.Optional(t.Array(t.String({ maxLength: 100 }), { maxItems: 50 })),
        genres: t.Optional(t.Array(t.String({ maxLength: 100 }), { maxItems: 30 })),
        platforms: t.Optional(t.Array(t.String({ maxLength: 100 }), { maxItems: 20 })),
        culture: t.Optional(t.Record(t.String(), t.Unknown())),
        benefits: t.Optional(t.Array(t.String({ maxLength: 200 }), { maxItems: 30 })),
        socialMedia: t.Optional(t.Record(t.String(), t.String())),
        notableGames: t.Optional(t.Array(t.String({ maxLength: 200 }), { maxItems: 50 })),
      }),
    },
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const existing = await db.select().from(studios).where(eq(studios.id, params.id));
      if (existing.length === 0) {
        set.status = 404;
        return { error: "Studio not found" };
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
      params: t.Object({ id: t.String({ maxLength: 100 }) }),
      body: t.Object({
        name: t.Optional(t.String({ maxLength: 200 })),
        description: t.Optional(t.String({ maxLength: 5000 })),
        website: t.Optional(t.String({ maxLength: 500 })),
        location: t.Optional(t.String({ maxLength: 200 })),
        type: t.Optional(t.String({ maxLength: 50 })),
        size: t.Optional(t.String({ maxLength: 50 })),
        founded: t.Optional(t.String({ maxLength: 10 })),
        remoteWork: t.Optional(t.Boolean()),
        technologies: t.Optional(t.Array(t.String({ maxLength: 100 }), { maxItems: 50 })),
        genres: t.Optional(t.Array(t.String({ maxLength: 100 }), { maxItems: 30 })),
        platforms: t.Optional(t.Array(t.String({ maxLength: 100 }), { maxItems: 20 })),
        culture: t.Optional(t.Record(t.String(), t.Unknown())),
        benefits: t.Optional(t.Array(t.String({ maxLength: 200 }), { maxItems: 30 })),
        socialMedia: t.Optional(t.Record(t.String(), t.String())),
        notableGames: t.Optional(t.Array(t.String({ maxLength: 200 }), { maxItems: 50 })),
      }),
    },
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      const existing = await db.select().from(studios).where(eq(studios.id, params.id));
      if (existing.length === 0) {
        set.status = 404;
        return { error: "Studio not found" };
      }

      await db.delete(studios).where(eq(studios.id, params.id));
      return { message: "Studio deleted", id: params.id };
    },
    {
      params: t.Object({ id: t.String({ maxLength: 100 }) }),
    },
  )
  .get("/analytics", async () => {
    const allStudios = await db.select().from(studios);

    const analytics = {
      totalStudios: allStudios.length,
      byType: {} as Record<string, number>,
      bySize: {} as Record<string, number>,
      remoteWorkStudios: allStudios.filter((s) => s.remoteWork === true).length,
      topTechnologies: [] as Array<{ name: string; count: number }>,
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
