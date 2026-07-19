import { expect } from "bun:test";
import { API_ENDPOINTS } from "@bao/shared/constants/endpoints";
import type { RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import { db } from "../db/client";
import { automationRuns } from "../db/schema/automation-runs";
import type { ApplicationAutomationService } from "../services/automation/application-automation-service";
import {
  SCHEDULE_LEAD_TIME_MS,
  SMTP_FROM_NAME,
  SMTP_PASSWORD,
  SMTP_USERNAME,
  createResumeRecord,
  readRunRowById,
  requestEmailResponseBody,
  requestExecutionEnvelope,
  subscribeToRunEvents,
  upsertDeterministicSettings,
  waitForRunCompletion,
  waitForSubmissionCount,
} from "./automation-integration-helpers";

export { createResumeRecord, upsertDeterministicSettings };

export const startManualJobApplyRun = async (
  resumeId: string,
  jobUrl: string,
): Promise<RpaRunExecutionEnvelope> => {
  const response = await requestExecutionEnvelope(API_ENDPOINTS.automationJobApply, {
    method: "POST",
    body: JSON.stringify({
      jobUrl,
      resumeId,
    }),
  });
  if (response.status !== 200) {
    throw new Error("Manual automation run failed to start: status " + String(response.status));
  }

  return response.body;
};

export const verifyManualJobApplyFlow = async (
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
  await waitForSubmissionCount(getSubmissionCount, 1);
};

export const startScheduledJobApplyRun = async (
  resumeId: string,
  jobUrl: string,
): Promise<RpaRunExecutionEnvelope> => {
  const runAt = new Date(Date.now() + SCHEDULE_LEAD_TIME_MS).toISOString();
  const response = await requestExecutionEnvelope(API_ENDPOINTS.automationJobApplySchedule, {
    method: "POST",
    body: JSON.stringify({
      jobUrl,
      resumeId,
      runAt,
    }),
  });
  if (response.status !== 200) {
    throw new Error("Scheduled automation run failed to start: status " + String(response.status));
  }

  return response.body;
};

export const verifyScheduledJobApplyFlow = async (
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
      await waitForSubmissionCount(getSubmissionCount, 2);
    })
    .finally(() => {
      subscription.close();
    });
};

export const configureDeterministicSmtp = async (port: number): Promise<void> => {
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

export const verifyEmailResponseFlow = async (): Promise<void> => {
  const response = await requestEmailResponseBody(API_ENDPOINTS.automationEmailResponse, {
    method: "POST",
    body: JSON.stringify({
      subject: "Interview follow-up",
      message: "Thanks again for the interview. I would love to continue the process.",
      recipientEmail: "recruiter@example.test",
      deliverAfterGeneration: true,
    }),
  });
  if (response.status !== 200) {
    throw new Error("Email automation failed: status " + String(response.status));
  }

  expect(response.body.status).toBe("success");
  expect(response.body.delivered).toBe(true);
  expect(response.body.recipientEmail).toBe("recruiter@example.test");

  const run = await readRunRowById(response.body.runId);
  expect(run?.status).toBe("success");
  expect(run?.output && "delivered" in run.output && run.output.delivered).toBe(true);
};

export const insertRecoveredScheduledRun = async (
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

export const verifyRecoveredScheduledRun = async (
  resumeId: string,
  fixtureBaseUrl: string,
  getSubmissionCount: () => number,
  instantiateService: () => ApplicationAutomationService,
): Promise<void> => {
  const recoveredRunId = await insertRecoveredScheduledRun(resumeId, fixtureBaseUrl);
  instantiateService();

  const completedRecoveredRun = await waitForRunCompletion(recoveredRunId);
  expect(completedRecoveredRun.status).toBe("success");
  await waitForSubmissionCount(getSubmissionCount, 3);
};
