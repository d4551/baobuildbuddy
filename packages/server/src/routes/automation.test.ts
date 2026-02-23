import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { generateId } from "@bao/shared";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { automationRuns } from "../db/schema/automation-runs";
import { resumes } from "../db/schema/resumes";
import { applicationAutomationService } from "../services/automation/application-automation-service";
import { requestJson } from "../test-utils";

let app: { handle: (request: Request) => Response | Promise<Response> };
const resumeId = generateId();
const createdRunIds: string[] = [];
type RunJobApply = typeof applicationAutomationService.runJobApply;
type RunEmailResponse = typeof applicationAutomationService.runEmailResponse;
const runJobApplyStub: RunJobApply = async (_runId, _payload, _onProgress) => {
  void _runId;
  void _payload;
  void _onProgress;
};
const runEmailResponseStub: RunEmailResponse = async (_payload) => {
  const now = new Date().toISOString();
  const runId = generateId();
  await db.insert(automationRuns).values({
    id: runId,
    type: "email",
    status: "success",
    jobId: null,
    userId: null,
    input: {
      subject: _payload.subject,
      message: _payload.message,
      tone: _payload.tone ?? "professional",
      ...(typeof _payload.sender === "string" && _payload.sender.length > 0
        ? { sender: _payload.sender }
        : {}),
    },
    output: {
      success: true,
      reply: "Stubbed email response",
      provider: "stub-provider",
      model: "stub-model",
    },
    progress: 100,
    currentStep: 1,
    totalSteps: 1,
    startedAt: now,
    completedAt: now,
    createdAt: now,
    updatedAt: now,
    exitCode: 0,
    timedOut: false,
    aborted: false,
    executionMs: 1,
  });
  return {
    runId,
    status: "success",
    reply: "Stubbed email response",
    provider: "stub-provider",
    model: "stub-model",
  };
};

let originalRunJobApply: RunJobApply | undefined;
let originalRunEmailResponse: RunEmailResponse | undefined;
const CLEANUP_AUTOMATION_TYPES = ["job_apply", "email"] as const;
const settlePromise = async <T>(operation: Promise<T>): Promise<PromiseSettledResult<T>> => {
  const [result] = await Promise.allSettled([operation]);
  return result;
};

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
  const parsedPayloadResult = await settlePromise(
    Promise.resolve(payload).then((content) => JSON.parse(content) as T),
  );

  if (parsedPayloadResult.status === "fulfilled") {
    return {
      status: response.status,
      body: parsedPayloadResult.value,
    };
  }

  return {
    status: response.status,
    body: payload,
  };
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

beforeEach(async () => {
  await db
    .delete(automationRuns)
    .where(inArray(automationRuns.type, [...CLEANUP_AUTOMATION_TYPES]));
  createdRunIds.length = 0;
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
  if (originalRunEmailResponse) {
    applicationAutomationService.runEmailResponse = originalRunEmailResponse;
    originalRunEmailResponse = undefined;
  }
});

describe("automation routes", () => {
  test("POST /api/automation/job-apply validates required fields", async () => {
    const res = await requestStatusBody<{ error: { code: string; message: string } }>(
      "POST",
      "/api/automation/job-apply",
      {
        resumeId,
      },
    );
    expect(res.status).toBe(422);
    if (typeof res.body === "string") {
      expect(res.body).toContain("Job URL is required");
    } else {
      expect(typeof res.body).toBe("object");
      expect(typeof res.body.error.message).toBe("string");
    }
  });

  test("POST /api/automation/job-apply rejects missing resume", async () => {
    const res = await requestJson<{ error: { code: string; message: string } }>(
      app,
      "POST",
      "/api/automation/job-apply",
      {
        jobUrl: "https://example.com/career/role",
        resumeId: "not-found-resume-id",
      },
    );
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe("resume not found: not-found-resume-id");
  });

  test("POST /api/automation/job-apply enqueues a run and returns run contract", async () => {
    originalRunJobApply = applicationAutomationService.runJobApply;
    applicationAutomationService.runJobApply = runJobApplyStub;

    await Promise.resolve()
      .then(async () => {
        const res = await requestJson<{ id: string; status: "running" }>(
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
        expect(typeof res.body.id).toBe("string");
        expect(res.body.id.length).toBeGreaterThan(0);

        createdRunIds.push(res.body.id);
        const run = await db
          .select()
          .from(automationRuns)
          .where(and(eq(automationRuns.id, res.body.id), eq(automationRuns.type, "job_apply")))
          .limit(1);
        expect(run.length).toBe(1);
        expect(run[0].status).toBe("running");
        expect(run[0].jobId).toBeNull();
        expect(run[0].input).not.toBeNull();
      })
      .finally(() => {
        if (originalRunJobApply) {
          applicationAutomationService.runJobApply = originalRunJobApply;
          originalRunJobApply = undefined;
        }
      });
  });

  test("POST /api/automation/job-apply/schedule validates runAt", async () => {
    const res = await requestJson<{ error: { code: string; message: string } }>(
      app,
      "POST",
      "/api/automation/job-apply/schedule",
      {
        jobUrl: "https://example.com/careers/engineering",
        resumeId,
        runAt: "not-a-date",
      },
    );

    expect(res.status).toBe(422);
    expect(res.body.error.message).toContain("runAt");
  });

  test("POST /api/automation/job-apply/schedule creates a pending run", async () => {
    const runAt = new Date(Date.now() + 300_000).toISOString();
    const res = await requestJson<{
      id: string;
      status: "pending";
      input: Record<string, unknown> | null;
    }>(app, "POST", "/api/automation/job-apply/schedule", {
      jobUrl: "https://example.com/careers/engineering",
      resumeId,
      runAt,
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("pending");
    const scheduleValue =
      res.body.input && typeof res.body.input === "object" && "schedule" in res.body.input
        ? res.body.input.schedule
        : null;
    const scheduledRunAt =
      scheduleValue && typeof scheduleValue === "object" && "runAt" in scheduleValue
        ? scheduleValue.runAt
        : null;
    expect(scheduledRunAt).toBe(runAt);
    createdRunIds.push(res.body.id);

    const run = await db
      .select()
      .from(automationRuns)
      .where(and(eq(automationRuns.id, res.body.id), eq(automationRuns.type, "job_apply")))
      .limit(1);

    expect(run.length).toBe(1);
    expect(run[0].status).toBe("pending");
    expect(run[0].input).not.toBeNull();
  });

  test("POST /api/automation/email-response creates a successful email run", async () => {
    originalRunEmailResponse = applicationAutomationService.runEmailResponse;
    applicationAutomationService.runEmailResponse = runEmailResponseStub;

    const res = await requestJson<{
      runId: string;
      status: "success";
      reply: string;
      provider: string;
      model: string;
    }>(app, "POST", "/api/automation/email-response", {
      subject: "Interview follow-up",
      message: "Thanks for the interview. Can we discuss next steps?",
      tone: "professional",
    }).finally(() => {
      if (originalRunEmailResponse) {
        applicationAutomationService.runEmailResponse = originalRunEmailResponse;
        originalRunEmailResponse = undefined;
      }
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.reply.length).toBeGreaterThan(0);
    createdRunIds.push(res.body.runId);

    const run = await db
      .select()
      .from(automationRuns)
      .where(and(eq(automationRuns.id, res.body.runId), eq(automationRuns.type, "email")))
      .limit(1);

    expect(run.length).toBe(1);
    expect(run[0].status).toBe("success");
    expect(run[0].output).not.toBeNull();
  });
});
