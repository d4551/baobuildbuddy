import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { requestJson } from "../test-utils";

let app: { handle: (request: Request) => Response | Promise<Response> };
let projectId: string;
let secondProjectId: string;

beforeAll(async () => {
  const dbModule = await import("../db/client");
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const routesModule = await import("./portfolio.routes");
  const { Elysia } = await import("elysia");

  initModule.initializeDatabase(dbModule.sqlite);
  seedModule.seedDatabase(dbModule.db);

  app = new Elysia({ prefix: "/api" }).use(routesModule.portfolioRoutes);
});

afterAll(() => {});

function registerPortfolioBaselineTests(): void {
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
}

function registerPortfolioProjectMutationTests(): void {
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
}

function registerPortfolioProjectOrderingTests(): void {
  test("POST /api/portfolio/projects creates a second project for reorder coverage", async () => {
    const res = await requestJson<{ id: string; title: string }>(
      app,
      "POST",
      "/api/portfolio/projects",
      {
        title: "Combat Sandbox",
        description: "A combat prototype focused on enemy readability.",
        technologies: ["Unreal Engine", "C++"],
      },
    );
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    secondProjectId = res.body.id;
  });

  test("POST /api/portfolio/projects/reorder persists the requested project order", async () => {
    const reorderResponse = await requestJson<{ projects: Array<{ id: string }> }>(
      app,
      "POST",
      "/api/portfolio/projects/reorder",
      {
        orderedIds: [secondProjectId, projectId],
      },
    );
    expect(reorderResponse.status).toBe(200);
    expect(reorderResponse.body.projects.map((project) => project.id)).toEqual([
      secondProjectId,
      projectId,
    ]);
  });
}

function registerPortfolioProjectLifecycleTests(): void {
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
}

function registerPortfolioExportTests(): void {
  test("POST /api/portfolio/export returns a PDF attachment", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/portfolio/export", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ format: "pdf" }),
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain("portfolio-");
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });

  test("DELETE /api/portfolio/projects/:id removes the second project", async () => {
    const res = await requestJson<{ success: boolean }>(
      app,
      "DELETE",
      `/api/portfolio/projects/${secondProjectId}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
}

describe("portfolio routes", () => {
  registerPortfolioBaselineTests();
  registerPortfolioProjectMutationTests();
  registerPortfolioProjectOrderingTests();
  registerPortfolioProjectLifecycleTests();
  registerPortfolioExportTests();
});
