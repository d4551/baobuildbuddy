import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  API_ENDPOINT_PREFIX,
  API_ENDPOINTS,
  buildJobDetailEndpoint,
  buildJobSaveEndpoint,
} from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { generateId } from "@bao/shared/utils/validation";
import { db } from "../db/client";
import { jobs } from "../db/schema/jobs";
import { requestJson } from "../test-utils";

let app: { handle: (request: Request) => Response | Promise<Response> };

beforeAll(async () => {
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const routesModule = await import("./jobs.routes");
  const dbModule = await import("../db/client");
  const { Elysia } = await import("elysia");

  initModule.initializeDatabase(dbModule.sqlite);
  seedModule.seedDatabase(dbModule.db);

  app = new Elysia({ prefix: API_ENDPOINT_PREFIX }).use(routesModule.jobsRoutes);
});

afterAll(() => undefined);

function registerListAndLookupTests(): void {
  test("GET jobs returns jobs list", async () => {
    const res = await requestJson<{ jobs: unknown[]; page: number; total: number }>(
      app,
      "GET",
      API_ENDPOINTS.jobs,
    );
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(res.body.page).toBe(1);
  });

  test("GET job detail returns 404 for missing job", async () => {
    const res = await requestJson<{ error: string }>(
      app,
      "GET",
      buildJobDetailEndpoint("nonexistent-id"),
    );
    expect(res.status).toBe(HTTP_STATUS_NOT_FOUND);
    expect(res.body.error).toBe("Job not found");
  });
}

function registerSavedJobTests(): void {
  test("POST job save requires existing job", async () => {
    const res = await requestJson<{ error: string }>(app, "POST", API_ENDPOINTS.jobsSave, {
      jobId: "nonexistent",
    });
    expect(res.status).toBe(HTTP_STATUS_NOT_FOUND);
    expect(res.body.error).toBe("Job not found");
  });

  test("POST job save and GET saved jobs round-trip", async () => {
    const jobId = generateId();
    await db.insert(jobs).values({
      id: jobId,
      title: "Test Engineer",
      company: "Test Co",
      location: "Remote",
      postedDate: new Date().toISOString(),
    });

    const saveRes = await requestJson<{ jobId: string }>(app, "POST", API_ENDPOINTS.jobsSave, {
      jobId,
    });
    expect(saveRes.status).toBe(HTTP_STATUS_CREATED);
    expect(saveRes.body.jobId).toBe(jobId);

    const savedRes = await requestJson<Array<{ jobId: string }>>(
      app,
      "GET",
      API_ENDPOINTS.jobsSaved,
    );
    expect(savedRes.status).toBe(HTTP_STATUS_OK);
    expect(Array.isArray(savedRes.body)).toBe(true);
    const found = (savedRes.body as Array<{ jobId: string }>).some((s) => s.jobId === jobId);
    expect(found).toBe(true);

    const delRes = await requestJson<{ success: boolean }>(
      app,
      "DELETE",
      buildJobSaveEndpoint(jobId),
    );
    expect(delRes.status).toBe(HTTP_STATUS_OK);
  });
}

function registerApplicationTests(): void {
  test("POST job apply requires existing job", async () => {
    const res = await requestJson<{ error: string }>(app, "POST", API_ENDPOINTS.jobsApply, {
      jobId: "nonexistent",
    });
    expect(res.status).toBe(HTTP_STATUS_NOT_FOUND);
    expect(res.body.error).toBe("Job not found");
  });

  test("GET job applications returns list", async () => {
    const res = await requestJson<unknown[]>(app, "GET", API_ENDPOINTS.jobsApplications);
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(Array.isArray(res.body)).toBe(true);
  });
}

describe("jobs routes listing", () => {
  registerListAndLookupTests();
});

describe("jobs routes saved items", () => {
  registerSavedJobTests();
});

describe("jobs routes applications", () => {
  registerApplicationTests();
});
