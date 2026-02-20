import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { requestJson } from "../test-utils";

let app: { handle: (request: Request) => Response | Promise<Response> };
let createdId: string;

beforeAll(async () => {
  const dbModule = await import("../db/client");
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const routesModule = await import("./cover-letter.routes");
  const { Elysia } = await import("elysia");

  initModule.initializeDatabase(dbModule.sqlite);
  await seedModule.seedDatabase(dbModule.db);

  app = new Elysia({ prefix: "/api" }).use(routesModule.coverLetterRoutes);
});

afterAll(() => {});

describe("cover-letter routes", () => {
  test("POST /api/cover-letters creates cover letter", async () => {
    const res = await requestJson<{ id: string; company: string; position: string }>(
      app,
      "POST",
      "/api/cover-letters",
      { company: "Test Co", position: "Game Designer" },
    );
    expect(res.status).toBe(201);
    expect(res.body.company).toBe("Test Co");
    expect(res.body.position).toBe("Game Designer");
    expect(res.body.id).toBeDefined();
    createdId = res.body.id;
  });

  test("GET /api/cover-letters returns list", async () => {
    const res = await requestJson<Array<{ id: string }>>(app, "GET", "/api/cover-letters");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /api/cover-letters/:id returns created", async () => {
    const res = await requestJson<{ id: string; company: string }>(
      app,
      "GET",
      `/api/cover-letters/${createdId}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdId);
    expect(res.body.company).toBe("Test Co");
  });

  test("GET /api/cover-letters/:id returns 404 for missing", async () => {
    const res = await requestJson<{ error: string }>(
      app,
      "GET",
      "/api/cover-letters/nonexistent-id",
    );
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Cover letter not found");
  });

  test("PUT /api/cover-letters/:id updates", async () => {
    const res = await requestJson<{ position: string }>(
      app,
      "PUT",
      `/api/cover-letters/${createdId}`,
      { position: "Senior Game Designer" },
    );
    expect(res.status).toBe(200);
    expect(res.body.position).toBe("Senior Game Designer");
  });

  test("DELETE /api/cover-letters/:id removes", async () => {
    const res = await requestJson<{ success: boolean }>(
      app,
      "DELETE",
      `/api/cover-letters/${createdId}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
