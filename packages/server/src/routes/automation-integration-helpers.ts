import { expect } from "bun:test";
import {
  type RpaRunEvent,
  type RpaRunExecutionEnvelope,
  rpaRunEventSchema,
  rpaRunExecutionEnvelopeSchema,
} from "@bao/shared/schemas/rpa-events.schema";
import type { EmailTransportSettings } from "@bao/shared/types/settings-contracts";
import {
  DEFAULT_AUTOMATION_SETTINGS,
  DEFAULT_EMAIL_TRANSPORT_SETTINGS,
  DEFAULT_SETTINGS_ID,
} from "@bao/shared/types/settings-defaults";
import type { JsonObject } from "@bao/shared/utils/json";
import { parseJson, safeParseJson } from "@bao/shared/utils/json";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { automationRuns } from "../db/schema/automation-runs";
import { resumes } from "../db/schema/resumes";
import { settings } from "../db/schema/settings";
import { createVerificationResumePayload } from "../test-support/automation/job-apply-fixture";

export const WAIT_INTERVAL_MS = 1_000;
export const RUN_TIMEOUT_MS = 45_000;
export const SCHEDULE_LEAD_TIME_MS = 3_000;
export const SMTP_USERNAME = "mailer@example.test";
export const SMTP_PASSWORD = "secret-password";
export const SMTP_FROM_NAME = "Bao Build Buddy";
export const CLEANUP_AUTOMATION_TYPES = ["job_apply", "email", "scrape"] as const;

let serverBaseUrl = "";
let websocketBaseUrl = "";

export const setIntegrationBaseUrls = (httpBase: string, wsBase: string): void => {
  serverBaseUrl = httpBase;
  websocketBaseUrl = wsBase;
};

const toJsonRecord = (value: object | undefined): JsonObject => {
  const parsed = safeParseJson(JSON.stringify(value ?? {}));
  if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed;
  }
  return {};
};

export const waitForCondition = async (
  condition: () => Promise<boolean> | boolean,
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

export const waitForSubmissionCount = async (
  getSubmissionCount: () => number,
  expectedCount: number,
): Promise<void> => {
  await waitForCondition(
    () => getSubmissionCount() >= expectedCount,
    "Timed out waiting for fixture submission count >= " +
      String(expectedCount) +
      " (got " +
      String(getSubmissionCount()) +
      ")",
  );
  expect(getSubmissionCount()).toBe(expectedCount);
};

const emailResponseBodySchema = z.object({
  runId: z.string(),
  status: z.literal("success"),
  delivered: z.boolean(),
  recipientEmail: z.string().optional(),
  messageId: z.string().optional(),
});

export type EmailResponseBody = z.infer<typeof emailResponseBodySchema>;

export const requestJson = async <T>(
  path: string,
  schema: z.ZodType<T>,
  init: RequestInit = {},
): Promise<{ status: number; body: T | null }> => {
  const response = await fetch(serverBaseUrl + path, {
    ...init,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });
  const rawBody = await response.text();
  if (rawBody.trim().length === 0) {
    return { status: response.status, body: null };
  }
  const responseContentType = response.headers.get("content-type") ?? "";
  if (!responseContentType.includes("application/json")) {
    throw new Error(`Expected JSON response from ${path}, got content-type ${responseContentType}`);
  }
  const body = parseJson(rawBody, schema);
  if (body === null) {
    throw new Error(
      "Failed to parse JSON response from " +
        path +
        " (status " +
        String(response.status) +
        "): " +
        rawBody.slice(0, 400),
    );
  }
  return { status: response.status, body };
};

export const requestExecutionEnvelope = async (
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; body: RpaRunExecutionEnvelope }> => {
  const response = await requestJson(path, rpaRunExecutionEnvelopeSchema, init);
  if (response.body === null) {
    throw new Error(`Empty execution envelope from ${path}`);
  }
  return { status: response.status, body: response.body };
};

export const requestEmailResponseBody = async (
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; body: EmailResponseBody }> => {
  const response = await requestJson(path, emailResponseBodySchema, init);
  if (response.body === null) {
    throw new Error(`Empty email response body from ${path}`);
  }
  return { status: response.status, body: response.body };
};

export const createResumeRecord = async (): Promise<string> => {
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

export const upsertDeterministicSettings = async (
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

export const readRunRowById = async (
  runId: string,
): Promise<typeof automationRuns.$inferSelect | null> => {
  const rows = await db.select().from(automationRuns).where(eq(automationRuns.id, runId)).limit(1);
  return rows[0] ?? null;
};

export const waitForRunCompletion = async (
  runId: string,
): Promise<typeof automationRuns.$inferSelect> => {
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

export const subscribeToRunEvents = async (
  runId: string,
): Promise<{
  events: RpaRunEvent[];
  close(): void;
  waitForTerminalEvent(): Promise<RpaRunEvent>;
}> => {
  const { WS_ENDPOINTS } = await import("@bao/shared/constants/endpoints");
  const socket = new WebSocket(websocketBaseUrl + WS_ENDPOINTS.automation);
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
    const raw = typeof event.data === "string" ? event.data : String(event.data);
    const payload = safeParseJson(raw);
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
