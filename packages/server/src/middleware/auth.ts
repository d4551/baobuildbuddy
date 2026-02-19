import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { config } from "../config/env";
import { db } from "../db/client";
import { auth } from "../db/schema/auth";

/**
 * Elysia plugin that validates Bearer API key for protected routes.
 * Skipped when config.disableAuth is true (local dev).
 */
export const authGuard = new Elysia({ name: "auth-guard" }).onBeforeHandle(
  async ({ request, status }) => {
    if (config.disableAuth) return;

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return status(401, { error: "Missing or invalid Authorization header" });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return status(401, { error: "Empty API key" });
    }

    const rows = await db.select().from(auth).where(eq(auth.id, "default"));
    const storedKey = rows[0]?.apiKey;
    if (!storedKey || storedKey !== token) {
      return status(401, { error: "Invalid API key" });
    }
  },
);
