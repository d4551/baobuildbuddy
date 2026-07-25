import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  API_ENDPOINT_PREFIX,
  API_ENDPOINTS,
  buildStudioDetailEndpoint,
} from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { requestJson } from "../test-utils";

let app: { handle: (request: Request) => Response | Promise<Response> };

beforeAll(async () => {
  const dbModule = await import("../db/client");
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const routesModule = await import("./studio.routes");
  const { Elysia } = await import("elysia");

  initModule.initializeDatabase(dbModule.sqlite);
  seedModule.seedDatabase(dbModule.db);

  app = new Elysia({ prefix: API_ENDPOINT_PREFIX }).use(routesModule.studioRoutes);
});

afterAll(() => undefined);

describe("studio routes", () => {
  test("GET studios returns list (includes seeded)", async () => {
    const res = await requestJson<unknown[]>(app, "GET", API_ENDPOINTS.studios);
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("POST studios creates studio", async () => {
    const res = await requestJson<{ id: string; name: string }>(
      app,
      "POST",
      API_ENDPOINTS.studios,
      {
        name: "Test Studio",
        description: "A test",
      },
    );
    expect(res.status).toBe(HTTP_STATUS_CREATED);
    expect(res.body.name).toBe("Test Studio");
    expect(res.body.id).toBeDefined();
  });

  test("GET studio detail returns 404 for missing", async () => {
    const res = await requestJson<{ error: string }>(
      app,
      "GET",
      buildStudioDetailEndpoint("nonexistent-id"),
    );
    expect(res.status).toBe(HTTP_STATUS_NOT_FOUND);
    expect(res.body.error).toBe("Studio not found");
  });
});
