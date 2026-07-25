import { afterAll, afterEach, beforeAll, expect, mock, spyOn, test } from "bun:test";
import { AI_CHAT_API_ENDPOINT } from "@bao/shared/constants/ai-chat";
import { API_ENDPOINT_PREFIX, API_ENDPOINTS } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "@bao/shared/constants/http";
import { APP_ROUTES } from "@bao/shared/constants/routes";
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

  app = new Elysia({ prefix: API_ENDPOINT_PREFIX }).use(routesModule.aiRoutes);
});

afterAll(() => undefined);

afterEach(() => {
  mock.restore();
});

test("GET ai models returns the shared AI control-plane contract", async () => {
  const res = await requestJson<{
    aiRouting?: { chat?: { provider?: string; model?: string } };
    preferredProvider?: string;
    preferredModel?: string | null;
    providerDiagnostics?: Record<string, { provider?: string }>;
    providers?: Array<{ id?: string; selectedModel?: string }>;
    configuredProviders?: string[];
  }>(app, "GET", API_ENDPOINTS.aiModels);

  expect(res.status).toBe(HTTP_STATUS_OK);
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

test("POST ai chat accepts message", async () => {
  const service = AIService.fromSettings(undefined);
  spyOn(service, "generate").mockResolvedValue({
    id: "mock-chat-1",
    content: "Hello from mocked provider",
    provider: "local",
    model: "mock-model",
  });
  spyOn(AIService, "fromSettings").mockReturnValue(service);

  const res = await requestJson<{
    message?: string;
    provider?: string;
    model?: string;
    error?: string;
  }>(app, "POST", AI_CHAT_API_ENDPOINT, {
    message: "Hello, BaoBuildBuddy!",
    sessionId: "test-session",
  });
  expect(res.status).toBe(HTTP_STATUS_OK);
  expect(res.body.message).toBe("Hello from mocked provider");
  expect(res.body.provider).toBe("local");
  expect(res.body.model).toBe("mock-model");
});

test("POST ai chat requires message (validation error)", async () => {
  const res = await requestJson<{ error?: string }>(app, "POST", AI_CHAT_API_ENDPOINT, {});
  expect([HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_UNPROCESSABLE_ENTITY]).toContain(res.status);
});

test("POST ai chat accepts contextual payload without validation drift", async () => {
  const service = AIService.fromSettings(undefined);
  spyOn(service, "generate").mockResolvedValue({
    id: "mock-chat-2",
    content: "Context-aware mock reply",
    provider: "local",
    model: "mock-model",
  });
  spyOn(AIService, "fromSettings").mockReturnValue(service);

  const res = await requestJson<{
    message?: string;
    provider?: string;
    model?: string;
    contextDomain?: string;
    error?: string;
  }>(app, "POST", AI_CHAT_API_ENDPOINT, {
    message: "Help me prep for this role.",
    sessionId: "context-session",
    context: {
      source: "floating-widget",
      domain: "interview",
      route: {
        path: APP_ROUTES.interview,
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
  });
  expect(res.status).toBe(HTTP_STATUS_OK);
  expect(res.body.message).toBe("Context-aware mock reply");
  expect(res.body.contextDomain).toBe("interview");
  expect(res.body.provider).toBe("local");
});

test("GET ai models preserves configured providers when provider probing fails", async () => {
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
  }>(app, "GET", API_ENDPOINTS.aiModels);

  expect(res.status).toBe(HTTP_STATUS_OK);
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
