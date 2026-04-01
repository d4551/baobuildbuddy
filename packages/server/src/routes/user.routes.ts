import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import { StandardSchemaV1 } from "baobox";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { db } from "../db/client";
import { userProfile } from "../db/schema/user";
import {
  userProfileUpdateBodySchema,
  type UserProfileUpdateRouteBody,
} from "./user-route-contracts";

export const userRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.userBase),
  tags: ["User"],
})
  .get(toApiChildPath(API_ENDPOINTS.userBase, API_ENDPOINTS.userProfile), async () => {
    const rows = await db.select().from(userProfile).where(eq(userProfile.id, DEFAULT_PROFILE_ID));
    if (rows.length === 0) {
      // Auto-create default profile
      const defaultProfile = {
        id: DEFAULT_PROFILE_ID,
        name: "",
        technicalSkills: [],
        softSkills: [],
        gamingExperience: {},
        careerGoals: {},
      };
      await db.insert(userProfile).values(defaultProfile);
      return defaultProfile;
    }
    return rows[0];
  })
  .put(
    toApiChildPath(API_ENDPOINTS.userBase, API_ENDPOINTS.userProfile),
    async ({ body }: { body: UserProfileUpdateRouteBody }) => {
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
      return updated[0];
    },
    {
      body: StandardSchemaV1(userProfileUpdateBodySchema),
    },
  );
