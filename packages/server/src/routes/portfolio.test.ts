import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { API_ENDPOINT_PREFIX, API_ENDPOINTS } from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_CREATED, HTTP_STATUS_OK } from "@bao/shared/constants/http";
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

  app = new Elysia({ prefix: API_ENDPOINT_PREFIX }).use(routesModule.portfolioRoutes);
});

afterAll(() => undefined);

function registerPortfolioBaselineTests(): void {
  test("GET portfolio returns or auto-creates portfolio", async () => {
    const res = await requestJson<{ id: string }>(app, "GET", API_ENDPOINTS.portfolio);
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(res.body.id).toBeDefined();
  });

  test("PUT portfolio updates metadata", async () => {
    const res = await requestJson<{ metadata: Record<string, unknown> }>(
      app,
      "PUT",
      API_ENDPOINTS.portfolio,
      { metadata: { title: "My Portfolio" } },
    );
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(res.body.metadata).toEqual({ title: "My Portfolio" });
  });
}

function registerPortfolioProjectMutationTests(): void {
  test("POST portfolio projects creates project", async () => {
    const res = await requestJson<{ id: string; title: string }>(
      app,
      "POST",
      API_ENDPOINTS.portfolioProjects,
      {
        title: "Test Game Project",
        description: "A test project",
        technologies: ["Unity", "C#"],
      },
    );
    expect(res.status).toBe(HTTP_STATUS_CREATED);
    expect(res.body.title).toBe("Test Game Project");
    expect(res.body.id).toBeDefined();
    projectId = res.body.id;
  });
}

function registerPortfolioProjectOrderingTests(): void {
  test("POST portfolio projects creates a second project for reorder coverage", async () => {
    const res = await requestJson<{ id: string; title: string }>(
      app,
      "POST",
      API_ENDPOINTS.portfolioProjects,
      {
        title: "Combat Sandbox",
        description: "A combat prototype focused on enemy readability.",
        technologies: ["Unreal Engine", "C++"],
      },
    );
    expect(res.status).toBe(HTTP_STATUS_CREATED);
    expect(res.body.id).toBeDefined();
    secondProjectId = res.body.id;
  });

  test("POST portfolio projects reorder persists the requested project order", async () => {
    const reorderResponse = await requestJson<{ projects: Array<{ id: string }> }>(
      app,
      "POST",
      API_ENDPOINTS.portfolioProjectsReorder,
      {
        orderedIds: [secondProjectId, projectId],
      },
    );
    expect(reorderResponse.status).toBe(HTTP_STATUS_OK);
    expect(reorderResponse.body.projects.map((project) => project.id)).toEqual([
      secondProjectId,
      projectId,
    ]);
  });
}

function registerPortfolioProjectLifecycleTests(): void {
  test("PUT portfolio project detail updates project", async () => {
    const res = await requestJson<{ title: string }>(
      app,
      "PUT",
      `${API_ENDPOINTS.portfolioProjects}/${projectId}`,
      { title: "Updated Project Title" },
    );
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(res.body.title).toBe("Updated Project Title");
  });

  test("DELETE portfolio project detail removes project", async () => {
    const res = await requestJson<{ success: boolean }>(
      app,
      "DELETE",
      `${API_ENDPOINTS.portfolioProjects}/${projectId}`,
    );
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(res.body.success).toBe(true);
  });
}

function registerPortfolioExportTests(): void {
  test("POST portfolio export returns a PDF attachment", async () => {
    const response = await app.handle(
      new Request(`http://localhost${API_ENDPOINTS.portfolio}/export`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ format: "pdf" }),
      }),
    );
    expect(response.status).toBe(HTTP_STATUS_OK);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain("portfolio-");
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });

  test("POST portfolio PDF template gaming embeds SSOT primary fill", async () => {
    const { PORTFOLIO_EXPORT_THEME_BY_TEMPLATE } = await import(
      "@bao/shared/constants/export-document-theme"
    );
    const { pdfStreamsContainRgbFill } = await import("@bao/shared/utils/pdf-streams");
    const response = await app.handle(
      new Request(`http://localhost${API_ENDPOINTS.portfolio}/export`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ format: "pdf", template: "gaming" }),
      }),
    );
    expect(response.status).toBe(HTTP_STATUS_OK);
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(
      pdfStreamsContainRgbFill(bytes, PORTFOLIO_EXPORT_THEME_BY_TEMPLATE.gaming.primary),
    ).toBe(true);
    expect(
      pdfStreamsContainRgbFill(bytes, PORTFOLIO_EXPORT_THEME_BY_TEMPLATE.modern.primary),
    ).toBe(false);
  });

  test("POST portfolio export returns a DOCX attachment", async () => {
    const response = await app.handle(
      new Request(`http://localhost${API_ENDPOINTS.portfolio}/export`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ format: "docx" }),
      }),
    );
    expect(response.status).toBe(HTTP_STATUS_OK);
    expect(response.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(response.headers.get("content-disposition")).toContain("portfolio-");
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });

  test("DELETE portfolio project detail removes the second project", async () => {
    const res = await requestJson<{ success: boolean }>(
      app,
      "DELETE",
      `${API_ENDPOINTS.portfolioProjects}/${secondProjectId}`,
    );
    expect(res.status).toBe(HTTP_STATUS_OK);
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
