import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Elysia } from "elysia";
import { requestJson } from "../test-utils";

let app: Elysia;
let createdId: string;

beforeAll(async () => {
  const dbModule = await import("../db/client");
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const routesModule = await import("./resume.routes");
  const { Elysia } = await import("elysia");

  initModule.initializeDatabase(dbModule.sqlite);
  await seedModule.seedDatabase(dbModule.db);

  app = new Elysia({ prefix: "/api" }).use(routesModule.resumeRoutes);
});

afterAll(() => {});

describe("resume routes", () => {
  test("POST /api/resumes creates resume", async () => {
    const res = await requestJson<{ id: string; name: string }>(app, "POST", "/api/resumes", {
      name: "Test Resume",
      summary: "A test summary",
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Test Resume");
    expect(res.body.id).toBeDefined();
    createdId = res.body.id;
  });

  test("GET /api/resumes returns list", async () => {
    const res = await requestJson<Array<{ id: string }>>(app, "GET", "/api/resumes");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /api/resumes/:id returns created resume", async () => {
    const res = await requestJson<{ id: string; name: string }>(
      app,
      "GET",
      `/api/resumes/${createdId}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdId);
    expect(res.body.name).toBe("Test Resume");
  });

  test("GET /api/resumes/:id returns 404 for missing", async () => {
    const res = await requestJson<{ error: string }>(app, "GET", "/api/resumes/nonexistent-id");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Resume not found");
  });

  test("PUT /api/resumes/:id updates resume", async () => {
    const res = await requestJson<{ name: string }>(app, "PUT", `/api/resumes/${createdId}`, {
      name: "Updated Resume",
    });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Resume");
  });

  test("DELETE /api/resumes/:id removes resume", async () => {
    const res = await requestJson<{ success: boolean; id: string }>(
      app,
      "DELETE",
      `/api/resumes/${createdId}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBe(createdId);
  });

  test("GET /api/resumes/:id returns 404 after delete", async () => {
    const res = await requestJson<{ error: string }>(app, "GET", `/api/resumes/${createdId}`);
    expect(res.status).toBe(404);
  });
});
