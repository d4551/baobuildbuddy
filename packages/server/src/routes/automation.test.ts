import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { generateId } from "@bao/shared";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { automationRuns } from "../db/schema/automation-runs";
import { resumes } from "../db/schema/resumes";
import { applicationAutomationService } from "../services/automation/application-automation-service";
import { requestJson } from "../test-utils";

let app: { handle: (request: Request) => Response | Promise<Response> };
const resumeId = generateId();
const createdRunIds: string[] = [];
type RunJobApply = typeof applicationAutomationService.runJobApply;
const runJobApplyStub: RunJobApply = async (_runId, _payload, _onProgress) => {
  void _runId;
  void _payload;
  void _onProgress;
};

let originalRunJobApply: RunJobApply | undefined;

const requestStatusBody = async <T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: T | string }> => {
  const response = await app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers: body ? { "content-type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    }),
  );
  const payload = await response.text();
  try {
    return {
      status: response.status,
      body: JSON.parse(payload) as T,
    };
  } catch {
    return {
      status: response.status,
      body: payload,
    };
  }
};

beforeAll(async () => {
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const routesModule = await import("./automation.routes");
  const { Elysia } = await import("elysia");
  const dbModule = await import("../db/client");

  initModule.initializeDatabase(dbModule.sqlite);
  await seedModule.seedDatabase(dbModule.db);

  await db.insert(resumes).values({ id: resumeId });
  app = new Elysia({ prefix: "/api" }).use(routesModule.automationRoutes);
});

afterAll(async () => {
  if (createdRunIds.length > 0) {
    await Promise.all(
      createdRunIds.map((runId) => db.delete(automationRuns).where(eq(automationRuns.id, runId))),
    );
  }

  if (originalRunJobApply) {
    applicationAutomationService.runJobApply = originalRunJobApply;
    originalRunJobApply = undefined;
  }
});

describe("automation routes", () => {
  test("POST /api/automation/job-apply validates required fields", async () => {
    const res = await requestStatusBody<{ error: string }>("POST", "/api/automation/job-apply", {
      resumeId,
    });
    expect(res.status).toBe(422);
    if (typeof res.body === "string") {
      expect(res.body).toContain("Job URL is required");
    } else {
      expect(typeof res.body).toBe("object");
      expect(typeof res.body.error).toBe("string");
    }
  });

  test("POST /api/automation/job-apply rejects missing resume", async () => {
    const res = await requestJson<{ error: string }>(app, "POST", "/api/automation/job-apply", {
      jobUrl: "https://example.com/career/role",
      resumeId: "not-found-resume-id",
    });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("resume not found: not-found-resume-id");
  });

  test("POST /api/automation/job-apply enqueues a run and returns run contract", async () => {
    originalRunJobApply = applicationAutomationService.runJobApply;
    applicationAutomationService.runJobApply = runJobApplyStub;

    try {
      const res = await requestJson<{ runId: string; status: "running" }>(
        app,
        "POST",
        "/api/automation/job-apply",
        {
          jobUrl: "https://example.com/careers/engineering",
          resumeId,
        },
      );
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("running");
      expect(typeof res.body.runId).toBe("string");
      expect(res.body.runId.length).toBeGreaterThan(0);

      createdRunIds.push(res.body.runId);
      const run = await db
        .select()
        .from(automationRuns)
        .where(and(eq(automationRuns.id, res.body.runId), eq(automationRuns.type, "job_apply")))
        .limit(1);
      expect(run.length).toBe(1);
      expect(run[0].status).toBe("running");
      expect(run[0].jobId).toBeNull();
      expect(run[0].input).not.toBeNull();
    } finally {
      if (originalRunJobApply) {
        applicationAutomationService.runJobApply = originalRunJobApply;
        originalRunJobApply = undefined;
      }
    }
  });
});
