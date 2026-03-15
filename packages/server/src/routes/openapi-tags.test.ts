import { API_ENDPOINTS } from "@bao/shared";
import { beforeAll, describe, expect, test } from "bun:test";
import { createTestDbPath, requestJson } from "../test-utils";

type OpenApiOperation = {
  tags?: string[];
};

type OpenApiSpec = {
  paths: Record<string, Record<string, OpenApiOperation>>;
};

const OPENAPI_METHODS = ["get", "post", "put", "patch", "delete", "options", "head"] as const;

const routeTagMatchers = [
  { prefix: "/health", tag: "Health" },
  { prefix: "/auth", tag: "Auth" },
  { prefix: "/user", tag: "User" },
  { prefix: "/settings", tag: "Settings" },
  { prefix: "/jobs", tag: "Jobs" },
  { prefix: "/resumes", tag: "Resumes" },
  { prefix: "/cover-letters", tag: "Cover Letters" },
  { prefix: "/portfolio", tag: "Portfolio" },
  { prefix: "/interview", tag: "Interview" },
  { prefix: "/studios", tag: "Studios" },
  { prefix: "/scraper", tag: "Scraper" },
  { prefix: "/ai", tag: "AI" },
  { prefix: "/gamification", tag: "Gamification" },
  { prefix: "/skills", tag: "Skill Mapping" },
  { prefix: "/search", tag: "Search" },
  { prefix: "/stats", tag: "Stats" },
  { prefix: "/automation", tag: "Automation" },
] as const;

const resolveExpectedTag = (path: string): string | null => {
  const scopedPath = path.startsWith("/api/") ? path.slice("/api".length) : path;
  if (scopedPath.startsWith("/docs/api")) {
    return null;
  }

  for (const matcher of routeTagMatchers) {
    if (scopedPath === matcher.prefix || scopedPath.startsWith(`${matcher.prefix}/`)) {
      return matcher.tag;
    }
  }

  return null;
};

let app: { handle: (request: Request) => Response | Promise<Response> };

beforeAll(async () => {
  Bun.env.DB_PATH = createTestDbPath("openapi-tags");

  const dbModule = await import("../db/client");
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const appModule = await import("../app");

  initModule.initializeDatabase(dbModule.sqlite);
  seedModule.seedDatabase(dbModule.db);
  app = appModule.app;
});

describe("openapi tags", () => {
  test("generated OpenAPI spec tags every documented API operation", async () => {
    const response = await requestJson<OpenApiSpec>(app, "GET", API_ENDPOINTS.apiDocsJson);
    expect(response.status).toBe(200);

    for (const [path, operations] of Object.entries(response.body.paths)) {
      for (const method of OPENAPI_METHODS) {
        const operation = operations[method];
        if (!operation) {
          continue;
        }

        const expectedTag = resolveExpectedTag(path);
        expect(expectedTag).not.toBeNull();
        expect(operation.tags).toBeArray();
        expect(operation.tags?.length).toBeGreaterThan(0);
        expect(operation.tags).toContain(expectedTag as string);
      }
    }
  });
});
