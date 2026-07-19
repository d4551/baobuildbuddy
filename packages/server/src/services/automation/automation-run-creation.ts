import type { AutomationScrapeTarget } from "@bao/shared/constants/automation";
import { SCHEMA_MAX_ITEMS_BOARDS } from "@bao/shared/constants/schema-limits";
import type { EmailResponseRequest } from "@bao/shared/schemas/automation-email.schema";
import { generateId } from "@bao/shared/utils/validation";
import { and, count, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { automationRuns } from "../../db/schema/automation-runs";
import { broadcastAutomationEvent } from "../../ws/automation.ws";
import { normalizeEmailResponsePayload } from "./automation-email-response-payload";
import { AutomationConcurrencyLimitError } from "./automation-errors";
import {
  assertJobApplyDependencies,
  normalizeJobApplyPayload,
} from "./automation-job-apply-preparation";
import {
  buildAuditInput,
  buildEmailResponseInput,
  buildScheduledJobApplyInput,
  buildScrapeInput,
  type JobApplyPayload,
  normalizeScrapeTarget,
  resolveScrapeAction,
} from "./automation-run-inputs";
import type { CreateProgressEvent } from "./automation-service-contracts";
import {
  loadAutomationSettings,
  normalizeScheduledRunAt,
  resolveMaxConcurrentRuns,
} from "./automation-settings-support";

const DEFAULT_PROGRESS = 0;
const SCHEDULED_ACTION_EMAIL_RESPONSE = "email_response";
const MAX_RECOVERABLE_SCHEDULED_RUNS = SCHEMA_MAX_ITEMS_BOARDS;

type ScheduledRunQueue = (runId: string, runAt: string) => void;

interface AutomationRunCreatorOptions {
  createProgressEvent: CreateProgressEvent;
  queueScheduledRun: ScheduledRunQueue;
}

export class AutomationRunCreator {
  static readonly maxRecoverableScheduledRuns = MAX_RECOVERABLE_SCHEDULED_RUNS;

  constructor(private readonly options: AutomationRunCreatorOptions) {}

  async createJobApplyRun(
    payload: JobApplyPayload,
    runOptions: { includeActionInPayload?: boolean } = {},
  ): Promise<string> {
    const normalized = normalizeJobApplyPayload(payload);
    const settingsSnapshot = await loadAutomationSettings();
    const maxConcurrentRuns = resolveMaxConcurrentRuns(settingsSnapshot);

    await assertJobApplyDependencies(normalized);

    const now = new Date().toISOString();

    return db.transaction(async (tx) => {
      const runningRows = await tx
        .select({ count: count() })
        .from(automationRuns)
        .where(and(eq(automationRuns.status, "running"), eq(automationRuns.type, "job_apply")));

      const runningCount = runningRows[0]?.count || 0;
      if (runningCount >= maxConcurrentRuns) {
        throw new AutomationConcurrencyLimitError(runningCount, maxConcurrentRuns);
      }

      const runId = generateId();
      await tx.insert(automationRuns).values({
        id: runId,
        type: "job_apply",
        status: "running",
        jobId: normalized.jobId || null,
        userId: null,
        input: buildAuditInput(normalized, runOptions.includeActionInPayload ?? false),
        progress: DEFAULT_PROGRESS,
        currentStep: null,
        totalSteps: null,
        exitCode: null,
        timedOut: false,
        aborted: false,
        executionMs: null,
        startedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      return runId;
    });
  }

  async createScheduledJobApplyRun(
    payload: JobApplyPayload,
    runAt: string,
  ): Promise<{ runId: string; scheduledFor: string }> {
    const normalized = normalizeJobApplyPayload(payload);
    const scheduledFor = normalizeScheduledRunAt(runAt);
    await assertJobApplyDependencies(normalized);

    const now = new Date().toISOString();
    const runId = generateId();
    const scheduleInput = buildScheduledJobApplyInput(normalized, scheduledFor);

    await db.insert(automationRuns).values({
      id: runId,
      type: "job_apply",
      status: "pending",
      jobId: normalized.jobId || null,
      userId: null,
      input: scheduleInput,
      progress: DEFAULT_PROGRESS,
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

    this.options.queueScheduledRun(runId, scheduledFor);
    broadcastAutomationEvent(
      this.options.createProgressEvent({
        runId,
        action: "job_apply",
        status: "pending",
        message: `Scheduled for ${scheduledFor}`,
      }),
    );

    return { runId, scheduledFor };
  }

  async createScheduledEmailResponseRun(
    payload: EmailResponseRequest,
    runAt: string,
  ): Promise<{ runId: string; scheduledFor: string }> {
    const normalized = normalizeEmailResponsePayload(payload);
    const scheduledFor = normalizeScheduledRunAt(runAt);
    const now = new Date().toISOString();
    const runId = generateId();

    await db.insert(automationRuns).values({
      id: runId,
      type: "email",
      status: "pending",
      jobId: null,
      userId: null,
      input: buildEmailResponseInput(normalized, {
        includeAction: true,
        scheduledFor,
      }),
      progress: DEFAULT_PROGRESS,
      currentStep: null,
      totalSteps: null,
      exitCode: 0,
      timedOut: false,
      aborted: false,
      executionMs: null,
      startedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    this.options.queueScheduledRun(runId, scheduledFor);
    broadcastAutomationEvent(
      this.options.createProgressEvent({
        runId,
        action: SCHEDULED_ACTION_EMAIL_RESPONSE,
        status: "pending",
        message: `Scheduled for ${scheduledFor}`,
      }),
    );

    return { runId, scheduledFor };
  }

  async createScheduledScrapeRun(
    target: AutomationScrapeTarget,
    runAt: string,
  ): Promise<{ runId: string; scheduledFor: string }> {
    const normalizedTarget = normalizeScrapeTarget(target);
    const scheduledFor = normalizeScheduledRunAt(runAt);
    const now = new Date().toISOString();
    const runId = generateId();

    await db.insert(automationRuns).values({
      id: runId,
      type: "scrape",
      status: "pending",
      jobId: null,
      userId: null,
      input: buildScrapeInput(
        {
          target: normalizedTarget,
        },
        {
          includeAction: true,
          scheduledFor,
        },
      ),
      progress: DEFAULT_PROGRESS,
      currentStep: null,
      totalSteps: null,
      exitCode: 0,
      timedOut: false,
      aborted: false,
      executionMs: null,
      startedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    this.options.queueScheduledRun(runId, scheduledFor);
    broadcastAutomationEvent(
      this.options.createProgressEvent({
        runId,
        action: resolveScrapeAction(normalizedTarget),
        status: "pending",
        message: `Scheduled for ${scheduledFor}`,
      }),
    );

    return { runId, scheduledFor };
  }

  async createScrapeRun(target: AutomationScrapeTarget): Promise<string> {
    const normalizedTarget = normalizeScrapeTarget(target);
    const now = new Date().toISOString();
    const runId = generateId();

    await db.insert(automationRuns).values({
      id: runId,
      type: "scrape",
      status: "pending",
      jobId: null,
      userId: null,
      input: buildScrapeInput(
        {
          target: normalizedTarget,
        },
        {
          includeAction: false,
        },
      ),
      progress: DEFAULT_PROGRESS,
      currentStep: null,
      totalSteps: null,
      exitCode: 0,
      timedOut: false,
      aborted: false,
      executionMs: null,
      startedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    broadcastAutomationEvent(
      this.options.createProgressEvent({
        runId,
        action: resolveScrapeAction(normalizedTarget),
        status: "pending",
        message: `Queued ${normalizedTarget} scrape`,
      }),
    );

    return runId;
  }
}
