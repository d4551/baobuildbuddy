import { API_ERROR_EMAIL_DELIVERY_SETTINGS_MISSING } from "@bao/shared/constants/api-errors";
import { AUTOMATION_SCHEDULE_RETRY_DELAY_MS } from "@bao/shared/constants/automation-limits";
import { settle } from "@bao/shared/utils/promise";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { automationRuns } from "../../db/schema/automation-runs";
import { broadcastAutomationEvent } from "../../ws/automation.ws";
import { executeEmailResponseRun, markEmailResponseRunStarted } from "./automation-email-response";
import {
  DEFAULT_EMAIL_RESPONSE_TONE,
  isEmailResponseTone,
} from "./automation-email-response-payload";
import { AutomationConcurrencyLimitError } from "./automation-errors";
import {
  buildScheduledJobApplyInput,
  parseScheduledEmailResponsePayload,
  parseScheduledJobApplyPayload,
  parseScheduledScrapePayload,
  type JobApplyPayload,
} from "./automation-run-inputs";
import { normalizeJobApplyPayload } from "./automation-job-apply-preparation";
import { markRunFailed } from "./automation-run-persistence";
import { executeScrapeRun } from "./automation-scrape-run";
import {
  loadAutomationSettings,
  loadEmailTransportConfig,
  tryLoadAIService,
} from "./automation-settings-support";
import type { AutomationRunRow, CreateProgressEvent } from "./automation-service-contracts";

const SCHEDULED_ACTION_JOB_APPLY = "job_apply";

const asJsonRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value))
    : null;

type ScheduledRunQueue = (runId: string, runAt: string) => void;
type ReadRunRow = (runId: string) => Promise<AutomationRunRow | null>;
type RunJobApply = (runId: string, payload: JobApplyPayload) => Promise<void>;

interface AutomationScheduledRunExecutorOptions {
  createProgressEvent: CreateProgressEvent;
  queueScheduledRun: ScheduledRunQueue;
  readRunRow: ReadRunRow;
  runJobApply: RunJobApply;
}

export class AutomationScheduledRunExecutor {
  constructor(private readonly options: AutomationScheduledRunExecutorOptions) {}

  async execute(runId: string): Promise<void> {
    const row = await this.options.readRunRow(runId);
    if (row?.status !== "pending") {
      return;
    }

    if (row.type === "job_apply") {
      await this.executeJobApply(row);
      return;
    }

    if (row.type === "email") {
      await this.executeEmail(row);
      return;
    }

    if (row.type === "scrape") {
      await this.executeScrape(row);
    }
  }

  private async failValidation(runId: string, errorMessage: string): Promise<void> {
    const automationSettings = await loadAutomationSettings();
    await markRunFailed(runId, errorMessage, automationSettings);
    broadcastAutomationEvent(
      this.options.createProgressEvent({
        runId,
        action: "automation",
        status: "error",
        message: errorMessage,
      }),
    );
  }

  private async executeJobApply(row: AutomationRunRow): Promise<void> {
    const payload = parseScheduledJobApplyPayload(asJsonRecord(row.input));
    if (!payload) {
      await this.failValidation(row.id, "Scheduled job-apply payload is invalid");
      return;
    }

    const executionResult = await settle(this.options.runJobApply(row.id, payload));
    if (executionResult.status === "fulfilled") {
      return;
    }

    if (executionResult.reason instanceof AutomationConcurrencyLimitError) {
      await this.requeueJobApplyRun(row.id, payload);
      return;
    }

    throw executionResult.reason;
  }

  private async requeueJobApplyRun(runId: string, payload: JobApplyPayload): Promise<void> {
    const nextRunAt = new Date(Date.now() + AUTOMATION_SCHEDULE_RETRY_DELAY_MS).toISOString();
    const normalizedPayload = normalizeJobApplyPayload(payload);

    await db
      .update(automationRuns)
      .set({
        input: buildScheduledJobApplyInput(normalizedPayload, nextRunAt),
        status: "pending",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(automationRuns.id, runId));

    this.options.queueScheduledRun(runId, nextRunAt);
    broadcastAutomationEvent(
      this.options.createProgressEvent({
        runId,
        action: SCHEDULED_ACTION_JOB_APPLY,
        status: "pending",
        message: `Concurrency limit reached, retrying at ${nextRunAt}`,
      }),
    );
  }

  private async executeEmail(row: AutomationRunRow): Promise<void> {
    const payload = parseScheduledEmailResponsePayload(asJsonRecord(row.input), {
      defaultTone: DEFAULT_EMAIL_RESPONSE_TONE,
      isEmailResponseTone,
    });
    if (!payload) {
      await this.failValidation(row.id, "Scheduled email payload is invalid");
      return;
    }

    await markEmailResponseRunStarted(row.id, payload);
    await executeEmailResponseRun(row.id, payload, {
      loadAIService: tryLoadAIService,
      loadEmailTransportConfig: () =>
        loadEmailTransportConfig(API_ERROR_EMAIL_DELIVERY_SETTINGS_MISSING),
      createProgressEvent: this.options.createProgressEvent,
      broadcastProgressEvent: broadcastAutomationEvent,
    });
  }

  private async executeScrape(row: AutomationRunRow): Promise<void> {
    const payload = parseScheduledScrapePayload(asJsonRecord(row.input));
    if (!payload) {
      await this.failValidation(row.id, "Scheduled scrape payload is invalid");
      return;
    }

    await executeScrapeRun(row.id, payload.target, this.options.createProgressEvent);
  }
}
