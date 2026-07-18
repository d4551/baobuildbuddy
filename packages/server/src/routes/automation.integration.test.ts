import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  setDefaultTimeout,
  test,
} from "bun:test";
import { API_ENDPOINTS, WS_ENDPOINTS } from "@bao/shared/constants/endpoints";
import {
  type RpaRunEvent,
  type RpaRunExecutionEnvelope,
  rpaRunEventSchema,
} from "@bao/shared/schemas/rpa-events.schema";
import type { EmailTransportSettings } from "@bao/shared/types/settings-contracts";
import {
  DEFAULT_AUTOMATION_SETTINGS,
  DEFAULT_EMAIL_TRANSPORT_SETTINGS,
  DEFAULT_SETTINGS_ID,
} from "@bao/shared/types/settings-defaults";
import { eq, inArray } from "drizzle-orm";
import type { App } from "../app";
import { db } from "../db/client";
import { automationRuns } from "../db/schema/automation-runs";
import { resumes } from "../db/schema/resumes";
import { settings } from "../db/schema/settings";
import {
  createVerificationResumePayload,
  startJobApplyFixtureServer,
} from "../test-support/automation/job-apply-fixture";
import { createSmtpHarness } from "../test-support/email/smtp-harness";

process.env.BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS = "true";
Bun.env.BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS = "true";
// Real Playwright job-apply (not BAO_ENABLE_AUTOMATION_VERIFY stub) — assertions require fixture submissions.
delete process.env.BAO_ENABLE_AUTOMATION_VERIFY;
delete Bun.env.BAO_ENABLE_AUTOMATION_VERIFY;

const AUTOMATION_INTEGRATION_TIMEOUT_MS = 90_000;
const WAIT_INTERVAL_MS = 1_000;
const RUN_TIMEOUT_MS = 45_000;
const SCHEDULE_LEAD_TIME_MS = 3_000;
const SMTP_USERNAME = "mailer@example.test";
const SMTP_PASSWORD = "secret-password";
const SMTP_FROM_NAME = "Bao Build Buddy";
const CLEANUP_AUTOMATION_TYPES = ["job_apply", "email", "scrape"] as const;

let appModule: { app: App } | null = null;
let serverBaseUrl = "";
let websocketBaseUrl = "";
let createApplicationAutomationService: (() => unknown) | null = null;

setDefaultTimeout(AUTOMATION_INTEGRATION_TIMEOUT_MS);

const toJsonRecord = (value: object | undefined): Record<string, unknown> =>
  Object.fromEntries(Object.entries(value ?? {}));

const waitForCondition = async (
  condition: () => Promise<boolean>,
  timeoutMessage: string,
  deadline: number = Date.now() + RUN_TIMEOUT_MS,
): Promise<void> => {
  if (await condition()) {
    return;
  }

  if (Date.now() >= deadline) {
    throw new Error(timeoutMessage);
  }

  await Bun.sleep(WAIT_INTERVAL_MS);
  await waitForCondition(condition, timeoutMessage, deadline);
};

const requestJson = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; body: T }> => {
  const response = await fetch(`${serverBaseUrl}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });
  const rawBody = await response.text();
  const responseContentType = response.headers.get("content-type") ?? "";

  return {
    status: response.status,
    body:
      rawBody.trim().length === 0
        ? (null as T)
        : responseContentType.includes("application/json")
          ? (JSON.parse(rawBody) as T)
          : (rawBody as T),
  };
};

const createResumeRecord = async (): Promise<string> => {
  const resumeId = crypto.randomUUID();
  const payload = createVerificationResumePayload();
  await db.insert(resumes).values({
    id: resumeId,
    name: payload.name,
    personalInfo: toJsonRecord(payload.personalInfo),
    summary: payload.summary,
    experience: payload.experience ?? [],
    education: payload.education ?? [],
    skills: toJsonRecord(payload.skills),
    projects: payload.projects ?? [],
    gamingExperience: toJsonRecord(payload.gamingExperience),
    template: payload.template,
    theme: payload.theme,
    isDefault: payload.isDefault,
  });
  return resumeId;
};

const upsertDeterministicSettings = async (
  overrides: {
    emailTransportPassword?: string | null;
    emailTransportSettings?: EmailTransportSettings;
  } = {},
): Promise<void> => {
  const existingRows = await db
    .select()
    .from(settings)
    .where(eq(settings.id, DEFAULT_SETTINGS_ID))
    .limit(1);
  const baseSettings = {
    id: DEFAULT_SETTINGS_ID,
    automationSettings: {
      ...DEFAULT_AUTOMATION_SETTINGS,
      enableSmartSelectors: false,
    },
    emailTransportSettings: overrides.emailTransportSettings ?? DEFAULT_EMAIL_TRANSPORT_SETTINGS,
    emailTransportPassword: overrides.emailTransportPassword ?? null,
    updatedAt: new Date().toISOString(),
  };

  if (existingRows.length === 0) {
    await db.insert(settings).values(baseSettings);
    return;
  }

  await db
    .update(settings)
    .set({
      automationSettings: baseSettings.automationSettings,
      emailTransportSettings: baseSettings.emailTransportSettings,
      emailTransportPassword: baseSettings.emailTransportPassword,
      updatedAt: baseSettings.updatedAt,
    })
    .where(eq(settings.id, DEFAULT_SETTINGS_ID));
};

const readRunRowById = async (
  runId: string,
): Promise<typeof automationRuns.$inferSelect | null> => {
  const rows = await db.select().from(automationRuns).where(eq(automationRuns.id, runId)).limit(1);
  return rows[0] ?? null;
};

const waitForRunCompletion = async (runId: string): Promise<typeof automationRuns.$inferSelect> => {
  let lastRun: typeof automationRuns.$inferSelect | null = null;
  await waitForCondition(async () => {
    const run = await readRunRowById(runId);
    lastRun = run;
    return run?.status === "success" || run?.status === "error";
  }, `Timed out waiting for automation run ${runId} to complete`);

  if (!lastRun) {
    throw new Error(`Automation run ${runId} did not produce a terminal state.`);
  }

  return lastRun;
};

const subscribeToRunEvents = async (
  runId: string,
): Promise<{
  events: RpaRunEvent[];
  close(): void;
  waitForTerminalEvent(): Promise<RpaRunEvent>;
}> => {
  const socket = new WebSocket(`${websocketBaseUrl}${WS_ENDPOINTS.automation}`);
  const events: RpaRunEvent[] = [];
  let terminalEvent: RpaRunEvent | null = null;

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Timed out opening automation websocket")),
      5_000,
    );
    socket.onopen = () => {
      clearTimeout(timeout);
      socket.send(JSON.stringify({ type: "subscribe", runId }));
      resolve();
    };
    socket.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Automation websocket failed to open"));
    };
  });

  const waitForTerminalEvent = async (): Promise<RpaRunEvent> => {
    await waitForCondition(
      () => Promise.resolve(terminalEvent !== null),
      `Timed out waiting for websocket events for run ${runId}`,
      Date.now() + RUN_TIMEOUT_MS,
    );
    if (!terminalEvent) {
      throw new Error(`Automation websocket did not emit a terminal event for run ${runId}`);
    }
    return terminalEvent;
  };

  socket.onmessage = (event) => {
    const payload: unknown = JSON.parse(
      typeof event.data === "string" ? event.data : `${event.data}`,
    );
    const parsedEvent = rpaRunEventSchema.safeParse(payload);
    if (!parsedEvent.success || parsedEvent.data.runId !== runId) {
      return;
    }

    const runEvent = parsedEvent.data;
    events.push(runEvent);
    if (
      runEvent.eventType === "progress" &&
      (runEvent.status === "success" || runEvent.status === "error")
    ) {
      terminalEvent = runEvent;
    }
    if (runEvent.eventType === "result" || runEvent.eventType === "error") {
      terminalEvent = runEvent;
    }
  };

  return {
    events,
    close(): void {
      socket.close();
    },
    waitForTerminalEvent,
  };
};

beforeAll(async () => {
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  initModule.initializeDatabase((await import("../db/client")).sqlite);
  seedModule.seedDatabase((await import("../db/client")).db);

  appModule = await import("../app");
  appModule.app.listen(0);
  const automationServiceModule = await import(
    "../services/automation/application-automation-service"
  );
  createApplicationAutomationService = () =>
    new automationServiceModule.ApplicationAutomationService();
  const port = appModule.app.server?.port;
  if (typeof port !== "number") {
    throw new Error("Failed to start automation integration app server");
  }

  serverBaseUrl = `http://127.0.0.1:${port}`;
  websocketBaseUrl = `ws://127.0.0.1:${port}`;
});

beforeEach(async () => {
  await db
    .delete(automationRuns)
    .where(inArray(automationRuns.type, [...CLEANUP_AUTOMATION_TYPES]));
  await db.delete(resumes);
  await upsertDeterministicSettings();
});

afterAll(async () => {
  await db
    .delete(automationRuns)
    .where(inArray(automationRuns.type, [...CLEANUP_AUTOMATION_TYPES]));
  await db.delete(resumes);
  if (appModule) {
    await appModule.app.stop();
  }
});

const startManualJobApplyRun = async (
  resumeId: string,
  jobUrl: string,
): Promise<RpaRunExecutionEnvelope> => {
  const response = await requestJson<RpaRunExecutionEnvelope>(API_ENDPOINTS.automationJobApply, {
    method: "POST",
    body: JSON.stringify({
      jobUrl,
      resumeId,
    }),
  });
  if (response.status !== 200) {
    throw new Error(`Manual automation run failed to start: ${JSON.stringify(response.body)}`);
  }

  return response.body;
};

const verifyManualJobApplyFlow = async (
  resumeId: string,
  fixtureBaseUrl: string,
  getSubmissionCount: () => number,
): Promise<void> => {
  const manualResponse = await startManualJobApplyRun(resumeId, fixtureBaseUrl);
  expect(manualResponse.status).toBe("running");

  const completedManualRun = await waitForRunCompletion(manualResponse.id);
  expect(completedManualRun.status).toBe("success");
  expect(
    completedManualRun.output &&
      "success" in completedManualRun.output &&
      completedManualRun.output.success,
  ).toBe(true);
  expect(getSubmissionCount()).toBe(1);
};

const startScheduledJobApplyRun = async (
  resumeId: string,
  jobUrl: string,
): Promise<RpaRunExecutionEnvelope> => {
  const runAt = new Date(Date.now() + SCHEDULE_LEAD_TIME_MS).toISOString();
  const response = await requestJson<RpaRunExecutionEnvelope>(
    API_ENDPOINTS.automationJobApplySchedule,
    {
      method: "POST",
      body: JSON.stringify({
        jobUrl,
        resumeId,
        runAt,
      }),
    },
  );
  if (response.status !== 200) {
    throw new Error(`Scheduled automation run failed to start: ${JSON.stringify(response.body)}`);
  }

  return response.body;
};

const verifyScheduledJobApplyFlow = async (
  resumeId: string,
  fixtureBaseUrl: string,
  getSubmissionCount: () => number,
): Promise<void> => {
  const scheduledResponse = await startScheduledJobApplyRun(resumeId, fixtureBaseUrl);
  expect(scheduledResponse.status).toBe("pending");

  const subscription = await subscribeToRunEvents(scheduledResponse.id);
  await Promise.resolve()
    .then(async () => {
      const terminalEvent = await subscription.waitForTerminalEvent();
      expect(terminalEvent.runId).toBe(scheduledResponse.id);

      const completedScheduledRun = await waitForRunCompletion(scheduledResponse.id);
      expect(completedScheduledRun.status).toBe("success");
      expect(
        subscription.events.some(
          (event) => event.eventType === "progress" && event.status === "running",
        ),
      ).toBe(true);
      expect(
        subscription.events.some(
          (event) => event.eventType === "progress" && event.status === "success",
        ),
      ).toBe(true);
      const sequences = subscription.events.map((event) => event.sequence);
      expect(sequences).toEqual([...sequences].sort((left, right) => left - right));
      expect(getSubmissionCount()).toBe(2);
    })
    .finally(() => {
      subscription.close();
    });
};

const configureDeterministicSmtp = async (port: number): Promise<void> => {
  await upsertDeterministicSettings({
    emailTransportSettings: {
      host: "127.0.0.1",
      port,
      security: "plain",
      username: SMTP_USERNAME,
      fromEmail: SMTP_USERNAME,
      fromName: SMTP_FROM_NAME,
      authMethod: "plain",
      connectionTimeoutSeconds: 10,
    },
    emailTransportPassword: SMTP_PASSWORD,
  });
};

const verifyEmailResponseFlow = async (): Promise<void> => {
  const response = await requestJson<{
    runId: string;
    status: "success";
    delivered: boolean;
    recipientEmail?: string;
    messageId?: string;
  }>(API_ENDPOINTS.automationEmailResponse, {
    method: "POST",
    body: JSON.stringify({
      subject: "Interview follow-up",
      message: "Thanks again for the interview. I would love to continue the process.",
      recipientEmail: "recruiter@example.test",
      deliverAfterGeneration: true,
    }),
  });
  if (response.status !== 200) {
    throw new Error(`Email automation failed: ${JSON.stringify(response.body)}`);
  }

  expect(response.body.status).toBe("success");
  expect(response.body.delivered).toBe(true);
  expect(response.body.recipientEmail).toBe("recruiter@example.test");

  const run = await readRunRowById(response.body.runId);
  expect(run?.status).toBe("success");
  expect(run?.output && "delivered" in run.output && run.output.delivered).toBe(true);
};

const insertRecoveredScheduledRun = async (
  resumeId: string,
  fixtureBaseUrl: string,
): Promise<string> => {
  const recoveredRunId = crypto.randomUUID();
  const recoveredRunAt = new Date(Date.now() + SCHEDULE_LEAD_TIME_MS).toISOString();
  const now = new Date().toISOString();
  await db.insert(automationRuns).values({
    id: recoveredRunId,
    type: "job_apply",
    status: "pending",
    jobId: null,
    userId: null,
    input: {
      action: "job_apply",
      jobUrl: fixtureBaseUrl,
      resumeId,
      customAnswers: {},
      schedule: { runAt: recoveredRunAt },
    },
    progress: 0,
    currentStep: null,
    totalSteps: null,
    exitCode: null,
    timedOut: false,
    aborted: false,
    executionMs: null,
    startedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  return recoveredRunId;
};

const verifyRecoveredScheduledRun = async (
  resumeId: string,
  fixtureBaseUrl: string,
  getSubmissionCount: () => number,
): Promise<void> => {
  const instantiateService = createApplicationAutomationService;
  if (!instantiateService) {
    throw new Error("ApplicationAutomationService is unavailable");
  }

  const recoveredRunId = await insertRecoveredScheduledRun(resumeId, fixtureBaseUrl);
  instantiateService();

  const completedRecoveredRun = await waitForRunCompletion(recoveredRunId);
  expect(completedRecoveredRun.status).toBe("success");
  expect(getSubmissionCount()).toBe(3);
};

describe("automation route integration", () => {
  test("manual job-apply, scheduled websocket flow, email-response, and scheduler recovery all work end to end", async () => {
    const resumeId = await createResumeRecord();
    const fixture = startJobApplyFixtureServer({
      submissionDelayMs: 200,
    });
    const smtpHarness = createSmtpHarness();

    await Promise.resolve()
      .then(async () => {
        await verifyManualJobApplyFlow(resumeId, fixture.baseUrl, () => fixture.submissions.length);
        expect(fixture.submissions[0]?.fields.name).toBe("Bao Builder");
        expect(fixture.submissions[0]?.fields.email).toBe("bao@example.com");
        expect(fixture.submissions[0]?.resumeFileName?.endsWith(".pdf")).toBe(true);

        await verifyScheduledJobApplyFlow(
          resumeId,
          fixture.baseUrl,
          () => fixture.submissions.length,
        );

        await configureDeterministicSmtp(smtpHarness.port);
        await verifyEmailResponseFlow();
        expect(
          smtpHarness.exchange.commands.some((command) => command.startsWith("AUTH PLAIN ")),
        ).toBe(true);
        expect(smtpHarness.exchange.message).toContain("To: <recruiter@example.test>");
        expect(smtpHarness.exchange.message).toContain("Subject: Interview follow-up");

        await verifyRecoveredScheduledRun(
          resumeId,
          fixture.baseUrl,
          () => fixture.submissions.length,
        );
      })
      .finally(async () => {
        await fixture.stop();
        smtpHarness.stop();
      });
  });
});
