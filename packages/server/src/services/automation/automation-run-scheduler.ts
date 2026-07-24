import type { JsonObject, JsonValue } from "@bao/shared/utils/json";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { automationRuns } from "../../db/schema/automation-runs";
import { createServerLogger } from "../../utils/logger";
import { parseScheduledRunMetadata } from "./automation-run-inputs";
import type { AutomationRunRow } from "./automation-service-contracts";

const automationSchedulerLogger = createServerLogger("automation-run-scheduler");

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

  async restorePendingRuns(limit: number): Promise<void> {
    if (this.recoveryInFlight) {
      return;
    }

    this.recoveryInFlight = true;
    const pendingRows = await db
      .select()
      .from(automationRuns)
      .where(eq(automationRuns.status, "pending"))
      .limit(limit);

    for (const row of pendingRows satisfies AutomationRunRow[]) {
      const metadata = parseScheduledRunMetadata(asJsonRecord(row.input));
      if (!metadata) {
        automationSchedulerLogger.warn(
          `[automation] skipping pending run without schedule metadata: ${row.id}`,
        );
        continue;
      }

      this.queue(row.id, metadata.runAt);
    }

    this.recoveryInFlight = false;
  }
}
