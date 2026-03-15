import {
  API_MESSAGE_API_KEY_ALREADY_CONFIGURED,
  API_MESSAGE_AUTH_DISABLED,
  API_MESSAGE_SAVE_API_KEY_ONCE,
  DEFAULT_PROFILE_ID,
} from "@bao/shared";
import { AUTH_KEY_PREFIX, AUTH_KEY_RANDOM_BYTES } from "@bao/shared";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { config } from "../config/env";
import { db } from "../db/client";
import { auth } from "../db/schema/auth";
const BASE64URL_PADDING_PATTERN = /=+$/u;

const encodeBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/gu, "-")
    .replace(/\//gu, "_")
    .replace(BASE64URL_PADDING_PATTERN, "");

function generateApiKey(): string {
  const bytes = new Uint8Array(AUTH_KEY_RANDOM_BYTES);
  crypto.getRandomValues(bytes);
  return `${AUTH_KEY_PREFIX}${encodeBase64Url(bytes)}`;
}

export const authRoutes = new Elysia({ prefix: "/auth", tags: ["Auth"] })
  .get("/status", async () => {
    if (config.disableAuth) {
      return { configured: false, authRequired: false };
    }
    const rows = await db.select().from(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
    const hasKey = Boolean(rows[0]?.apiKey);
    return { authRequired: true, configured: hasKey };
  })
  .get("/configured", async () => {
    if (config.disableAuth) {
      return { configured: false };
    }
    const rows = await db.select().from(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
    const hasKey = Boolean(rows[0]?.apiKey);
    return { configured: hasKey };
  })
  .post("/init", async () => {
    if (config.disableAuth) {
      return { configured: false, message: API_MESSAGE_AUTH_DISABLED };
    }

    const rows = await db.select().from(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
    const existingApiKey = rows[0]?.apiKey;

    if (existingApiKey) {
      return {
        configured: true,
        apiKey: existingApiKey,
        message: API_MESSAGE_API_KEY_ALREADY_CONFIGURED,
      };
    }

    const apiKey = generateApiKey();
    await db.insert(auth).values({ id: DEFAULT_PROFILE_ID, apiKey }).onConflictDoUpdate({
      target: auth.id,
      set: { apiKey },
    });

    return {
      configured: true,
      apiKey,
      message: API_MESSAGE_SAVE_API_KEY_ONCE,
    };
  });
