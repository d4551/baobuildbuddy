import { beforeAll, describe, expect, test } from "bun:test";
import { hashApiKey } from "../utils/crypto";
import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import { createTestDbPath, requestJson } from "../test-utils";

type OpenApiOperation = {
  tags?: string[];
  description?: string;
};

type OpenApiSpec = {
  paths: Record<string, Record<string, OpenApiOperation>>;
};

const OPENAPI_METHODS = ["get", "post", "put", "patch", "delete", "options", "head"] as const;

const routeTagMatchers = [
  { prefix: toApiScopedPath(API_ENDPOINTS.health), tag: "Health" },
  { prefix: toApiScopedPath(API_ENDPOINTS.authBase), tag: "Auth" },
  { prefix: toApiScopedPath(API_ENDPOINTS.userBase), tag: "User" },
  { prefix: toApiScopedPath(API_ENDPOINTS.settings), tag: "Settings" },
  { prefix: toApiScopedPath(API_ENDPOINTS.jobsBase), tag: "Jobs" },
  { prefix: toApiScopedPath(API_ENDPOINTS.resumes), tag: "Resumes" },
  { prefix: toApiScopedPath(API_ENDPOINTS.coverLettersBase), tag: "Cover Letters" },
  { prefix: toApiScopedPath(API_ENDPOINTS.portfolioBase), tag: "Portfolio" },
  { prefix: toApiScopedPath(API_ENDPOINTS.interviewBase), tag: "Interview" },
  { prefix: toApiScopedPath(API_ENDPOINTS.studiosBase), tag: "Studios" },
  { prefix: toApiScopedPath(API_ENDPOINTS.scraperBase), tag: "Scraper" },
  { prefix: toApiScopedPath(API_ENDPOINTS.aiBase), tag: "AI" },
  { prefix: toApiScopedPath(API_ENDPOINTS.gamificationBase), tag: "Gamification" },
  { prefix: toApiScopedPath(API_ENDPOINTS.skillsBase), tag: "Skill Mapping" },
  { prefix: toApiScopedPath(API_ENDPOINTS.searchBase), tag: "Search" },
  { prefix: toApiScopedPath(API_ENDPOINTS.statsBase), tag: "Stats" },
  { prefix: toApiScopedPath(API_ENDPOINTS.automationBase), tag: "Automation" },
  { prefix: toApiScopedPath(API_ENDPOINTS.speechBase), tag: "Speech" },
] as const;

const resolveExpectedTag = (path: string): string | null => {
  const scopedPath = toApiScopedPath(path);
  if (scopedPath === toApiScopedPath(API_ENDPOINTS.apiDocsUi)) {
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

const TEST_AUTH_KEY = "bao_opentag_test_key";

beforeAll(async () => {
  Bun.env.DB_PATH = createTestDbPath("openapi-tags");

  const dbModule = await import("../db/client");
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const { auth } = await import("../db/schema/auth");
  const appModule = await import("../app");

  initModule.initializeDatabase(dbModule.sqlite);
  seedModule.seedDatabase(dbModule.db);

  await dbModule.db
    .insert(auth)
    .values({
      id: DEFAULT_PROFILE_ID,
      apiKeyHash: hashApiKey(TEST_AUTH_KEY),
      apiKeyCreatedAt: new Date().toISOString(),
      apiKeyExpiresAt: null,
      apiKeyRevokedAt: null,
    })
    .onConflictDoUpdate({
      target: auth.id,
      set: {
        apiKeyHash: hashApiKey(TEST_AUTH_KEY),
        apiKeyCreatedAt: new Date().toISOString(),
        apiKeyExpiresAt: null,
        apiKeyRevokedAt: null,
      },
    });

  app = appModule.app;
});

describe("openapi tags", () => {
  test("generated OpenAPI spec tags every documented API operation", async () => {
    const response = await requestJson<OpenApiSpec>(app, "GET", API_ENDPOINTS.apiDocsJson, { Authorization: `Bearer ${TEST_AUTH_KEY}` });
    expect(response.status).toBe(200);

    for (const [path, operations] of Object.entries(response.body.paths)) {
      for (const method of OPENAPI_METHODS) {
        const operation = operations[method];
        if (!operation) {
          continue;
        }

        // WebSocket operations are documented without HTTP OpenAPI tags.
        if (path.includes("/ws/")) {
          continue;
        }

        const expectedTag = resolveExpectedTag(path);
        // Routes without an expected tag prefix are fine (e.g. auth lifecycle routes)
        if (!expectedTag) {
          continue;
        }
        // Fail-closed: documented API ops under known prefixes must publish tags + description.
        // Log path/method on failure for LDL debugging.
        if (!operation.tags || operation.tags.length === 0) {
          throw new Error(`OpenAPI operation missing tags: ${method.toUpperCase()} ${path}`);
        }
        expect(operation.tags).toContain(expectedTag);
        const description = operation.description?.trim() ?? "";
        if (description.length < 12) {
          throw new Error(
            `OpenAPI operation missing description (≥12 chars): ${method.toUpperCase()} ${path}`,
          );
        }
      }
    }
  });
});
