import { API_ERROR_EMAIL_DELIVERY_SETTINGS_MISSING, API_ERROR_RUN_ID_INVALID } from "@bao/shared/constants/api-errors";
import type { AutomationScrapeTarget, RpaCapabilityAuditReport } from "@bao/shared/constants/automation";
import type { EmailResponseRequest, EmailResponseResult } from "@bao/shared/schemas/automation-email.schema";
import type { RpaRunEvent } from "@bao/shared/schemas/rpa-events.schema";
import { settle } from "@bao/shared/utils/promise";
import { generateId } from "@bao/shared/utils/validation";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { automationRuns } from "../../db/schema/automation-runs";
import { createServerLogger } from "../../utils/logger";
import { broadcastAutomationEvent } from "../../ws/automation.ws";
import { createEmailResponseRun, executeEmailResponseRun } from "./automation-email-response";
import { normalizeEmailResponsePayload } from "./automation-email-response-payload";
import { normalizeScrapeTarget, type JobApplyPayload } from "./automation-run-inputs";
import {
  executePreparedJobApplyRun,
  createExecutionTracking,
  handleJobApplyExecutionFailure,
  markJobApplyRunStarted,
} from "./automation-job-apply-execution";
import { prepareJobApplyRun } from "./automation-job-apply-preparation";
import { AutomationProgressEvents } from "./automation-progress-events";
import { AutomationRunCreator } from "./automation-run-creation";
import { AutomationRunScheduler } from "./automation-run-scheduler";
import { AutomationScheduledRunExecutor } from "./automation-scheduled-run-executor";
import { executeScrapeRun, getRpaCapabilityAudit } from "./automation-scrape-run";
import { loadEmailTransportConfig, tryLoadAIService } from "./automation-settings-support";
import type { AutomationRunRow } from "./automation-service-contracts";

const automationServiceLogger = createServerLogger("application-automation-service");

/**
 * Contract-driven job application automation workflow service.
 */
export class ApplicationAutomationService {
  private readonly progressEvents = new AutomationProgressEvents();
  private readonly runCreator: AutomationRunCreator;
  private readonly scheduler: AutomationRunScheduler;
  private readonly scheduledRuns: AutomationScheduledRunExecutor;

  constructor() {
    this.scheduler = new AutomationRunScheduler((runId) => this.executeScheduledRun(runId));
    this.runCreator = new AutomationRunCreator({
      createProgressEvent: (params) => this.progressEvents.createProgressEvent(params),
      queueScheduledRun: (runId, runAt) => this.scheduler.queue(runId, runAt),
    });
    this.scheduledRuns = new AutomationScheduledRunExecutor({
      createProgressEvent: (params) => this.progressEvents.createProgressEvent(params),
      queueScheduledRun: (runId, runAt) => this.scheduler.queue(runId, runAt),
      readRunRow: (runId) => this.readRunRow(runId),
      runJobApply: (runId, payload) => this.runJobApply(runId, payload),
    });
    this.scheduler.restorePendingRuns(AutomationRunCreator.maxRecoverableScheduledRuns).then(
      () => undefined,
      (error: unknown) => {
        automationServiceLogger.error("[automation] scheduler recovery failed", error);
      },
    );
  }

  /**
   * Load a single automation run row.
   */
  private async readRunRow(runId: string): Promise<AutomationRunRow | null> {
    const rows = await db
      .select()
      .from(automationRuns)
      .where(eq(automationRuns.id, runId))
      .limit(1);
    return rows[0] ?? null;
  }

  async createScheduledJobApplyRun(
    payload: JobApplyPayload,
    runAt: string,
  ): Promise<{ runId: string; scheduledFor: string }> {
    return this.runCreator.createScheduledJobApplyRun(payload, runAt);
  }

  async createScheduledEmailResponseRun(
    payload: EmailResponseRequest,
    runAt: string,
  ): Promise<{ runId: string; scheduledFor: string }> {
    return this.runCreator.createScheduledEmailResponseRun(payload, runAt);
  }

  async createScheduledScrapeRun(
    target: AutomationScrapeTarget,
    runAt: string,
  ): Promise<{ runId: string; scheduledFor: string }> {
    return this.runCreator.createScheduledScrapeRun(target, runAt);
  }

  async createScrapeRun(target: AutomationScrapeTarget): Promise<string> {
    return this.runCreator.createScrapeRun(target);
  }

  /**
   * Execute a scrape run immediately and persist the final run outcome.
   */
  async runScrape(target: AutomationScrapeTarget): Promise<string> {
    const normalizedTarget = normalizeScrapeTarget(target);
    const runId = await this.createScrapeRun(normalizedTarget);
    await executeScrapeRun(runId, normalizedTarget, (params) =>
      this.progressEvents.createProgressEvent(params),
    );
    return runId;
  }

  /**
   * Build an up-to-date audit report for the full RPA capability surface.
   */
  async getRpaCapabilityAudit(): Promise<RpaCapabilityAuditReport> {
    return getRpaCapabilityAudit();
  }

  private async executeScheduledRun(runId: string): Promise<void> {
    await this.scheduledRuns.execute(runId);
  }

  /**
   * Run an AI-assisted email response and persist output as an automation run.
   */
  async runEmailResponse(payload: EmailResponseRequest): Promise<EmailResponseResult> {
    const normalized = normalizeEmailResponsePayload(payload);
    const runId = generateId();
    await createEmailResponseRun(runId, normalized);
    return executeEmailResponseRun(runId, normalized, {
      loadAIService: tryLoadAIService,
      loadEmailTransportConfig: () =>
        loadEmailTransportConfig(API_ERROR_EMAIL_DELIVERY_SETTINGS_MISSING),
      createProgressEvent: (params) => this.progressEvents.createProgressEvent(params),
      broadcastProgressEvent: broadcastAutomationEvent,
    });
  }

  /**
   * Run full job-application automation for an existing run.
   */
  async runJobApply(
    runId: string,
    payload: JobApplyPayload,
    onProgress?: (event: RpaRunEvent) => void,
  ): Promise<void> {
    const preparation = await prepareJobApplyRun({
      runId,
      payload,
      progressHandler: this.progressEvents.createProgressHandler(onProgress),
      clearScheduledRunTimer: (pendingRunId) => this.scheduler.clear(pendingRunId),
      invalidRunIdMessage: API_ERROR_RUN_ID_INVALID,
    });
    await markJobApplyRunStarted(runId);

    const tracking = createExecutionTracking();
    const executionResult = await settle(
      executePreparedJobApplyRun(preparation, tracking, (params) =>
        this.progressEvents.createProgressEvent(params),
      ),
    );
    if (executionResult.status === "rejected") {
      await handleJobApplyExecutionFailure({
        runId,
        automationSettings: preparation.automationSettings,
        tracking,
        reason: executionResult.reason,
        createProgressEvent: (params) => this.progressEvents.createProgressEvent(params),
      });
    }
  }

  async createJobApplyRun(
    payload: JobApplyPayload,
    options: { includeActionInPayload?: boolean } = {},
  ): Promise<string> {
    return this.runCreator.createJobApplyRun(payload, options);
  }
}

export const applicationAutomationService = new ApplicationAutomationService();
