import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import {
  API_ERROR_INVALID_API_KEY,
  API_ERROR_MISSING_AUTH_HEADER,
} from "@bao/shared/constants/api-errors";
import { OPENAI_V1_ENDPOINTS } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNAUTHORIZED,
} from "@bao/shared/constants/http";
import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { db, sqlite } from "../db/client";
import { initializeDatabase } from "../db/init";
import { auth } from "../db/schema/auth";
import { hashApiKey } from "../utils/crypto";
import { openaiV1Routes } from "./openai-v1.routes";

const createCompatApp = () => new Elysia().use(openaiV1Routes);
const originalDisableAuth = Bun.env.BAO_DISABLE_AUTH;

describe("openai v1 auth default-deny", () => {
  beforeAll(() => {
    initializeDatabase(sqlite);
  });

  afterEach(async () => {
    if (originalDisableAuth === undefined) {
      Bun.env.BAO_DISABLE_AUTH = undefined;
    } else {
      Bun.env.BAO_DISABLE_AUTH = originalDisableAuth;
    }
    await db.delete(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
  });

  test("rejects unauthenticated models list when auth is enabled", async () => {
    Bun.env.BAO_DISABLE_AUTH = "false";
    await db
      .insert(auth)
      .values({ id: DEFAULT_PROFILE_ID, apiKeyHash: hashApiKey("bao_openai_v1_test_key"), apiKeyCreatedAt: new Date().toISOString(), apiKeyExpiresAt: null, apiKeyRevokedAt: null })
      .onConflictDoUpdate({
        target: auth.id,
        set: { apiKeyHash: hashApiKey("bao_openai_v1_test_key"), apiKeyCreatedAt: new Date().toISOString(), apiKeyExpiresAt: null, apiKeyRevokedAt: null },
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

  test("rejects invalid bearer token when auth is enabled", async () => {
    Bun.env.BAO_DISABLE_AUTH = "false";
    await db
      .insert(auth)
      .values({ id: DEFAULT_PROFILE_ID, apiKeyHash: hashApiKey("bao_openai_v1_test_key"), apiKeyCreatedAt: new Date().toISOString(), apiKeyExpiresAt: null, apiKeyRevokedAt: null })
      .onConflictDoUpdate({
        target: auth.id,
        set: { apiKeyHash: hashApiKey("bao_openai_v1_test_key"), apiKeyCreatedAt: new Date().toISOString(), apiKeyExpiresAt: null, apiKeyRevokedAt: null },
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

describe("openai v1 routes", () => {
  test("GET /v1/models returns OpenAI list envelope", async () => {
    const app = createCompatApp();
    const response = await app.handle(new Request(`http://localhost${OPENAI_V1_ENDPOINTS.models}`));
    const raw = await response.text();
    if (response.status !== HTTP_STATUS_OK) {
      throw new Error(`unexpected status ${response.status}: ${raw}`);
    }
    const body = JSON.parse(raw) as {
      object: string;
      data: Array<{ id: string; object: string; owned_by: string }>;
    };
    expect(body.object).toBe("list");
    expect(Array.isArray(body.data)).toBe(true);
    // Deterministic test provider or configured providers may both appear; empty is invalid.
    if (body.data.length === 0) {
      throw new Error(`empty models list: ${raw}`);
    }
    expect(body.data[0]?.object).toBe("model");
    expect(body.data[0]?.id.includes("/")).toBe(true);
  });

  test("GET /v1/models/* returns 404 for unknown model", async () => {
    const app = createCompatApp();
    const response = await app.handle(
      new Request(`http://localhost${OPENAI_V1_ENDPOINTS.models}/local%2Fmissing-model`),
    );
    const raw = await response.text();
    expect(response.status).toBe(HTTP_STATUS_NOT_FOUND);
    const body = JSON.parse(raw) as { error: { message: string; code: string | null } };
    expect(body.error.message.length).toBeGreaterThan(0);
    expect(body.error.code).toBe("model_not_found");
  });

  test("POST /v1/chat/completions returns OpenAI chat.completion shape", async () => {
    const app = createCompatApp();
    const modelsResponse = await app.handle(
      new Request(`http://localhost${OPENAI_V1_ENDPOINTS.models}`),
    );
    const modelsBody = (await modelsResponse.json()) as { data: Array<{ id: string }> };
    const modelId = modelsBody.data[0]?.id;
    expect(modelId).toBeDefined();

    const response = await app.handle(
      new Request(`http://localhost${OPENAI_V1_ENDPOINTS.chatCompletions}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: "user", content: "Say hello in one word." }],
        }),
      }),
    );
    expect(response.status).toBe(HTTP_STATUS_OK);
    const body = (await response.json()) as {
      object: string;
      model: string;
      choices: Array<{ message: { role: string; content: string } }>;
      usage: { total_tokens: number };
    };
    expect(body.object).toBe("chat.completion");
    expect(body.model).toBe(modelId);
    expect(body.choices[0]?.message.role).toBe("assistant");
    expect(body.choices[0]?.message.content.length).toBeGreaterThan(0);
    expect(body.usage.total_tokens).toBeGreaterThan(0);
  });

  test("POST /v1/chat/completions stream emits SSE framing", async () => {
    const app = createCompatApp();
    const modelsResponse = await app.handle(
      new Request(`http://localhost${OPENAI_V1_ENDPOINTS.models}`),
    );
    const modelsBody = (await modelsResponse.json()) as { data: Array<{ id: string }> };
    const modelId = modelsBody.data[0]?.id;

    const response = await app.handle(
      new Request(`http://localhost${OPENAI_V1_ENDPOINTS.chatCompletions}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: modelId,
          stream: true,
          messages: [{ role: "user", content: "ping" }],
        }),
      }),
    );
    expect(response.status).toBe(HTTP_STATUS_OK);
    expect(response.headers.get("content-type") ?? "").toContain("text/event-stream");
    const text = await response.text();
    expect(text.includes("data: ")).toBe(true);
    expect(text.includes("[DONE]")).toBe(true);
  });
});
