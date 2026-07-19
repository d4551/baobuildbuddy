import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  setDefaultTimeout,
  test,
} from "bun:test";
import "../test-support/automation/integration-runtime-flags";
import { inArray } from "drizzle-orm";
import type { App } from "../app";
import { db } from "../db/client";
import { automationRuns } from "../db/schema/automation-runs";
import { resumes } from "../db/schema/resumes";
import type { ApplicationAutomationService } from "../services/automation/application-automation-service";
import { startJobApplyFixtureServer } from "../test-support/automation/job-apply-fixture";
import { createSmtpHarness } from "../test-support/email/smtp-harness";
import {
  configureDeterministicSmtp,
  verifyEmailResponseFlow,
  verifyManualJobApplyFlow,
  verifyRecoveredScheduledRun,
  verifyScheduledJobApplyFlow,
} from "./automation-integration-flows";
import {
  CLEANUP_AUTOMATION_TYPES,
  createResumeRecord,
  setIntegrationBaseUrls,
  upsertDeterministicSettings,
} from "./automation-integration-helpers";

const AUTOMATION_INTEGRATION_TIMEOUT_MS = 90_000;

let appModule: { app: App } | null = null;
let createApplicationAutomationService: (() => ApplicationAutomationService) | null = null;

setDefaultTimeout(AUTOMATION_INTEGRATION_TIMEOUT_MS);

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

  setIntegrationBaseUrls("http://127.0.0.1:" + String(port), "ws://127.0.0.1:" + String(port));
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

describe("automation route integration", () => {
  test("manual job-apply, scheduled websocket flow, email-response, and scheduler recovery all work end to end", async () => {
    const resumeId = await createResumeRecord();
    const fixture = startJobApplyFixtureServer({
      submissionDelayMs: 200,
    });
    const smtpHarness = createSmtpHarness();
    const instantiateService = createApplicationAutomationService;
    if (!instantiateService) {
      throw new Error("ApplicationAutomationService is unavailable");
    }

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
          instantiateService,
        );
      })
      .finally(async () => {
        await fixture.stop();
        smtpHarness.stop();
      });
  });
});
