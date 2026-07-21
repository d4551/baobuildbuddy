import { describe, expect, test } from "bun:test";
import {
  API_ERROR_INVALID_API_KEY,
  API_ERROR_MISSING_AUTH_HEADER,
} from "@bao/shared/constants/api-errors";
import { OPENAI_V1_ENDPOINTS } from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_UNAUTHORIZED } from "@bao/shared/constants/http";
import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import { Elysia } from "elysia";
import { db } from "../db/client";
import { auth } from "../db/schema/auth";
import { hashApiKey } from "../utils/crypto";
import { openaiV1Routes } from "./openai-v1.routes";

const createCompatApp = () => new Elysia().use(openaiV1Routes);

describe("openai v1 auth default-deny: rejects unauthenticated models list when auth is enabled", () => {
  test("rejects unauthenticated models list when auth is enabled", async () => {
    Bun.env.BAO_DISABLE_AUTH = "false";
    await db
      .insert(auth)
      .values({
        id: DEFAULT_PROFILE_ID,
        apiKeyHash: hashApiKey("bao_openai_v1_test_key"),
        apiKeyCreatedAt: new Date().toISOString(),
        apiKeyExpiresAt: null,
        apiKeyRevokedAt: null,
      })
      .onConflictDoUpdate({
        target: auth.id,
        set: {
          apiKeyHash: hashApiKey("bao_openai_v1_test_key"),
          apiKeyCreatedAt: new Date().toISOString(),
          apiKeyExpiresAt: null,
          apiKeyRevokedAt: null,
        },
      });

    const app = createCompatApp();
    const response = await app.handle(new Request(`http://localhost${OPENAI_V1_ENDPOINTS.models}`));
    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED);
    const body = (await response.json()) as {
      error: { message: string; type: string; code?: string | null };
    };
    expect(body.error.message).toBe(API_ERROR_MISSING_AUTH_HEADER);
    expect(body.error.type).toBe("invalid_request_error");
  });
});

describe("openai v1 auth default-deny: rejects invalid bearer token when auth is enabled", () => {
  test("rejects invalid bearer token when auth is enabled", async () => {
    Bun.env.BAO_DISABLE_AUTH = "false";
    await db
      .insert(auth)
      .values({
        id: DEFAULT_PROFILE_ID,
        apiKeyHash: hashApiKey("bao_openai_v1_test_key"),
        apiKeyCreatedAt: new Date().toISOString(),
        apiKeyExpiresAt: null,
        apiKeyRevokedAt: null,
      })
      .onConflictDoUpdate({
        target: auth.id,
        set: {
          apiKeyHash: hashApiKey("bao_openai_v1_test_key"),
          apiKeyCreatedAt: new Date().toISOString(),
          apiKeyExpiresAt: null,
          apiKeyRevokedAt: null,
        },
      });

    const app = createCompatApp();
    const response = await app.handle(
      new Request(`http://localhost${OPENAI_V1_ENDPOINTS.models}`, {
        headers: { authorization: "Bearer wrong-key" },
      }),
    );
    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED);
    const body = (await response.json()) as {
      error: { message: string; type: string; code?: string | null };
    };
    expect(body.error.message).toBe(API_ERROR_INVALID_API_KEY);
    expect(body.error.code).toBe("invalid_api_key");
  });
});
