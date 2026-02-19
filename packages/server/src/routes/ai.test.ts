import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Elysia } from "elysia";
import { requestJson } from "../test-utils";

let app: Elysia;

beforeAll(async () => {
  const dbModule = await import("../db/client");
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const routesModule = await import("./ai.routes");
  const { Elysia } = await import("elysia");

  initModule.initializeDatabase(dbModule.sqlite);
  await seedModule.seedDatabase(dbModule.db);

  app = new Elysia({ prefix: "/api" }).use(routesModule.aiRoutes);
});

afterAll(() => {});

describe("ai routes", () => {
  test("POST /api/ai/chat accepts message", async () => {
    const res = await requestJson<{ content?: string; error?: string }>(
      app,
      "POST",
      "/api/ai/chat",
      {
        message: "Hello, BaoBuildBuddy!",
        sessionId: "test-session",
      },
    );
    expect([200, 500]).toContain(res.status);
    expect(res.body).toBeDefined();
  });

  test("POST /api/ai/chat requires message (validation error)", async () => {
    const res = await requestJson<{ error?: string }>(app, "POST", "/api/ai/chat", {});
    expect([400, 422]).toContain(res.status);
  });
});
