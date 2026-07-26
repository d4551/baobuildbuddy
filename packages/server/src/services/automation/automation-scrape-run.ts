import {
  API_ERROR_SCRAPE_JOBS_FAILED,
  API_ERROR_SCRAPE_STUDIOS_FAILED,
} from "@bao/shared/constants/api-errors";
import {
  type AutomationScrapeTarget,
  isAutomationJobScrapeTarget,
  type RpaCapabilityAuditReport,
} from "@bao/shared/constants/automation";
import { AUTOMATION_FINISHED_PROGRESS } from "@bao/shared/constants/automation-limits";
import type { AutomationRunStatus } from "@bao/shared/constants/automation";
import { jsonObjectSchema } from "@bao/shared/schemas/json.schema";
import type { ScraperOperationResult } from "@bao/shared/types/jobs";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import type { JsonObject } from "@bao/shared/utils/json";
import { safeParseJson } from "@bao/shared/utils/json";
import { settle } from "@bao/shared/utils/promise";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { automationRuns } from "../../db/schema/automation-runs";
import { broadcastAutomationEvent } from "../../ws/automation.ws";
import { scraperService } from "../scraper-service";
import {
  buildScrapeInput,
  normalizeScrapeTarget,
  resolveScrapeAction,
} from "./automation-run-inputs";
import { markRunFailed } from "./automation-run-persistence";
import { createRpaCapabilityAuditReport } from "./automation-scrape-audit";
import type { CreateProgressEvent } from "./automation-service-contracts";
import { loadAutomationSettings } from "./automation-settings-support";

const DEFAULT_PROGRESS = 0;

const toJsonRecord = (value: object): JsonObject => {
  const parsed = safeParseJson(JSON.stringify(value));
  const objectResult = jsonObjectSchema.safeParse(parsed);
  return objectResult.success ? objectResult.data : {};
};

const executeScrapeTarget = (target: AutomationScrapeTarget): Promise<ScraperOperationResult> => {
  if (!isAutomationJobScrapeTarget(target)) {
    return scraperService.scrapeStudios();
  }

  return scraperService.scrapeJobsForTarget(target);
};

/** Non-zero process exit used for every failed automation run. */
const AUTOMATION_FAILURE_EXIT_CODE = 1;

const resolveRunStartMessage = (target: AutomationScrapeTarget): string =>
  isAutomationJobScrapeTarget(target)
    ? `Running ${target} scrape`
    : "Importing the curated studio directory";

const resolveRunCompleteMessage = (
  target: AutomationScrapeTarget,
  result: ScraperOperationResult,
): string => {
  const upsertSummary = `${result.upserted} upserted, ${result.enrichment.enrichedRecords} enriched)`;
  return isAutomationJobScrapeTarget(target)
    ? `${target} scrape completed (${result.scraped} scraped, ${upsertSummary}`
    : `curated studio directory import completed (${result.scraped} imported, ${upsertSummary}`;
};

/**
 * A run that collected nothing because the target was misconfigured is a failure,
 * not a success.
 *
 * This used to be hardcoded to `success` with `exitCode: 0`, so a scrape that
 * returned `scraped: 0` alongside `errors: ["Missing enabled hitmarker portal
 * fallbackUrl."]` was indistinguishable in the run history from a scrape that
 * genuinely worked. Partial runs — some records collected despite errors — stay
 * successful so a single flaky portal page does not discard the rest of the harvest;
 * the errors remain in `output.errors` either way.
 */
export const resolveScrapeRunOutcome = (
  result: ScraperOperationResult,
): {
  status: Extract<AutomationRunStatus, "success" | "error">;
  error: string | null;
  exitCode: number;
} => {
  if (result.errors.length > 0 && result.scraped === 0) {
    return {
      status: "error",
      error: result.errors.join("; "),
      exitCode: AUTOMATION_FAILURE_EXIT_CODE,
    };
  }
  return { status: "success", error: null, exitCode: 0 };
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
      message: resolveRunStartMessage(target),
      step: 0,
      totalSteps: 1,
    }),
  );
};

const failScrapeRun = async (params: {
  runId: string;
  target: AutomationScrapeTarget;
  reason: Error;
  executionMs: number;
  createProgressEvent: CreateProgressEvent;
}): Promise<void> => {
  const automationSettings = await loadAutomationSettings();
  const errorMessage = toErrorMessage(
    params.reason,
    params.target === "studios" ? API_ERROR_SCRAPE_STUDIOS_FAILED : API_ERROR_SCRAPE_JOBS_FAILED,
  );
  await markRunFailed(params.runId, errorMessage, automationSettings, {
    exitCode: AUTOMATION_FAILURE_EXIT_CODE,
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
  const output = toJsonRecord({
    target: params.target,
    scraped: params.result.scraped,
    upserted: params.result.upserted,
    errors: params.result.errors,
    enrichment: params.result.enrichment,
  });

  const outcome = resolveScrapeRunOutcome(params.result);

  await db
    .update(automationRuns)
    .set({
      status: outcome.status,
      output,
      error: outcome.error,
      progress: AUTOMATION_FINISHED_PROGRESS,
      currentStep: 1,
      totalSteps: 1,
      exitCode: outcome.exitCode,
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
      status: outcome.status,
      message: outcome.error ?? resolveRunCompleteMessage(params.target, params.result),
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
  const scrapeResult = await settle(executeScrapeTarget(normalizedTarget));

  if (scrapeResult.status === "rejected") {
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
