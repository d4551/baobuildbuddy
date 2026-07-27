import { afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import {
  API_ERROR_EMPTY_API_KEY,
  API_ERROR_INVALID_API_KEY,
  API_ERROR_MISSING_AUTH_HEADER,
} from "@bao/shared/constants/api-errors";
import {
  isSetupPreBootstrapEndpoint,
  SETUP_PREBOOTSTRAP_ENDPOINTS,
} from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_OK, HTTP_STATUS_UNAUTHORIZED } from "@bao/shared/constants/http";
import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { isAuthDisabled } from "../config/env";
import { db, sqlite } from "../db/client";
import { initializeDatabase } from "../db/init";
import { auth } from "../db/schema/auth";
import { hashApiKey } from "../utils/crypto";
import { authenticateApiKey, authGuard } from "./auth";

const originalDisableAuth = Bun.env.BAO_DISABLE_AUTH;
let originalApiKey: string | null = null;

const seedAuthKey = async (rawKey: string) => {
  const keyHash = hashApiKey(rawKey);
  await db
    .insert(auth)
    .values({
      id: DEFAULT_PROFILE_ID,
      apiKeyHash: keyHash,
      apiKeyCreatedAt: new Date().toISOString(),
      apiKeyExpiresAt: null,
      apiKeyRevokedAt: null,
    })
    .onConflictDoUpdate({
      target: auth.id,
      set: {
        apiKeyHash: keyHash,
        apiKeyCreatedAt: new Date().toISOString(),
        apiKeyExpiresAt: null,
        apiKeyRevokedAt: null,
      },
    });
};

beforeAll(async () => {
  initializeDatabase(sqlite);
  originalApiKey = null;
  const saved = (await db.select().from(auth).where(eq(auth.id, DEFAULT_PROFILE_ID)))[0];
  if (saved?.apiKeyHash) {
    originalApiKey = saved.apiKeyHash;
  } else {
    originalApiKey = null;
  }
});

beforeEach(() => {
  Bun.env.BAO_DISABLE_AUTH = "false";
});

afterEach(async () => {
  if (originalDisableAuth === undefined) {
    Bun.env.BAO_DISABLE_AUTH = undefined;
  } else {
    Bun.env.BAO_DISABLE_AUTH = originalDisableAuth;
  }

  if (originalApiKey === null) {
    await db.delete(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
  } else {
    await db
      .insert(auth)
      .values({
        id: DEFAULT_PROFILE_ID,
        apiKeyHash: originalApiKey,
        apiKeyCreatedAt: new Date().toISOString(),
        apiKeyExpiresAt: null,
        apiKeyRevokedAt: null,
      })
      .onConflictDoUpdate({
        target: auth.id,
        set: {
          apiKeyHash: originalApiKey,
          apiKeyCreatedAt: new Date().toISOString(),
          apiKeyExpiresAt: null,
          apiKeyRevokedAt: null,
        },
      });
  }
});

describe("authenticateApiKey rejection cases", () => {
  test("rejects request without Authorization header", async () => {
    await seedAuthKey("bao_test_key");
    const failure = await authenticateApiKey(new Request("http://localhost/api/ws/chat"));
    expect(failure).not.toBeNull();
    expect(failure?.status).toBe(HTTP_STATUS_UNAUTHORIZED);
    expect(failure?.error).toBe(API_ERROR_MISSING_AUTH_HEADER);
  });

  test("rejects Authorization header without Bearer scheme", async () => {
    await seedAuthKey("bao_test_key");
    const failure = await authenticateApiKey(
      new Request("http://localhost/api/ws/chat", { headers: { authorization: "Basic abc123" } }),
    );
    expect(failure?.status).toBe(HTTP_STATUS_UNAUTHORIZED);
    expect(failure?.error).toBe(API_ERROR_MISSING_AUTH_HEADER);
  });

  test("rejects Authorization header with Bearer scheme but no token value", async () => {
    await seedAuthKey("bao_test_key");
    const failure = await authenticateApiKey(
      new Request("http://localhost/api/ws/chat", { headers: { authorization: "Bearer" } }),
    );
    expect(failure?.status).toBe(HTTP_STATUS_UNAUTHORIZED);
    expect(failure?.error).toBe(API_ERROR_EMPTY_API_KEY);
  });

  test("rejects Bearer token that normalizes to empty", async () => {
    await seedAuthKey("bao_test_key");
    const failure = await authenticateApiKey(
      new Request("http://localhost/api/ws/chat", { headers: { authorization: "Bearer   " } }),
    );
    expect(failure?.status).toBe(HTTP_STATUS_UNAUTHORIZED);
    expect(failure?.error).toBe(API_ERROR_EMPTY_API_KEY);
  });

  test("rejects mismatched Bearer token", async () => {
    await seedAuthKey("bao_correct_key");
    const failure = await authenticateApiKey(
      new Request("http://localhost/api/ws/chat", {
        headers: { authorization: "Bearer bao_wrong_key" },
      }),
    );
    expect(failure?.status).toBe(HTTP_STATUS_UNAUTHORIZED);
    expect(failure?.error).toBe(API_ERROR_INVALID_API_KEY);
  });

  test("rejects when no profile key has been configured yet", async () => {
    await db.delete(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
    const failure = await authenticateApiKey(
      new Request("http://localhost/api/ws/chat", {
        headers: { authorization: "Bearer bao_some_token" },
      }),
    );
    expect(failure?.status).toBe(HTTP_STATUS_UNAUTHORIZED);
    expect(failure?.error).toBe(API_ERROR_INVALID_API_KEY);
  });
});

describe("authenticateApiKey acceptance cases", () => {
  test("accepts matching Bearer token and returns null", async () => {
    await seedAuthKey("bao_valid_token");
    const failure = await authenticateApiKey(
      new Request("http://localhost/api/ws/chat", {
        headers: { authorization: "Bearer bao_valid_token" },
      }),
    );
    expect(failure).toEqual(null);
  });

  test("skips validation when disableAuth is set", async () => {
    Bun.env.BAO_DISABLE_AUTH = "true";
    await db.delete(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
    const failure = await authenticateApiKey(new Request("http://localhost/api/ws/chat"));
    expect(failure).toEqual(null);
  });
});

describe("authenticateApiKey first-run setup grace", () => {
  const setupEndpoint = SETUP_PREBOOTSTRAP_ENDPOINTS[0];
  const setupUrl = `http://localhost${setupEndpoint.path}`;

  test("allows the allowlisted setup endpoint while no API key hash exists", async () => {
    await db.delete(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
    const failure = await authenticateApiKey(
      new Request(setupUrl, { method: setupEndpoint.method }),
    );
    expect(failure).toEqual(null);
  });

  test("closes the grace once the instance is bootstrapped", async () => {
    await seedAuthKey("bao_bootstrapped_key");
    const failure = await authenticateApiKey(
      new Request(setupUrl, { method: setupEndpoint.method }),
    );
    expect(failure).toEqual({
      error: API_ERROR_MISSING_AUTH_HEADER,
      status: HTTP_STATUS_UNAUTHORIZED,
    });
  });

  test("does not extend the grace to a non-allowlisted route pre-bootstrap", async () => {
    await db.delete(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
    const failure = await authenticateApiKey(
      new Request("http://localhost/api/settings", { method: "GET" }),
    );
    expect(failure).toEqual({
      error: API_ERROR_MISSING_AUTH_HEADER,
      status: HTTP_STATUS_UNAUTHORIZED,
    });
  });

  test("does not extend the grace to another method on the allowlisted path", async () => {
    await db.delete(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
    const failure = await authenticateApiKey(new Request(setupUrl, { method: "GET" }));
    expect(failure).toEqual({
      error: API_ERROR_MISSING_AUTH_HEADER,
      status: HTTP_STATUS_UNAUTHORIZED,
    });
  });

  test("does not let a query string smuggle a non-allowlisted path past the grace", async () => {
    await db.delete(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
    const failure = await authenticateApiKey(
      new Request(`http://localhost/api/settings?next=${encodeURIComponent(setupEndpoint.path)}`, {
        method: setupEndpoint.method,
      }),
    );
    expect(failure).toEqual({
      error: API_ERROR_MISSING_AUTH_HEADER,
      status: HTTP_STATUS_UNAUTHORIZED,
    });
  });

  test("guarded app serves the setup endpoint pre-bootstrap and blocks it after", async () => {
    const app = new Elysia().use(authGuard).post(setupEndpoint.path, () => ({ reachable: true }));

    await db.delete(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
    const openResponse = await app.handle(new Request(setupUrl, { method: setupEndpoint.method }));
    expect(openResponse.status).toBe(HTTP_STATUS_OK);
    expect(await openResponse.json()).toEqual({ reachable: true });

    await seedAuthKey("bao_guard_setup_key");
    const closedResponse = await app.handle(
      new Request(setupUrl, { method: setupEndpoint.method }),
    );
    expect(closedResponse.status).toBe(HTTP_STATUS_UNAUTHORIZED);
    expect(await closedResponse.json()).toEqual({ error: API_ERROR_MISSING_AUTH_HEADER });
  });
});

describe("isSetupPreBootstrapEndpoint", () => {
  test("matches the allowlisted pair with either method casing", () => {
    expect(isSetupPreBootstrapEndpoint("post", "/api/settings/test-api-key")).toBe(true);
    expect(isSetupPreBootstrapEndpoint("POST", "/api/settings/test-api-key")).toBe(true);
  });

  test("rejects unlisted methods, parents, and child paths", () => {
    expect(isSetupPreBootstrapEndpoint("GET", "/api/settings/test-api-key")).toBe(false);
    expect(isSetupPreBootstrapEndpoint("POST", "/api/settings")).toBe(false);
    expect(isSetupPreBootstrapEndpoint("POST", "/api/settings/test-api-key/extra")).toBe(false);
  });
});

describe("isAuthDisabled production guard", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  test("throws when BAO_DISABLE_AUTH is enabled in production", () => {
    process.env.NODE_ENV = "production";
    Bun.env.BAO_DISABLE_AUTH = "true";
    expect(() => isAuthDisabled()).toThrow("BAO_DISABLE_AUTH cannot be set to true in production");
  });
});

describe("authGuard HTTP default-deny", () => {
  test("blocks protected routes without Authorization", async () => {
    await seedAuthKey("bao_guard_test_key");
    const app = new Elysia().use(authGuard).get("/protected", () => ({ ok: true }));
    const response = await app.handle(new Request("http://localhost/protected"));
    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe(API_ERROR_MISSING_AUTH_HEADER);
  });

  test("allows protected routes with a valid Bearer token", async () => {
    await seedAuthKey("bao_guard_test_key");
    const app = new Elysia().use(authGuard).get("/protected", () => ({ ok: true }));
    const response = await app.handle(
      new Request("http://localhost/protected", {
        headers: { authorization: "Bearer bao_guard_test_key" },
      }),
    );
    expect(response.status).toBe(HTTP_STATUS_OK);
    const body = (await response.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});
