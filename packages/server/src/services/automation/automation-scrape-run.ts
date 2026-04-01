import {
  API_ERROR_SCRAPE_JOBS_FAILED,
  API_ERROR_SCRAPE_STUDIOS_FAILED,
} from "@bao/shared/constants/api-errors";
import {
  isAutomationJobScrapeTarget,
  type AutomationScrapeTarget,
  type RpaCapabilityAuditReport,
} from "@bao/shared/constants/automation";
import { AUTOMATION_FINISHED_PROGRESS } from "@bao/shared/constants/automation-limits";
import type { ScraperOperationResult } from "@bao/shared/types/jobs";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { automationRuns } from "../../db/schema/automation-runs";
import { broadcastAutomationEvent } from "../../ws/automation.ws";
import { scraperService } from "../scraper-service";
import { markRunFailed } from "./automation-run-persistence";
import { createRpaCapabilityAuditReport } from "./automation-scrape-audit";
import { loadAutomationSettings } from "./automation-settings-support";
import type { CreateProgressEvent } from "./automation-service-contracts";
import {
  buildScrapeInput,
  normalizeScrapeTarget,
  resolveScrapeAction,
} from "./automation-run-inputs";

const DEFAULT_PROGRESS = 0;

const executeScrapeTarget = (target: AutomationScrapeTarget): Promise<ScraperOperationResult> => {
  if (!isAutomationJobScrapeTarget(target)) {
    return scraperService.scrapeStudios();
  }

  return scraperService.scrapeJobsForTarget(target);
};

const markScrapeRunStarted = async (
  runId: string,
  target: AutomationScrapeTarget,
  createProgressEvent: CreateProgressEvent,
): Promise<void> => {
  const now = new Date().toISOString();
  await db
    .update(automationRuns)
    .set({
      status: "running",
      input: buildScrapeInput({ target }, { includeAction: false }),
      progress: DEFAULT_PROGRESS,
      currentStep: 0,
      totalSteps: 1,
      exitCode: 0,
      timedOut: false,
      aborted: false,
      executionMs: null,
      startedAt: now,
      completedAt: null,
      updatedAt: now,
    })
    .where(eq(automationRuns.id, runId));

  broadcastAutomationEvent(
    createProgressEvent({
      runId,
      action: resolveScrapeAction(target),
      status: "running",
      message: `Running ${target} scrape`,
      step: 0,
      totalSteps: 1,
    }),
  );
};

const failScrapeRun = async (params: {
  runId: string;
  target: AutomationScrapeTarget;
  reason: unknown;
  executionMs: number;
  createProgressEvent: CreateProgressEvent;
}): Promise<void> => {
  const automationSettings = await loadAutomationSettings();
  const errorMessage = toErrorMessage(
    params.reason,
    params.target === "studios" ? API_ERROR_SCRAPE_STUDIOS_FAILED : API_ERROR_SCRAPE_JOBS_FAILED,
  );
  await markRunFailed(params.runId, errorMessage, automationSettings, {
    exitCode: 1,
    timedOut: false,
    aborted: false,
    executionMs: params.executionMs,
    errorEnvelope: null,
  });
  broadcastAutomationEvent(
    params.createProgressEvent({
      runId: params.runId,
      action: resolveScrapeAction(params.target),
      status: "error",
      message: errorMessage,
      step: 1,
      totalSteps: 1,
    }),
  );
};

const completeScrapeRun = async (params: {
  runId: string;
  target: AutomationScrapeTarget;
  result: ScraperOperationResult;
  executionMs: number;
  createProgressEvent: CreateProgressEvent;
}): Promise<void> => {
  const completedAt = new Date().toISOString();
  const output = {
    target: params.target,
    scraped: params.result.scraped,
    upserted: params.result.upserted,
    errors: params.result.errors,
    enrichment: params.result.enrichment,
  } satisfies Record<string, unknown>;

  await db
    .update(automationRuns)
    .set({
      status: "success",
      output,
      error: null,
      progress: AUTOMATION_FINISHED_PROGRESS,
      currentStep: 1,
      totalSteps: 1,
      exitCode: 0,
      timedOut: false,
      aborted: false,
      executionMs: params.executionMs,
      completedAt,
      updatedAt: completedAt,
    })
    .where(eq(automationRuns.id, params.runId));

  broadcastAutomationEvent(
    params.createProgressEvent({
      runId: params.runId,
      action: resolveScrapeAction(params.target),
      status: "success",
      message:
        `${params.target} scrape completed (` +
        `${params.result.scraped} scraped, ` +
        `${params.result.upserted} upserted, ` +
        `${params.result.enrichment.enrichedRecords} enriched)`,
      step: 1,
      totalSteps: 1,
    }),
  );
};

export const executeScrapeRun = async (
  runId: string,
  target: AutomationScrapeTarget,
  createProgressEvent: CreateProgressEvent,
): Promise<void> => {
  const normalizedTarget = normalizeScrapeTarget(target);
  const startedAt = Date.now();
  await markScrapeRunStarted(runId, normalizedTarget, createProgressEvent);
  const scrapeResult = await executeScrapeTarget(normalizedTarget).then(
    (value) => ({ ok: true as const, value }),
    (reason: unknown) => ({ ok: false as const, reason }),
  );

  if (!scrapeResult.ok) {
    await failScrapeRun({
      runId,
      target: normalizedTarget,
      reason: scrapeResult.reason,
      executionMs: Date.now() - startedAt,
      createProgressEvent,
    });
    return;
  }

  await completeScrapeRun({
    runId,
    target: normalizedTarget,
    result: scrapeResult.value,
    executionMs: Date.now() - startedAt,
    createProgressEvent,
  });
};

export const getRpaCapabilityAudit = async (): Promise<RpaCapabilityAuditReport> =>
  createRpaCapabilityAuditReport();
