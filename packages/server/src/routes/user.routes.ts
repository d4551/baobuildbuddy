import { t, Elysia } from "elysia";
import { API_ERROR_USER_PROFILE_NOT_FOUND } from "@bao/shared/constants/api-errors";
import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_NOT_FOUND, HTTP_STATUS_OK } from "@bao/shared/constants/http";
import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { userProfile } from "../db/schema/user";
import { simpleRouteErrorResponses } from "./route-error-envelope";
import {
  type UserProfileUpdateRouteBody,
  userProfileUpdateBodySchema,
} from "./user-route-contracts";

const userProfileResponseSchema = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.Union([t.String(), t.Null()]),
  phone: t.Union([t.String(), t.Null()]),
  location: t.Union([t.String(), t.Null()]),
  website: t.Union([t.String(), t.Null()]),
  linkedin: t.Union([t.String(), t.Null()]),
  github: t.Union([t.String(), t.Null()]),
  summary: t.Union([t.String(), t.Null()]),
  currentRole: t.Union([t.String(), t.Null()]),
  currentCompany: t.Union([t.String(), t.Null()]),
  yearsExperience: t.Union([t.Number(), t.Null()]),
  technicalSkills: t.Array(t.String()),
  softSkills: t.Array(t.String()),
  gamingExperience: t.Record(t.String(), t.Unknown()),
  careerGoals: t.Record(t.String(), t.Unknown()),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export const userRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.userBase),
})
  .get(
    toApiChildPath(API_ENDPOINTS.userBase, API_ENDPOINTS.userProfile),
    { detail: { tags: ["User"] }, response: {
        [HTTP_STATUS_OK]: userProfileResponseSchema,
        ...simpleRouteErrorResponses,
      },
    },
    async ({ status }) => {
      const rows = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.id, DEFAULT_PROFILE_ID));
      if (rows.length === 0) {
        return status(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_USER_PROFILE_NOT_FOUND });
      }
      return status(HTTP_STATUS_OK, rows[0]);
    },
  )
  .put(
    toApiChildPath(API_ENDPOINTS.userBase, API_ENDPOINTS.userProfile),
    {
      detail: { tags: ["User"] },
      body: userProfileUpdateBodySchema,
      response: {
        [HTTP_STATUS_OK]: userProfileResponseSchema,
        ...simpleRouteErrorResponses,
      },
    },
    async ({ body, status }) => {
      const existing = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.id, DEFAULT_PROFILE_ID));
      if (existing.length === 0) {
        await db.insert(userProfile).values({ id: DEFAULT_PROFILE_ID, ...body });
      } else {
        await db
          .update(userProfile)
          .set({ ...body, updatedAt: new Date().toISOString() })
          .where(eq(userProfile.id, DEFAULT_PROFILE_ID));
      }
      const updated = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.id, DEFAULT_PROFILE_ID));
      return status(HTTP_STATUS_OK, updated[0]);
    },
  );
