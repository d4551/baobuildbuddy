import {
  DEFAULT_PROFILE_ID,
  SCHEMA_MAX_ITEMS_LARGE,
  SCHEMA_MAX_ITEMS_XXLARGE,
  SCHEMA_MAX_LENGTH_DESCRIPTION,
  SCHEMA_MAX_LENGTH_EMAIL,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_PHONE,
  SCHEMA_MAX_LENGTH_SHORT,
  SCHEMA_MAX_LENGTH_URL,
} from "@bao/shared";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { userProfile } from "../db/schema/user";

export const userRoutes = new Elysia({ prefix: "/user" })
  .get("/profile", async () => {
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
    "/profile",
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
      body: t.Object({
        name: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
        email: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_EMAIL })),
        phone: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_PHONE })),
        location: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
        website: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
        linkedin: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
        github: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
        summary: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
        currentRole: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
        currentCompany: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
        yearsExperience: t.Optional(t.Number({ minimum: 0, maximum: 80 })),
        technicalSkills: t.Optional(
          t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
            maxItems: SCHEMA_MAX_ITEMS_XXLARGE,
          }),
        ),
        softSkills: t.Optional(
          t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
            maxItems: SCHEMA_MAX_ITEMS_LARGE,
          }),
        ),
        gamingExperience: t.Optional(t.Record(t.String(), t.Unknown())),
        careerGoals: t.Optional(t.Record(t.String(), t.Unknown())),
      }),
    },
  );
