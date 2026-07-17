import { Elysia } from "elysia";
import { API_ERROR_USER_PROFILE_NOT_FOUND } from "@bao/shared/constants/api-errors";
import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_NOT_FOUND, HTTP_STATUS_OK } from "@bao/shared/constants/http";
import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { userProfile } from "../db/schema/user";
import { simpleRouteErrorResponses } from "./route-error-envelope";
import { userProfileResponseSchema, userProfileUpdateBodySchema } from "./user-route-contracts";

type UserProfileRow = typeof userProfile.$inferSelect;

const userProfileResponses = {
  [HTTP_STATUS_OK]: userProfileResponseSchema,
  ...simpleRouteErrorResponses,
};

const toUserProfileResponse = (row: UserProfileRow) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  location: row.location,
  website: row.website,
  linkedin: row.linkedin,
  github: row.github,
  summary: row.summary,
  currentRole: row.currentRole,
  currentCompany: row.currentCompany,
  yearsExperience: row.yearsExperience,
  technicalSkills: row.technicalSkills ?? [],
  softSkills: row.softSkills ?? [],
  gamingExperience: row.gamingExperience ?? {},
  careerGoals: row.careerGoals ?? {},
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const userRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.userBase),
})
  .get(
    toApiChildPath(API_ENDPOINTS.userBase, API_ENDPOINTS.userProfile),
    {
      detail: { tags: ["User"] },
      response: userProfileResponses,
    },
    async ({ status }) => {
      const rows = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.id, DEFAULT_PROFILE_ID));
      if (rows.length === 0) {
        return status(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_USER_PROFILE_NOT_FOUND });
      }
      return status(HTTP_STATUS_OK, toUserProfileResponse(rows[0]));
    },
  )
  .put(
    toApiChildPath(API_ENDPOINTS.userBase, API_ENDPOINTS.userProfile),
    {
      detail: { tags: ["User"] },
      body: userProfileUpdateBodySchema,
      response: userProfileResponses,
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
      return status(HTTP_STATUS_OK, toUserProfileResponse(updated[0]));
    },
  );
