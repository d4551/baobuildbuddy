import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { API_ENDPOINT_PREFIX, API_ENDPOINTS } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "@bao/shared/constants/http";
import { COUNT_EIGHT, MS_FIVE_MINUTES } from "@bao/shared/constants/numeric";
import { settle } from "@bao/shared/utils/promise";
import { generateId } from "@bao/shared/utils/validation";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { automationRuns } from "../db/schema/automation-runs";
import { resumes } from "../db/schema/resumes";
import type { ApplicationAutomationService } from "../services/automation/application-automation-service";
import {
  AutomationRunScheduler,
  ORPHANED_RUNNING_RUN_RECLAIMED_MESSAGE,
  PENDING_RUN_MISSING_SCHEDULE_METADATA_MESSAGE,
} from "../services/automation/automation-run-scheduler";
import { scraperService } from "../services/scraper-service";
import { requestJson } from "../test-utils";

let app: { handle: (request: Request) => Response | Promise<Response> };
let applicationAutomationService: ApplicationAutomationService;
const resumeId = generateId();
const createdRunIds: string[] = [];
type RunJobApply = ApplicationAutomationService["runJobApply"];
type RunEmailResponse = ApplicationAutomationService["runEmailResponse"];
type ScrapeJobsForTarget = typeof scraperService.scrapeJobsForTarget;
type AutomationRunInsert = typeof automationRuns.$inferInsert;
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

const insertTestAutomationRun = async (
  values: Pick<AutomationRunInsert, "id" | "status"> & Partial<AutomationRunInsert>,
): Promise<void> => {
  const now = new Date().toISOString();
  await db.insert(automationRuns).values({
    id: values.id,
    type: values.type ?? "job_apply",
    status: values.status,
    jobId: values.jobId ?? null,
    userId: values.userId ?? null,
    input: values.input ?? {
      jobUrl: "https://example.com/careers/engineering",
      resumeId,
    },
    progress: values.progress ?? 0,
    currentStep: values.currentStep ?? null,
    totalSteps: values.totalSteps ?? null,
    exitCode: values.exitCode ?? null,
    timedOut: values.timedOut ?? false,
    aborted: values.aborted ?? false,
    executionMs: values.executionMs ?? null,
    startedAt: values.startedAt ?? null,
    completedAt: values.completedAt ?? null,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
  });
};

const readAutomationRun = async (runId: string) => {
  const rows = await db.select().from(automationRuns).where(eq(automationRuns.id, runId)).limit(1);
  expect(rows.length).toBe(1);
  return rows[0];
};

beforeAll(async () => {
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const { Elysia } = await import("elysia");
  const dbModule = await import("../db/client");

  initModule.initializeDatabase(dbModule.sqlite);
  seedModule.seedDatabase(dbModule.db);

  await db.insert(resumes).values({ id: resumeId });
  const serviceModule = await import("../services/automation/application-automation-service");
  applicationAutomationService = serviceModule.applicationAutomationService;
  const routesModule = await import("./automation.routes");
  app = new Elysia({ prefix: API_ENDPOINT_PREFIX }).use(routesModule.automationRoutes);
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
  test("POST automation job apply validates required fields", async () => {
    const res = await requestStatusBody<{ error: { code: string; message: string } }>(
      "POST",
      API_ENDPOINTS.automationJobApply,
      {
        resumeId,
      },
    );
    expect(res.status).toBe(HTTP_STATUS_UNPROCESSABLE_ENTITY);
    if (typeof res.body === "string") {
      expect(res.body).toContain("Job URL is required");
    } else {
      expect(typeof res.body).toBe("object");
      expect(typeof res.body.error.message).toBe("string");
    }
  });
}

function registerMissingResumeTest(): void {
  test("POST automation job apply rejects missing resume", async () => {
    const res = await requestJson<{ error: { code: string; message: string } }>(
      app,
      "POST",
      API_ENDPOINTS.automationJobApply,
      {
        jobUrl: "https://example.com/career/role",
        resumeId: "not-found-resume-id",
      },
    );
    expect(res.status).toBe(HTTP_STATUS_NOT_FOUND);
    expect(res.body.error.message).toBe("resume not found: not-found-resume-id");
  });
}

function registerJobApplyEnqueueTest(): void {
  test("POST automation job apply enqueues a run and returns run contract", async () => {
    originalRunJobApply = applicationAutomationService.runJobApply.bind(
      applicationAutomationService,
    );
    applicationAutomationService.runJobApply = runJobApplyStub;

    await Promise.resolve()
      .then(async () => {
        const res = await requestJson<{ id: string; status: "running" }>(
          app,
          "POST",
          API_ENDPOINTS.automationJobApply,
          {
            jobUrl: "https://example.com/careers/engineering",
            resumeId,
          },
        );
        expect(res.status).toBe(HTTP_STATUS_OK);
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
  test("POST automation job apply schedule validates runAt", async () => {
    const res = await requestJson<{ error: { code: string; message: string } }>(
      app,
      "POST",
      API_ENDPOINTS.automationJobApplySchedule,
      {
        jobUrl: "https://example.com/careers/engineering",
        resumeId,
        runAt: "not-a-date",
      },
    );

    expect(res.status).toBe(HTTP_STATUS_UNPROCESSABLE_ENTITY);
    expect(res.body.error.message).toContain("runAt");
  });
}

function registerScheduleCreationTest(): void {
  test("POST automation job apply schedule creates a pending run", async () => {
    const runAt = new Date(Date.now() + MS_FIVE_MINUTES).toISOString();
    const res = await requestJson<{
      id: string;
      status: "pending";
      input: Record<string, unknown> | null;
    }>(app, "POST", API_ENDPOINTS.automationJobApplySchedule, {
      jobUrl: "https://example.com/careers/engineering",
      resumeId,
      runAt,
    });

    expect(res.status).toBe(HTTP_STATUS_OK);
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
  test("POST automation email response creates a successful email run", async () => {
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
    }>(app, "POST", API_ENDPOINTS.automationEmailResponse, {
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

    expect(res.status).toBe(HTTP_STATUS_OK);
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
  test("POST automation email response schedule creates a pending email run", async () => {
    const runAt = new Date(Date.now() + MS_FIVE_MINUTES).toISOString();
    const res = await requestJson<{
      id: string;
      status: "pending";
      input: Record<string, unknown> | null;
    }>(app, "POST", API_ENDPOINTS.automationEmailResponseSchedule, {
      subject: "Interview follow-up",
      message: "Thanks again for the interview. I would love to continue the process.",
      tone: "friendly",
      deliverAfterGeneration: false,
      runAt,
    });

    expect(res.status).toBe(HTTP_STATUS_OK);
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
  test("POST automation scrape schedule creates a pending scrape run", async () => {
    const runAt = new Date(Date.now() + MS_FIVE_MINUTES).toISOString();
    const res = await requestJson<{
      id: string;
      status: "pending";
      input: Record<string, unknown> | null;
    }>(app, "POST", API_ENDPOINTS.automationScrapeSchedule, {
      target: "jobs_grackle",
      runAt,
    });

    expect(res.status).toBe(HTTP_STATUS_OK);
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

function registerSchedulerRunningReclaimTest(): void {
  test("startup recovery reclaims orphaned running automation runs", async () => {
    const runId = generateId();
    const startedAt = new Date().toISOString();
    createdRunIds.push(runId);
    await insertTestAutomationRun({
      id: runId,
      status: "running",
      startedAt,
    });

    const scheduler = new AutomationRunScheduler(() => Promise.resolve());
    await scheduler.reclaimRunningRuns();

    const run = await readAutomationRun(runId);
    expect(run.status).toBe("error");
    expect(run.error).toBe(ORPHANED_RUNNING_RUN_RECLAIMED_MESSAGE);
    const output = run.output;
    const outputError = output && typeof output === "object" ? output.error : null;
    expect(outputError).toBe(ORPHANED_RUNNING_RUN_RECLAIMED_MESSAGE);
    expect(run.completedAt).not.toBeNull();
  });
}

function registerSchedulerPendingWithoutMetadataTest(): void {
  test("pending recovery fails runs without schedule metadata", async () => {
    const runId = generateId();
    createdRunIds.push(runId);
    await insertTestAutomationRun({
      id: runId,
      status: "pending",
      input: {
        jobUrl: "https://example.com/careers/engineering",
        resumeId,
      },
    });

    const scheduler = new AutomationRunScheduler(() => Promise.resolve());
    await scheduler.restorePendingRuns(10);

    const run = await readAutomationRun(runId);
    expect(run.status).toBe("error");
    expect(run.error).toBe(PENDING_RUN_MISSING_SCHEDULE_METADATA_MESSAGE);
    const output = run.output;
    const outputError = output && typeof output === "object" ? output.error : null;
    expect(outputError).toBe(PENDING_RUN_MISSING_SCHEDULE_METADATA_MESSAGE);
    expect(run.completedAt).not.toBeNull();
  });
}

function registerSchedulerPendingWithMetadataTest(): void {
  test("pending recovery leaves scheduled runs pending for queued execution", async () => {
    const runId = generateId();
    const runAt = new Date(Date.now() + MS_FIVE_MINUTES).toISOString();
    createdRunIds.push(runId);
    await insertTestAutomationRun({
      id: runId,
      status: "pending",
      input: {
        jobUrl: "https://example.com/careers/engineering",
        resumeId,
        schedule: { runAt },
      },
    });

    const scheduler = new AutomationRunScheduler(() => Promise.resolve());
    try {
      await scheduler.restorePendingRuns(10);

      const run = await readAutomationRun(runId);
      expect(run.status).toBe("pending");
      expect(run.error).toBeNull();
      expect(run.output).toBeNull();
    } finally {
      scheduler.clear(runId);
    }
  });
}

function registerImmediateScrapeRunTest(): void {
  test("POST automation scrape executes a scrape run and persists history", async () => {
    originalScrapeJobsForTarget = scraperService.scrapeJobsForTarget.bind(scraperService);
    scraperService.scrapeJobsForTarget = () =>
      Promise.resolve({
        scraped: 4,
        upserted: 3,
        errors: [],
        enrichment: {
          enabled: true,
          enrichedRecords: 3,
          warnings: [],
          provider: "local",
          model: "deterministic-test-model",
        },
      });

    const res = await requestJson<{
      id: string;
      status: "success";
      output: Record<string, unknown> | null;
    }>(app, "POST", API_ENDPOINTS.automationScrape, {
      target: "jobs_grackle",
    }).finally(() => {
      if (originalScrapeJobsForTarget) {
        scraperService.scrapeJobsForTarget = originalScrapeJobsForTarget;
        originalScrapeJobsForTarget = undefined;
      }
    });

    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(res.body.status).toBe("success");
    expect(res.body.output?.target).toBe("jobs_grackle");
    expect(res.body.output?.enrichment).not.toBeNull();
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
  test("GET automation capabilities returns the full RPA capability audit", async () => {
    const res = await requestJson<{
      generatedAt: string;
      summary: { total: number };
      capabilities: Array<{ id: string; target: string | null }>;
    }>(app, "GET", API_ENDPOINTS.automationCapabilities);

    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(res.body.generatedAt.length).toBeGreaterThan(0);
    expect(res.body.summary.total).toBeGreaterThanOrEqual(COUNT_EIGHT);
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
  registerSchedulerRunningReclaimTest();
  registerSchedulerPendingWithoutMetadataTest();
  registerSchedulerPendingWithMetadataTest();
  registerCapabilityAuditRouteTest();
});
