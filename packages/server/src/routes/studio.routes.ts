import { API_ERROR_STUDIO_NOT_FOUND } from "@bao/shared/constants/api-errors";
import { API_MESSAGE_STUDIO_DELETED } from "@bao/shared/constants/api-messages";
import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { generateId } from "@bao/shared/utils/validation";
import { desc, eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { db } from "../db/client";
import { studios } from "../db/schema/studios";
import {
  studioAnalyticsResponses,
  studioIdParamsSchema,
  studioDeleteResponses,
  studioEntityResponses,
  studioListQuerySchema,
  studioListResponses,
  studioMutationBodySchema,
  studioUpdateBodySchema,
} from "./studio-route-contracts";

export interface StudioAnalytics {
  totalStudios: number;
  byType: Record<string, number>;
  bySize: Record<string, number>;
  remoteWorkStudios: number;
  topTechnologies: Array<{ name: string; count: number }>;
}

export const studioRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.studiosBase),
})
  .get(
    "/",
    {
      detail: { tags: ["Studios"] },
      query: studioListQuerySchema,
      response: studioListResponses,
    },
    async ({ query, status }) => {
      const { q = "", type, size, remoteWork } = query;

      let results = await db.select().from(studios).orderBy(desc(studios.createdAt));

      if (q) {
        results = results.filter(
          (studio) =>
            studio.name?.toLowerCase().includes(q.toLowerCase()) ||
            studio.description?.toLowerCase().includes(q.toLowerCase()) ||
            studio.location?.toLowerCase().includes(q.toLowerCase()),
        );
      }

      if (type) {
        results = results.filter((studio) => studio.type === type);
      }

      if (size) {
        results = results.filter((studio) => studio.size === size);
      }

      if (remoteWork === "true") {
        results = results.filter((studio) => studio.remoteWork === true);
      } else if (remoteWork === "false") {
        results = results.filter((studio) => studio.remoteWork === false);
      }

      return status(HTTP_STATUS_OK, results);
    },
  )
  .get(
    "/analytics",
    {
      detail: { tags: ["Studios"] },
      response: studioAnalyticsResponses,
    },
    async ({ status }) => {
      const allStudios = await db.select().from(studios);

      const analytics: StudioAnalytics = {
        totalStudios: allStudios.length,
        byType: {},
        bySize: {},
        remoteWorkStudios: allStudios.filter((studio) => studio.remoteWork === true).length,
        topTechnologies: [],
      };

      for (const studio of allStudios) {
        if (studio.type) {
          analytics.byType[studio.type] = (analytics.byType[studio.type] || 0) + 1;
        }
      }

      for (const studio of allStudios) {
        if (studio.size) {
          analytics.bySize[studio.size] = (analytics.bySize[studio.size] || 0) + 1;
        }
      }

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
        .sort((left, right) => right.count - left.count)
        .slice(0, 10);

      return status(HTTP_STATUS_OK, analytics);
    },
  )
  .get(
    "/:id",
    {
      detail: { tags: ["Studios"] },
      params: studioIdParamsSchema,
      response: studioEntityResponses,
    },
    async ({ params, status }) => {
      const rows = await db.select().from(studios).where(eq(studios.id, params.id));
      if (rows.length === 0) {
        return status(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_STUDIO_NOT_FOUND });
      }
      return status(HTTP_STATUS_OK, rows[0]);
    },
  )
  .post(
    "/",
    {
      detail: { tags: ["Studios"] },
      body: studioMutationBodySchema,
      response: studioEntityResponses,
    },
    async ({ body, status }) => {
      const newStudio = {
        id: generateId(),
        name: body.name,
        description: body.description ?? null,
        website: body.website ?? null,
        location: body.location ?? null,
        type: body.type ?? null,
        size: body.size ?? null,
        remoteWork: body.remoteWork,
        technologies: body.technologies ?? [],
        games: body.games ?? [],
        culture: body.culture ?? null,
        interviewStyle: body.interviewStyle ?? null,
        logo: body.logo ?? null,
      };

      await db.insert(studios).values(newStudio);
      return status(HTTP_STATUS_CREATED, newStudio);
    },
  )
  .put(
    "/:id",
    {
      detail: { tags: ["Studios"] },
      params: studioIdParamsSchema,
      body: studioUpdateBodySchema,
      response: studioEntityResponses,
    },
    async ({ params, body, status }) => {
      const existing = await db.select().from(studios).where(eq(studios.id, params.id));
      if (existing.length === 0) {
        return status(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_STUDIO_NOT_FOUND });
      }

      const updates: Partial<typeof studios.$inferInsert> = { updatedAt: new Date().toISOString() };
      if (body.name !== undefined) updates.name = body.name;
      if (body.description !== undefined) updates.description = body.description;
      if (body.website !== undefined) updates.website = body.website;
      if (body.location !== undefined) updates.location = body.location;
      if (body.type !== undefined) updates.type = body.type;
      if (body.size !== undefined) updates.size = body.size;
      if (body.remoteWork !== undefined) updates.remoteWork = body.remoteWork;
      if (body.technologies !== undefined) updates.technologies = body.technologies;
      if (body.games !== undefined) updates.games = body.games;
      if (body.culture !== undefined) updates.culture = body.culture;
      if (body.interviewStyle !== undefined) updates.interviewStyle = body.interviewStyle;
      if (body.logo !== undefined) updates.logo = body.logo;

      await db.update(studios).set(updates).where(eq(studios.id, params.id));
      const updated = await db.select().from(studios).where(eq(studios.id, params.id));
      return status(HTTP_STATUS_OK, updated[0]);
    },
  )
  .delete(
    "/:id",
    {
      detail: { tags: ["Studios"] },
      params: studioIdParamsSchema,
      response: studioDeleteResponses,
    },
    async ({ params, status }) => {
      const existing = await db.select().from(studios).where(eq(studios.id, params.id));
      if (existing.length === 0) {
        return status(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_STUDIO_NOT_FOUND });
      }

      await db.delete(studios).where(eq(studios.id, params.id));
      return status(HTTP_STATUS_OK, { message: API_MESSAGE_STUDIO_DELETED, id: params.id });
    },
  );
