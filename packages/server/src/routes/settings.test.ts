import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Elysia } from "elysia";
import { requestJson } from "../test-utils";

let app: Elysia;

beforeAll(async () => {
  const dbModule = await import("../db/client");
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const routesModule = await import("./settings.routes");
  const { Elysia } = await import("elysia");

  initModule.initializeDatabase(dbModule.sqlite);
  await seedModule.seedDatabase(dbModule.db);

  app = new Elysia({ prefix: "/api" }).use(routesModule.settingsRoutes);
});

afterAll(() => {});

describe("settings routes", () => {
  test("GET /api/settings returns settings", async () => {
    const res = await requestJson<{
      id: string;
      hasGeminiKey?: boolean;
      geminiApiKey?: string | null;
    }>(app, "GET", "/api/settings");
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    if (res.body.geminiApiKey) {
      expect(res.body.geminiApiKey).toMatch(/^\*\*\*[a-zA-Z0-9]{4}$/);
    }
  });

  test("PUT /api/settings updates", async () => {
    const res = await requestJson<{ success: boolean }>(app, "PUT", "/api/settings", {
      theme: "bao-dark",
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("PUT /api/settings/api-keys updates keys", async () => {
    const res = await requestJson<{ success: boolean }>(app, "PUT", "/api/settings/api-keys", {
      localModelEndpoint: "http://localhost:1234",
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("GET /api/settings/export returns export payload", async () => {
    const res = await requestJson<{
      version: string;
      exportedAt: string;
      profile: unknown;
      settings: unknown;
      resumes: unknown[];
    }>(app, "GET", "/api/settings/export");
    expect(res.status).toBe(200);
    expect(res.body.version).toBe("1.0");
    expect(res.body.exportedAt).toBeDefined();
    expect(Array.isArray(res.body.resumes)).toBe(true);
  });
});
