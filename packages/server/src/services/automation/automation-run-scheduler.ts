import { AUTOMATION_RUN_STATUSES } from "@bao/shared/constants/automation";
import type { JsonObject, JsonValue } from "@bao/shared/utils/json";
import { and, eq, notInArray } from "drizzle-orm";
import { db } from "../../db/client";
import { automationRuns } from "../../db/schema/automation-runs";
import { createServerLogger } from "../../utils/logger";
import { parseScheduledRunMetadata } from "./automation-run-inputs";
import { createFailedRunUpdate } from "./automation-run-persistence-updates";
import type { AutomationRunRow } from "./automation-service-contracts";

const automationSchedulerLogger = createServerLogger("automation-run-scheduler");
export const ORPHANED_RUNNING_RUN_RECLAIMED_MESSAGE = "Orphaned running run reclaimed on startup";
export const UNKNOWN_RUN_STATUS_RECLAIMED_MESSAGE =
  "Unknown automation run status normalized to error on startup";
export const PENDING_RUN_MISSING_SCHEDULE_METADATA_MESSAGE =
  "Pending automation run missing schedule metadata";

type SchedulerTimer = ReturnType<typeof setTimeout>;

const asJsonRecord = (value: JsonValue | null | undefined): JsonObject | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value : null;

export class AutomationRunScheduler {
  private readonly scheduledRunTimers = new Map<string, SchedulerTimer>();
  private recoveryInFlight = false;

  constructor(private readonly executeScheduledRun: (runId: string) => Promise<void>) {}

  queue(runId: string, runAt: string): void {
    this.clear(runId);

    const delayMs = Math.max(0, new Date(runAt).getTime() - Date.now());
    const timer = setTimeout(() => {
      this.scheduledRunTimers.delete(runId);
      this.executeScheduledRun(runId).then(
        () => undefined,
        (error) => {
          automationSchedulerLogger.error(
            "[automation] scheduled run execution failed",
            error instanceof Error ? error.message : String(error),
          );
        },
      );
    }, delayMs);
    if (
      typeof timer === "object" &&
      timer !== null &&
      "unref" in timer &&
      typeof timer.unref === "function"
    ) {
      timer.unref();
    }

    this.scheduledRunTimers.set(runId, timer);
  }

  clear(runId: string): void {
    const timer = this.scheduledRunTimers.get(runId);
    if (!timer) {
      return;
    }

    clearTimeout(timer);
    this.scheduledRunTimers.delete(runId);
  }

  async reclaimRunningRuns(): Promise<void> {
    await db
      .update(automationRuns)
      .set(createFailedRunUpdate(UNKNOWN_RUN_STATUS_RECLAIMED_MESSAGE))
      .where(notInArray(automationRuns.status, [...AUTOMATION_RUN_STATUSES]));

    await db
      .update(automationRuns)
      .set(createFailedRunUpdate(ORPHANED_RUNNING_RUN_RECLAIMED_MESSAGE))
      .where(eq(automationRuns.status, "running"));
  }

  async restorePendingRuns(limit: number): Promise<void> {
    if (this.recoveryInFlight) {
      return;
    }

    this.recoveryInFlight = true;
    await this.restorePendingRunsUnlocked(limit).finally(() => {
      this.recoveryInFlight = false;
    });
  }

  private async restorePendingRunsUnlocked(limit: number): Promise<void> {
    const pendingRows = await db
      .select()
      .from(automationRuns)
      .where(eq(automationRuns.status, "pending"))
      .limit(limit);
    const pendingRunsWithoutSchedule: string[] = [];

    for (const row of pendingRows satisfies AutomationRunRow[]) {
      const metadata = parseScheduledRunMetadata(asJsonRecord(row.input));
      if (!metadata) {
        pendingRunsWithoutSchedule.push(row.id);
        continue;
      }

      this.queue(row.id, metadata.runAt);
    }

    await Promise.all(
      pendingRunsWithoutSchedule.map((runId) =>
        this.markPendingRunWithoutScheduleMetadata(runId),
      ),
    );
  }

  private async markPendingRunWithoutScheduleMetadata(runId: string): Promise<void> {
    await db
      .update(automationRuns)
      .set(createFailedRunUpdate(PENDING_RUN_MISSING_SCHEDULE_METADATA_MESSAGE))
      .where(and(eq(automationRuns.id, runId), eq(automationRuns.status, "pending")));
  }
}
