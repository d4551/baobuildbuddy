import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { requestJson } from "../test-utils";

let app: { handle: (request: Request) => Response | Promise<Response> };
let projectId: string;

beforeAll(async () => {
  const dbModule = await import("../db/client");
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const routesModule = await import("./portfolio.routes");
  const { Elysia } = await import("elysia");

  initModule.initializeDatabase(dbModule.sqlite);
  await seedModule.seedDatabase(dbModule.db);

  app = new Elysia({ prefix: "/api" }).use(routesModule.portfolioRoutes);
});

afterAll(() => {});

describe("portfolio routes", () => {
  test("GET /api/portfolio returns or auto-creates portfolio", async () => {
    const res = await requestJson<{ id: string }>(app, "GET", "/api/portfolio");
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
  });

  test("PUT /api/portfolio updates metadata", async () => {
    const res = await requestJson<{ metadata: Record<string, unknown> }>(
      app,
      "PUT",
      "/api/portfolio",
      { metadata: { title: "My Portfolio" } },
    );
    expect(res.status).toBe(200);
    expect(res.body.metadata).toEqual({ title: "My Portfolio" });
  });

  test("POST /api/portfolio/projects creates project", async () => {
    const res = await requestJson<{ id: string; title: string }>(
      app,
      "POST",
      "/api/portfolio/projects",
      {
        title: "Test Game Project",
        description: "A test project",
        technologies: ["Unity", "C#"],
      },
    );
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Test Game Project");
    expect(res.body.id).toBeDefined();
    projectId = res.body.id;
  });

  test("PUT /api/portfolio/projects/:id updates project", async () => {
    const res = await requestJson<{ title: string }>(
      app,
      "PUT",
      `/api/portfolio/projects/${projectId}`,
      { title: "Updated Project Title" },
    );
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated Project Title");
  });

  test("DELETE /api/portfolio/projects/:id removes project", async () => {
    const res = await requestJson<{ success: boolean }>(
      app,
      "DELETE",
      `/api/portfolio/projects/${projectId}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
