import { afterAll, afterEach, beforeAll, expect, mock, spyOn, test } from "bun:test";
import { AI_CHAT_API_ENDPOINT } from "@bao/shared";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { DEFAULT_SETTINGS_ID, settings } from "../db/schema/settings";
import { AIService } from "../services/ai/ai-service";
import { requestJson } from "../test-utils";

let app: { handle: (request: Request) => Response | Promise<Response> };

beforeAll(async () => {
  const dbModule = await import("../db/client");
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const routesModule = await import("./ai.routes");
  const { Elysia } = await import("elysia");

  initModule.initializeDatabase(dbModule.sqlite);
  seedModule.seedDatabase(dbModule.db);

  app = new Elysia({ prefix: "/api" }).use(routesModule.aiRoutes);
});

afterAll(() => {});

afterEach(() => {
  mock.restore();
});

test("GET /api/ai/models returns the shared AI control-plane contract", async () => {
  const res = await requestJson<{
    aiRouting?: { chat?: { provider?: string; model?: string } };
    preferredProvider?: string;
    preferredModel?: string | null;
    providerDiagnostics?: Record<string, { provider?: string }>;
    providers?: Array<{ id?: string; selectedModel?: string }>;
    configuredProviders?: string[];
  }>(app, "GET", "/api/ai/models");

  expect(res.status).toBe(200);
  expect(res.body.aiRouting?.chat?.provider).toBe(res.body.preferredProvider);
  expect(Array.isArray(res.body.providers)).toBe(true);
  expect(Array.isArray(res.body.configuredProviders)).toBe(true);

  for (const provider of res.body.providers ?? []) {
    if (!provider.id) {
      continue;
    }
    expect(res.body.providerDiagnostics?.[provider.id]?.provider).toBe(provider.id);
  }
});

test("POST /api/ai/chat accepts message", async () => {
  const res = await requestJson<{ content?: string; error?: string }>(
    app,
    "POST",
    AI_CHAT_API_ENDPOINT,
    {
      message: "Hello, BaoBuildBuddy!",
      sessionId: "test-session",
    },
  );
  expect([200, 500]).toContain(res.status);
  expect(res.body).toBeDefined();
});

test("POST /api/ai/chat requires message (validation error)", async () => {
  const res = await requestJson<{ error?: string }>(app, "POST", AI_CHAT_API_ENDPOINT, {});
  expect([400, 422]).toContain(res.status);
});

test("POST /api/ai/chat accepts contextual payload without validation drift", async () => {
  const res = await requestJson<{ content?: string; error?: string }>(
    app,
    "POST",
    AI_CHAT_API_ENDPOINT,
    {
      message: "Help me prep for this role.",
      sessionId: "context-session",
      context: {
        source: "floating-widget",
        domain: "interview",
        route: {
          path: "/interview",
          name: "interview",
          params: {},
          query: { job: "job-123" },
        },
        entity: {
          type: "job",
          id: "job-123",
          label: "Gameplay Engineer at Studio",
        },
        state: {
          hasResumes: true,
          resumeCount: 2,
          hasJobs: true,
          jobCount: 48,
          hasStudios: true,
          studioCount: 1,
          hasInterviewSessions: true,
          interviewSessionCount: 5,
          hasPortfolioProjects: false,
          portfolioProjectCount: 0,
        },
      },
    },
  );
  expect([200, 500]).toContain(res.status);
  expect(res.body).toBeDefined();
});

test("GET /api/ai/models preserves configured providers when provider probing fails", async () => {
  await db
    .update(settings)
    .set({
      openaiApiKey: "sk-test-openai",
      localModelEndpoint: "http://localhost:11434/v1",
      localModelName: "qwen2.5:0.5b",
    })
    .where(eq(settings.id, DEFAULT_SETTINGS_ID));

  spyOn(AIService.prototype, "getAvailableProviders").mockRejectedValue(new Error("probe failed"));

  const res = await requestJson<{
    error?: string;
    configuredProviders?: string[];
    providerDiagnostics?: Record<string, { code?: string; endpoint?: string; message?: string }>;
    providers?: Array<{ id?: string; health?: string }>;
  }>(app, "GET", "/api/ai/models");

  expect(res.status).toBe(200);
  expect(res.body.error).toBe("probe failed");
  expect(res.body.configuredProviders).toContain("local");
  expect(res.body.configuredProviders).toContain("openai");
  expect(res.body.providerDiagnostics?.local?.code).toBe("error");
  expect(res.body.providerDiagnostics?.local?.endpoint).toBe("http://localhost:11434/v1");
  expect(res.body.providerDiagnostics?.local?.message).toBe("probe failed");
  expect(res.body.providerDiagnostics?.openai?.code).toBe("error");
  expect(res.body.providerDiagnostics?.openai?.message).toBe("probe failed");
  expect(res.body.providerDiagnostics?.claude?.code).toBe("unconfigured");
  expect(res.body.providers?.find((provider) => provider.id === "local")?.health).toBe("degraded");
  expect(res.body.providers?.find((provider) => provider.id === "openai")?.health).toBe("degraded");
  expect(res.body.providers?.find((provider) => provider.id === "claude")?.health).toBe(
    "unconfigured",
  );
});
