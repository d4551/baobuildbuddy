import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { userProfile } from "../db/schema/user";

export const userRoutes = new Elysia({ prefix: "/user" })
  .get("/profile", async () => {
    const rows = await db.select().from(userProfile).where(eq(userProfile.id, "default"));
    if (rows.length === 0) {
      // Auto-create default profile
      const defaultProfile = {
        id: "default",
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
      const existing = await db.select().from(userProfile).where(eq(userProfile.id, "default"));
      if (existing.length === 0) {
        await db.insert(userProfile).values({ id: "default", ...body });
      } else {
        await db
          .update(userProfile)
          .set({ ...body, updatedAt: new Date().toISOString() })
          .where(eq(userProfile.id, "default"));
      }
      const updated = await db.select().from(userProfile).where(eq(userProfile.id, "default"));
      return updated[0];
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ maxLength: 200 })),
        email: t.Optional(t.String({ maxLength: 320 })),
        phone: t.Optional(t.String({ maxLength: 30 })),
        location: t.Optional(t.String({ maxLength: 200 })),
        website: t.Optional(t.String({ maxLength: 500 })),
        linkedin: t.Optional(t.String({ maxLength: 500 })),
        github: t.Optional(t.String({ maxLength: 500 })),
        summary: t.Optional(t.String({ maxLength: 5000 })),
        currentRole: t.Optional(t.String({ maxLength: 200 })),
        currentCompany: t.Optional(t.String({ maxLength: 200 })),
        yearsExperience: t.Optional(t.Number({ minimum: 0, maximum: 80 })),
        technicalSkills: t.Optional(t.Array(t.String({ maxLength: 100 }), { maxItems: 100 })),
        softSkills: t.Optional(t.Array(t.String({ maxLength: 100 }), { maxItems: 50 })),
        gamingExperience: t.Optional(t.Record(t.String(), t.Unknown())),
        careerGoals: t.Optional(t.Record(t.String(), t.Unknown())),
      }),
    },
  );
