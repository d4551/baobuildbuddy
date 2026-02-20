import type { Database } from "bun:sqlite";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import type { InterviewResponse, InterviewSession } from "@bao/shared";
import type { AppRequestHandler } from "./test-utils";
import { requestJson } from "./test-utils";

interface TestHarness {
  app: AppRequestHandler;
  sqlite: Database;
  interviewService: {
    startSession(studioId: string, rawConfig?: Record<string, unknown>): Promise<InterviewSession>;
    addResponse(sessionId: string, response: InterviewResponse): Promise<InterviewSession | null>;
    getSession(id: string): Promise<InterviewSession | null>;
  };
}

async function createTestHarness(): Promise<TestHarness> {
  const dbModule = await import("./db/client");
  const interviewServiceModule = await import("./services/interview-service");
  const initModule = await import("./db/init");
  const routesModule = await import("./routes/interview.routes");
  const { Elysia } = await import("elysia");

  initModule.initializeDatabase(dbModule.sqlite);
  const seedModule = await import("./db/seed");
  await seedModule.seedDatabase(dbModule.db);

  const app = new Elysia({ prefix: "/api" }).use(routesModule.interviewRoutes);

  return {
    app,
    sqlite: dbModule.sqlite,
    interviewService: interviewServiceModule.interviewService,
  };
}

let harness: TestHarness;

beforeAll(async () => {
  harness = await createTestHarness();
});

beforeEach(() => {
  harness.sqlite.exec("DELETE FROM interview_sessions");
});

afterAll(() => {});

describe("interview service", () => {
  test("startSession applies config defaults and avoids technical questions when disabled", async () => {
    const created = await harness.interviewService.startSession("riot-games", {
      questionCount: 3,
      includeTechnical: false,
    });

    expect(created.status).toBe("active");
    expect(created.config.focusAreas).toEqual(["architecture", "collaboration", "problem-solving"]);
    expect(created.questions).toHaveLength(3);
    expect(created.questions.every((entry) => entry.type !== "technical")).toBe(true);
    expect(created.currentQuestionIndex).toBe(0);

    const persisted = await harness.interviewService.getSession(created.id);
    expect(persisted).not.toBeNull();
    expect(persisted?.totalQuestions).toBe(3);
  });

  test("addResponse stores AI feedback, completes session, and writes final analysis", async () => {
    const created = await harness.interviewService.startSession("electronic-arts", {
      questionCount: 1,
    });
    const firstQuestionId = created.questions[0]?.id;
    expect(firstQuestionId).toBeDefined();

    const response: InterviewResponse = {
      questionId: firstQuestionId,
      transcript:
        "I built a robust architecture by breaking the system into deterministic services, adding robust telemetry, and measuring each service-level latency.",
      duration: 540,
      timestamp: Date.now(),
      confidence: 0.9,
    };

    const completed = await harness.interviewService.addResponse(created.id, response);
    expect(completed).not.toBeNull();
    expect(completed?.status).toBe("completed");
    expect(completed?.responses).toHaveLength(1);
    expect(completed?.responses.at(0)?.aiAnalysis).toBeDefined();
    expect(completed?.finalAnalysis).toBeDefined();
  });

  test("addResponse returns null for missing sessions", async () => {
    const missing = await harness.interviewService.addResponse("missing-session", {
      questionId: "q-missing",
      transcript: "No session for this id.",
      duration: 120,
      timestamp: Date.now(),
      confidence: 0.8,
    });

    expect(missing).toBeNull();
  });
});

describe("interview API compatibility", () => {
  test("POST /api/interview/sessions accepts legacy role field and returns created payload", async () => {
    const response = await requestJson<{
      id: string;
      studioId: string;
      role: string;
      totalQuestions: number;
      message: string;
    }>(harness.app, "POST", "/api/interview/sessions", {
      studioId: "activision-blizzard",
      config: {
        role: "Build Engineer",
        questionCount: 1,
      },
    });

    expect(response.status).toBe(201);
    expect(response.body.studioId).toBe("activision-blizzard");
    expect(response.body.role).toBe("Build Engineer");
    expect(response.body.totalQuestions).toBe(1);
    expect(response.body.message).toBe("Interview session created");
  });

  test("POST /api/interview/sessions/:id/response accepts legacy answer payload", async () => {
    const created = await requestJson<{
      id: string;
      totalQuestions: number;
      totalResponses: number;
    }>(harness.app, "POST", "/api/interview/sessions", {
      studioId: "ubisoft",
      config: {
        roleType: "Technical Lead",
        questionCount: 1,
      },
    });

    const response = await requestJson<{
      status: string;
      totalResponses: number;
      message: string;
    }>(harness.app, "POST", `/api/interview/sessions/${created.body.id}/response`, {
      answer: "I structured the interview by evaluating throughput, latency, and failure domains.",
      questionIndex: 0,
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("completed");
    expect(response.body.totalResponses).toBe(1);
    expect(response.body.message).toBe("Response recorded");
  });
});
