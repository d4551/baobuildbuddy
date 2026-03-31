import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import {
  SCHEMA_MAX_ITEMS_LARGE,
  SCHEMA_MAX_ITEMS_XXLARGE,
  SCHEMA_MAX_LENGTH_DESCRIPTION,
  SCHEMA_MAX_LENGTH_EMAIL,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_PHONE,
  SCHEMA_MAX_LENGTH_SHORT,
  SCHEMA_MAX_LENGTH_URL,
} from "@bao/shared/constants/schema-limits";
import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import { StandardSchemaV1 } from "baobox";
import { eq } from "drizzle-orm";
import Type from "baobox";
import { Elysia } from "elysia";
import { db } from "../db/client";
import { userProfile } from "../db/schema/user";

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
    async ({ body }) => {
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
      body: StandardSchemaV1(
        Type.Object({
          name: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
          email: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_EMAIL })),
          phone: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_PHONE })),
          location: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
          website: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
          linkedin: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
          github: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
          summary: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
          currentRole: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
          currentCompany: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
          yearsExperience: Type.Optional(Type.Number({ minimum: 0, maximum: 80 })),
          technicalSkills: Type.Optional(
            Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
              maxItems: SCHEMA_MAX_ITEMS_XXLARGE,
            }),
          ),
          softSkills: Type.Optional(
            Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
              maxItems: SCHEMA_MAX_ITEMS_LARGE,
            }),
          ),
          gamingExperience: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
          careerGoals: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
        }),
      ),
    },
  );
