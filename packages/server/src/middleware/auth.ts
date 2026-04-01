import {
  API_ERROR_EMPTY_API_KEY,
  API_ERROR_INVALID_API_KEY,
  API_ERROR_MISSING_AUTH_HEADER,
} from "@bao/shared/constants/api-errors";
import { HTTP_STATUS_UNAUTHORIZED } from "@bao/shared/constants/http";
import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { config } from "../config/env";
import { db } from "../db/client";
import { auth } from "../db/schema/auth";

/**
 * Elysia plugin that validates Bearer API key for protected routes.
 * Skipped only when config.disableAuth is explicitly enabled.
 */
export const authGuard = new Elysia({ name: "auth-guard" }).onBeforeHandle(
  async ({ request, status }) => {
    if (config.disableAuth) return;

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return status(HTTP_STATUS_UNAUTHORIZED, { error: API_ERROR_MISSING_AUTH_HEADER });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return status(HTTP_STATUS_UNAUTHORIZED, { error: API_ERROR_EMPTY_API_KEY });
    }

    const rows = await db.select().from(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
    const storedKey = rows[0]?.apiKey;
    if (!storedKey || storedKey !== token) {
      return status(HTTP_STATUS_UNAUTHORIZED, { error: API_ERROR_INVALID_API_KEY });
    }
  },
);
