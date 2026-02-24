import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { config } from "../config/env";
import { db } from "../db/client";
import { auth } from "../db/schema/auth";

const AUTH_ID = "default";
const API_KEY_PREFIX = "bao_";
const API_KEY_RANDOM_BYTES = 24;
const BASE64URL_PADDING_PATTERN = /=+$/u;

const encodeBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/gu, "-")
    .replace(/\//gu, "_")
    .replace(BASE64URL_PADDING_PATTERN, "");

function generateApiKey(): string {
  const bytes = new Uint8Array(API_KEY_RANDOM_BYTES);
  crypto.getRandomValues(bytes);
  return `${API_KEY_PREFIX}${encodeBase64Url(bytes)}`;
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
    const hasKey = Boolean(rows[0]?.apiKey);
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
