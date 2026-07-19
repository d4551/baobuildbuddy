import type { RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import { isRecord } from "@bao/shared/utils/type-guards";

/** Canonical medium date+time formatting for automation schedule surfaces. */
export const DATE_FORMAT_OPTIONS = {
  dateStyle: "medium",
  timeStyle: "short",
} as const satisfies Intl.DateTimeFormatOptions;

/**
 * Resolves the scheduled run-at timestamp from an RPA envelope, falling back to createdAt.
 */
export const resolveScheduledRunAt = (run: RpaRunExecutionEnvelope): string => {
  const runInput = run.input;
  if (!(runInput && isRecord(runInput))) {
    return run.createdAt;
  }
  const scheduleValue = runInput.schedule;
  if (!isRecord(scheduleValue)) {
    return run.createdAt;
  }
  return typeof scheduleValue.runAt === "string" && scheduleValue.runAt.length > 0
    ? scheduleValue.runAt
    : run.createdAt;
};

/**
 * Parses a datetime-local value into a future ISO timestamp, or null when invalid/past.
 */
export const toIsoTimestamp = (dateTimeLocal: string): string | null => {
  const parsed = new Date(dateTimeLocal);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
    return null;
  }
  return parsed.toISOString();
};
