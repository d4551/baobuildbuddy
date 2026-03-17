import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { generateId, settle } from "@bao/shared";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { automationRuns } from "../db/schema/automation-runs";
import { resumes } from "../db/schema/resumes";
import { applicationAutomationService } from "../services/automation/application-automation-service";
import { scraperService } from "../services/scraper-service";
import { requestJson } from "../test-utils";

let app: { handle: (request: Request) => Response | Promise<Response> };
const resumeId = generateId();
const createdRunIds: string[] = [];
type RunJobApply = typeof applicationAutomationService.runJobApply;
type RunEmailResponse = typeof applicationAutomationService.runEmailResponse;
type ScrapeJobsForTarget = typeof scraperService.scrapeJobsForTarget;
const runJobApplyStub: RunJobApply = () => Promise.resolve();
const runEmailResponseStub: RunEmailResponse = async (payload) => {
  const now = new Date().toISOString();
  const runId = generateId();
  await db.insert(automationRuns).values({
    id: runId,
    type: "email",
    status: "success",
    jobId: null,
    userId: null,
    input: {
      subject: payload.subject,
      message: payload.message,
      tone: payload.tone ?? "professional",
      ...(typeof payload.sender === "string" && payload.sender.length > 0
        ? { sender: payload.sender }
        : {}),
    },
    output: {
      success: true,
      reply: "Stubbed email response",
      provider: "stub-provider",
      model: "stub-model",
      delivered: payload.deliverAfterGeneration === true,
      ...(payload.recipientEmail ? { recipientEmail: payload.recipientEmail } : {}),
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
    delivered: payload.deliverAfterGeneration === true,
    ...(payload.recipientEmail ? { recipientEmail: payload.recipientEmail } : {}),
  };
};

let originalRunJobApply: RunJobApply | undefined;
let originalRunEmailResponse: RunEmailResponse | undefined;
let originalScrapeJobsForTarget: ScrapeJobsForTarget | undefined;
const CLEANUP_AUTOMATION_TYPES = ["job_apply", "email", "scrape"] as const;

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
  const parsedPayloadResult = await settle(
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
  seedModule.seedDatabase(dbModule.db);

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
  if (originalScrapeJobsForTarget) {
    scraperService.scrapeJobsForTarget = originalScrapeJobsForTarget;
    originalScrapeJobsForTarget = undefined;
  }
});

function registerJobApplyValidationTest(): void {
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
}

function registerMissingResumeTest(): void {
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
}

function registerJobApplyEnqueueTest(): void {
  test("POST /api/automation/job-apply enqueues a run and returns run contract", async () => {
    originalRunJobApply = applicationAutomationService.runJobApply.bind(
      applicationAutomationService,
    );
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
}

function registerScheduleValidationTest(): void {
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
}

function registerScheduleCreationTest(): void {
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
}

function registerEmailResponseTest(): void {
  test("POST /api/automation/email-response creates a successful email run", async () => {
    originalRunEmailResponse = applicationAutomationService.runEmailResponse.bind(
      applicationAutomationService,
    );
    applicationAutomationService.runEmailResponse = runEmailResponseStub;

    const res = await requestJson<{
      runId: string;
      status: "success";
      reply: string;
      provider: string;
      model: string;
      delivered: boolean;
      recipientEmail?: string;
    }>(app, "POST", "/api/automation/email-response", {
      subject: "Interview follow-up",
      message: "Thanks for the interview. Can we discuss next steps?",
      tone: "professional",
      recipientEmail: "recruiter@example.com",
      deliverAfterGeneration: true,
    }).finally(() => {
      if (originalRunEmailResponse) {
        applicationAutomationService.runEmailResponse = originalRunEmailResponse;
        originalRunEmailResponse = undefined;
      }
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.reply.length).toBeGreaterThan(0);
    expect(res.body.delivered).toBe(true);
    expect(res.body.recipientEmail).toBe("recruiter@example.com");
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
}

function registerScheduledEmailResponseTest(): void {
  test("POST /api/automation/email-response/schedule creates a pending email run", async () => {
    const runAt = new Date(Date.now() + 300_000).toISOString();
    const res = await requestJson<{
      id: string;
      status: "pending";
      input: Record<string, unknown> | null;
    }>(app, "POST", "/api/automation/email-response/schedule", {
      subject: "Interview follow-up",
      message: "Thanks again for the interview. I would love to continue the process.",
      tone: "friendly",
      deliverAfterGeneration: false,
      runAt,
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("pending");
    const input = res.body.input;
    const scheduledRunAt =
      input &&
      typeof input === "object" &&
      "schedule" in input &&
      input.schedule &&
      typeof input.schedule === "object" &&
      "runAt" in input.schedule
        ? input.schedule.runAt
        : null;
    expect(scheduledRunAt).toBe(runAt);
    createdRunIds.push(res.body.id);

    const run = await db
      .select()
      .from(automationRuns)
      .where(and(eq(automationRuns.id, res.body.id), eq(automationRuns.type, "email")))
      .limit(1);

    expect(run.length).toBe(1);
    expect(run[0].status).toBe("pending");
  });
}

function registerScheduledScrapeRunTest(): void {
  test("POST /api/automation/scrape/schedule creates a pending scrape run", async () => {
    const runAt = new Date(Date.now() + 300_000).toISOString();
    const res = await requestJson<{
      id: string;
      status: "pending";
      input: Record<string, unknown> | null;
    }>(app, "POST", "/api/automation/scrape/schedule", {
      target: "jobs_grackle",
      runAt,
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("pending");
    const input = res.body.input;
    const scheduledRunAt =
      input &&
      typeof input === "object" &&
      "schedule" in input &&
      input.schedule &&
      typeof input.schedule === "object" &&
      "runAt" in input.schedule
        ? input.schedule.runAt
        : null;
    const target = input && typeof input === "object" && "target" in input ? input.target : null;
    expect(scheduledRunAt).toBe(runAt);
    expect(target).toBe("jobs_grackle");
    createdRunIds.push(res.body.id);

    const run = await db
      .select()
      .from(automationRuns)
      .where(and(eq(automationRuns.id, res.body.id), eq(automationRuns.type, "scrape")))
      .limit(1);

    expect(run.length).toBe(1);
    expect(run[0].status).toBe("pending");
  });
}

function registerImmediateScrapeRunTest(): void {
  test("POST /api/automation/scrape executes a scrape run and persists history", async () => {
    originalScrapeJobsForTarget = scraperService.scrapeJobsForTarget.bind(scraperService);
    scraperService.scrapeJobsForTarget = () =>
      Promise.resolve({
        scraped: 4,
        upserted: 3,
        errors: [],
      });

    const res = await requestJson<{
      id: string;
      status: "success";
      output: Record<string, unknown> | null;
    }>(app, "POST", "/api/automation/scrape", {
      target: "jobs_grackle",
    }).finally(() => {
      if (originalScrapeJobsForTarget) {
        scraperService.scrapeJobsForTarget = originalScrapeJobsForTarget;
        originalScrapeJobsForTarget = undefined;
      }
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.output?.target).toBe("jobs_grackle");
    createdRunIds.push(res.body.id);

    const run = await db
      .select()
      .from(automationRuns)
      .where(and(eq(automationRuns.id, res.body.id), eq(automationRuns.type, "scrape")))
      .limit(1);

    expect(run.length).toBe(1);
    expect(run[0].status).toBe("success");
    expect(run[0].output).not.toBeNull();
  });
}

function registerCapabilityAuditRouteTest(): void {
  test("GET /api/automation/capabilities returns the full RPA capability audit", async () => {
    const res = await requestJson<{
      generatedAt: string;
      summary: { total: number };
      capabilities: Array<{ id: string; target: string | null }>;
    }>(app, "GET", "/api/automation/capabilities");

    expect(res.status).toBe(200);
    expect(res.body.generatedAt.length).toBeGreaterThan(0);
    expect(res.body.summary.total).toBeGreaterThanOrEqual(8);
    expect(res.body.capabilities.some((capability) => capability.id === "job_apply")).toBe(true);
    expect(
      res.body.capabilities.some((capability) => capability.target === "jobs_pocketgamer"),
    ).toBe(true);
  });
}

describe("automation routes", () => {
  registerJobApplyValidationTest();
  registerMissingResumeTest();
  registerJobApplyEnqueueTest();
  registerScheduleValidationTest();
  registerScheduleCreationTest();
  registerEmailResponseTest();
  registerScheduledEmailResponseTest();
  registerImmediateScrapeRunTest();
  registerScheduledScrapeRunTest();
  registerCapabilityAuditRouteTest();
});
