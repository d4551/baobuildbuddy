import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { generateId } from "@bao/shared";
import { requestJson } from "../test-utils";

let app: { handle: (request: Request) => Response | Promise<Response> };
let createdId: string;
let questionnaireResumeId: string;
let jobId: string;

beforeAll(async () => {
  const dbModule = await import("../db/client");
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const routesModule = await import("./resume.routes");
  const schemaModule = await import("../db/schema/jobs");
  const { Elysia } = await import("elysia");

  initModule.initializeDatabase(dbModule.sqlite);
  seedModule.seedDatabase(dbModule.db);
  jobId = generateId();
  await dbModule.db.insert(schemaModule.jobs).values({
    id: jobId,
    title: "Gameplay Engineer",
    company: "Test Studio",
    location: "Remote",
    description: "Build gameplay systems with TypeScript and Bun.",
    requirements: ["TypeScript", "Gameplay systems", "Testing"],
    technologies: ["TypeScript", "Bun"],
    url: "https://example.test/jobs/gameplay-engineer",
    source: "test",
    type: "full-time",
  });

  app = new Elysia({ prefix: "/api" }).use(routesModule.resumeRoutes);
});

afterAll(() => {});

function registerQuestionnaireRouteTests(): void {
  test("POST /api/resumes/from-questions/generate returns interview questionnaire prompts", async () => {
    const res = await requestJson<{ questions: Array<{ id: string; question: string }> }>(
      app,
      "POST",
      "/api/resumes/from-questions/generate",
      {
        targetRole: "Technical Designer",
        studioName: "Test Studio",
        experienceLevel: "mid",
      },
    );
    expect(res.status).toBe(200);
    expect(res.body.questions.length).toBeGreaterThan(0);
    expect(typeof res.body.questions[0]?.question).toBe("string");
  });

  test("POST /api/resumes/from-questions/synthesize creates a dynamic resume payload", async () => {
    const res = await requestJson<{ id: string; name: string; summary: string }>(
      app,
      "POST",
      "/api/resumes/from-questions/synthesize",
      {
        questionsAndAnswers: [
          {
            id: "career-target",
            question: "What role are you targeting?",
            answer: "Gameplay Programmer",
            category: "role",
          },
          {
            id: "strengths",
            question: "What is your biggest strength?",
            answer: "Shipping combat systems and collaborating with designers.",
            category: "strengths",
          },
        ],
      },
    );
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name.length).toBeGreaterThan(0);
    questionnaireResumeId = res.body.id;
  });
}

function registerResumeCrudTests(): void {
  test("POST /api/resumes creates resume", async () => {
    const res = await requestJson<{ id: string; name: string }>(app, "POST", "/api/resumes", {
      name: "Test Resume",
      summary: "A test summary",
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Test Resume");
    expect(res.body.id).toBeDefined();
    createdId = res.body.id;
  });

  test("GET /api/resumes returns list", async () => {
    const res = await requestJson<Array<{ id: string }>>(app, "GET", "/api/resumes");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /api/resumes/:id returns created resume", async () => {
    const res = await requestJson<{ id: string; name: string }>(
      app,
      "GET",
      `/api/resumes/${createdId}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdId);
    expect(res.body.name).toBe("Test Resume");
  });

  test("GET /api/resumes/:id returns 404 for missing", async () => {
    const res = await requestJson<{ error: string }>(app, "GET", "/api/resumes/nonexistent-id");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Resume not found");
  });
}

function registerResumeDynamicFlowTests(): void {
  test("PUT /api/resumes/:id updates resume", async () => {
    const res = await requestJson<{ name: string }>(app, "PUT", `/api/resumes/${createdId}`, {
      name: "Updated Resume",
    });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Resume");
  });

  test("POST /api/resumes/:id/ai-enhance returns structured suggestions", async () => {
    const res = await requestJson<{
      section: string;
      suggestions: Array<Record<string, unknown>>;
    }>(app, "POST", `/api/resumes/${createdId}/ai-enhance`, {
      section: "summary",
    });
    expect(res.status).toBe(200);
    expect(res.body.section).toBe("summary");
    expect(res.body.suggestions.length).toBeGreaterThan(0);
  });

  test("POST /api/resumes/:id/ai-score returns dynamic scoring details", async () => {
    const res = await requestJson<{
      jobId: string;
      score: number;
      strengths: string[];
      improvements: string[];
      keywords: string[];
    }>(app, "POST", `/api/resumes/${createdId}/ai-score`, {
      jobId,
    });
    expect(res.status).toBe(200);
    expect(res.body.jobId).toBe(jobId);
    expect(typeof res.body.score).toBe("number");
    expect(Array.isArray(res.body.strengths)).toBe(true);
    expect(Array.isArray(res.body.improvements)).toBe(true);
    expect(Array.isArray(res.body.keywords)).toBe(true);
  });

  test("POST /api/resumes/:id/export returns a PDF attachment", async () => {
    const response = await app.handle(
      new Request(`http://localhost/api/resumes/${createdId}/export`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ format: "pdf" }),
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain(`resume-${createdId}.pdf`);
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });

  test("POST /api/resumes/:id/export returns a DOCX attachment", async () => {
    const response = await app.handle(
      new Request(`http://localhost/api/resumes/${createdId}/export`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ format: "docx" }),
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(response.headers.get("content-disposition")).toContain(`resume-${createdId}.docx`);
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });
}

function registerResumeDeletionTests(): void {
  test("DELETE /api/resumes/:id removes resume", async () => {
    const res = await requestJson<{ success: boolean; id: string }>(
      app,
      "DELETE",
      `/api/resumes/${createdId}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBe(createdId);
  });

  test("GET /api/resumes/:id returns 404 after delete", async () => {
    const res = await requestJson<{ error: string }>(app, "GET", `/api/resumes/${createdId}`);
    expect(res.status).toBe(404);
  });

  test("GET /api/resumes/:id still returns synthesized resumes", async () => {
    const res = await requestJson<{ id: string }>(
      app,
      "GET",
      `/api/resumes/${questionnaireResumeId}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(questionnaireResumeId);
  });
}

describe("resume routes", () => {
  registerQuestionnaireRouteTests();
  registerResumeCrudTests();
  registerResumeDynamicFlowTests();
  registerResumeDeletionTests();
});
