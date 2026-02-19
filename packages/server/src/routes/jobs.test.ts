import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { generateId } from "@navi/shared";
import type { Elysia } from "elysia";
import { db } from "../db/client";
import { jobs } from "../db/schema/jobs";
import { requestJson } from "../test-utils";

let app: Elysia;

beforeAll(async () => {
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const routesModule = await import("./jobs.routes");
  const dbModule = await import("../db/client");
  const { Elysia } = await import("elysia");

  initModule.initializeDatabase(dbModule.sqlite);
  await seedModule.seedDatabase(dbModule.db);

  app = new Elysia({ prefix: "/api" }).use(routesModule.jobsRoutes);
});

afterAll(() => {});

describe("jobs routes", () => {
  test("GET /api/jobs returns jobs list", async () => {
    const res = await requestJson<{ jobs: unknown[]; page: number; total: number }>(
      app,
      "GET",
      "/api/jobs",
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(res.body.page).toBe(1);
  });

  test("GET /api/jobs/:id returns 404 for missing job", async () => {
    const res = await requestJson<{ error: string }>(app, "GET", "/api/jobs/nonexistent-id");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Job not found");
  });

  test("POST /api/jobs/save requires existing job", async () => {
    const res = await requestJson<{ error: string }>(app, "POST", "/api/jobs/save", {
      jobId: "nonexistent",
    });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Job not found");
  });

  test("POST /api/jobs/save and GET /api/jobs/saved round-trip", async () => {
    const jobId = generateId();
    await db.insert(jobs).values({
      id: jobId,
      title: "Test Engineer",
      company: "Test Co",
      location: "Remote",
      postedDate: new Date().toISOString(),
    });

    const saveRes = await requestJson<{ jobId: string }>(app, "POST", "/api/jobs/save", {
      jobId,
    });
    expect(saveRes.status).toBe(201);
    expect(saveRes.body.jobId).toBe(jobId);

    const savedRes = await requestJson<Array<{ jobId: string }>>(app, "GET", "/api/jobs/saved");
    expect(savedRes.status).toBe(200);
    expect(Array.isArray(savedRes.body)).toBe(true);
    const found = (savedRes.body as Array<{ jobId: string }>).some((s) => s.jobId === jobId);
    expect(found).toBe(true);

    const delRes = await requestJson<{ success: boolean }>(
      app,
      "DELETE",
      `/api/jobs/save/${jobId}`,
    );
    expect(delRes.status).toBe(200);
  });

  test("POST /api/jobs/apply requires existing job", async () => {
    const res = await requestJson<{ error: string }>(app, "POST", "/api/jobs/apply", {
      jobId: "nonexistent",
    });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Job not found");
  });

  test("GET /api/jobs/applications returns list", async () => {
    const res = await requestJson<unknown[]>(app, "GET", "/api/jobs/applications");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
