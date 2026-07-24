import { type RpaRunEvent, rpaProgressEventSchema } from "@bao/shared/schemas/rpa-events.schema";
import { RPA_PROTOCOL_VERSION } from "@bao/shared/schemas/rpa-protocol.schema";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import { createServerLogger } from "../../utils/logger";
import { broadcastAutomationEvent } from "../../ws/automation.ws";
import { persistProgress } from "./automation-run-persistence";
import type { ProgressEventParams } from "./automation-service-contracts";

const automationProgressLogger = createServerLogger("automation-progress-events");

export class AutomationProgressEvents {
  private readonly runEventSequences = new Map<string, number>();

  private nextRunEventSequence(runId: string): number {
    const current = this.runEventSequences.get(runId) ?? 0;
    this.runEventSequences.set(runId, current + 1);
    return current;
  }

  createProgressEvent(params: ProgressEventParams): RpaRunEvent {
    const event = {
      protocolVersion: RPA_PROTOCOL_VERSION,
      runId: params.runId,
      sequence: this.nextRunEventSequence(params.runId),
      timestamp: new Date().toISOString(),
      eventType: "progress",
      action: params.action,
      status: params.status,
      ...(params.message ? { message: params.message } : {}),
      ...(typeof params.step === "number" ? { step: params.step } : {}),
      ...(typeof params.totalSteps === "number" ? { totalSteps: params.totalSteps } : {}),
    } as const;

    const parsed = rpaProgressEventSchema.safeParse(event);
    if (!parsed.success) {
      automationProgressLogger.warn("Invalid progress event shape", {
        params,
        error: parsed.error.flatten(),
      });
      const fallbackEvent: RpaRunEvent = {
        ...event,
        action: "validation_error",
        status: "error",
      };
      return fallbackEvent;
    }
    return parsed.data;
  }

  createProgressHandler(onProgress?: (event: RpaRunEvent) => void): (event: RpaRunEvent) => void {
    return (event: RpaRunEvent): void => {
      if (event.eventType !== "progress") {
        return;
      }

      const normalizedEvent = {
        ...event,
        sequence: this.nextRunEventSequence(event.runId),
        timestamp: new Date().toISOString(),
      } satisfies RpaRunEvent;

      persistProgress(normalizedEvent).then(
        () => undefined,
        (error) => {
          automationProgressLogger.error(
            "Failed to persist progress event",
            error instanceof Error ? error.message : String(error),
          );
        },
      );
      broadcastAutomationEvent(normalizedEvent);
      onProgress?.(normalizedEvent);
    };
  }
}
