import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { config } from "../config/env";
import { db } from "../db/client";
import { auth } from "../db/schema/auth";

const AUTH_ID = "default";

function generateApiKey(): string {
  return `bao_${randomBytes(24).toString("base64url")}`;
}

export const authRoutes = new Elysia({ prefix: "/auth" })
  .get("/status", () => {
    if (config.disableAuth) {
      return { configured: false, authRequired: false };
    }
    return { authRequired: true };
  })
  .get("/configured", async () => {
    if (config.disableAuth) {
      return { configured: false };
    }
    const rows = await db.select().from(auth).where(eq(auth.id, AUTH_ID));
    const hasKey = !!rows[0]?.apiKey;
    return { configured: hasKey };
  })
  .post("/init", async () => {
    if (config.disableAuth) {
      return { configured: false, message: "Auth disabled" };
    }

    const rows = await db.select().from(auth).where(eq(auth.id, AUTH_ID));
    if (rows[0]?.apiKey) {
      return {
        configured: true,
        message: "API key already configured",
      };
    }

    const apiKey = generateApiKey();
    await db.insert(auth).values({ id: AUTH_ID, apiKey }).onConflictDoUpdate({
      target: auth.id,
      set: { apiKey },
    });

    return {
      configured: true,
      apiKey,
      message: "Save this API key — it will not be shown again",
    };
  });
