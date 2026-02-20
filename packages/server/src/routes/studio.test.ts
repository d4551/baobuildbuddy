import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { requestJson } from "../test-utils";

let app: { handle: (request: Request) => Response | Promise<Response> };

beforeAll(async () => {
  const dbModule = await import("../db/client");
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const routesModule = await import("./studio.routes");
  const { Elysia } = await import("elysia");

  initModule.initializeDatabase(dbModule.sqlite);
  await seedModule.seedDatabase(dbModule.db);

  app = new Elysia({ prefix: "/api" }).use(routesModule.studioRoutes);
});

afterAll(() => {});

describe("studio routes", () => {
  test("GET /api/studios returns list (includes seeded)", async () => {
    const res = await requestJson<unknown[]>(app, "GET", "/api/studios");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("POST /api/studios creates studio", async () => {
    const res = await requestJson<{ id: string; name: string }>(app, "POST", "/api/studios", {
      name: "Test Studio",
      description: "A test",
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Test Studio");
    expect(res.body.id).toBeDefined();
  });

  test("GET /api/studios/:id returns 404 for missing", async () => {
    const res = await requestJson<{ error: string }>(app, "GET", "/api/studios/nonexistent-id");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Studio not found");
  });
});
