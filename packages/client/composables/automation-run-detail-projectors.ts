import type { JsonObject, JsonValue } from "@bao/shared/utils/json";
import { safeParseJson } from "@bao/shared/utils/json";
import { asJsonArray, asNumber, asString, isRecord } from "@bao/shared/utils/type-guards";
import type { TimelineStatus } from "~/composables/automation-run-detail-page-contracts";

export type RunDetailFields = {
  id: string;
  status: TimelineStatus;
  updatedAt: string;
  progress: number | null;
  screenshots: readonly string[];
  input: JsonObject | null;
  output: JsonValue | null;
};

export type OutputStep = {
  action: string;
  status: "ok" | "error";
  message?: string;
};

export type StreamEventFields = {
  eventType: string;
  runId: string;
  sequence: number;
  timestamp: string;
  status?: TimelineStatus;
  message?: string;
  action?: string;
  resultSuccess?: boolean;
  resultError?: string;
  errorMessage?: string;
};

export const toTimelineStatus = (value: string | undefined): TimelineStatus => {
  if (value === "pending" || value === "running" || value === "success" || value === "error") {
    return value;
  }
  return "pending";
};

const projectJson = <T>(value: T): JsonValue | null => safeParseJson(JSON.stringify(value));

export const projectRunDetail = <T>(value: T): RunDetailFields | null => {
  const parsed = projectJson(value);
  if (!isRecord(parsed)) {
    return null;
  }
  const id = asString(parsed.id);
  const status = asString(parsed.status);
  const updatedAt = asString(parsed.updatedAt);
  if (!(id && status && updatedAt)) {
    return null;
  }
  const screenshots = asJsonArray(parsed.screenshots) ?? [];
  return {
    id,
    status: toTimelineStatus(status),
    updatedAt,
    progress: asNumber(parsed.progress) ?? null,
    screenshots: screenshots.filter((entry): entry is string => typeof entry === "string"),
    input: isRecord(parsed.input) ? parsed.input : null,
    output: parsed.output ?? null,
  };
};

const projectStreamEvent = (value: JsonValue): StreamEventFields | null => {
  if (!isRecord(value)) {
    return null;
  }
  const eventType = asString(value.eventType);
  const runId = asString(value.runId);
  const sequence = asNumber(value.sequence);
  const timestamp = asString(value.timestamp);
  if (!(eventType && runId && sequence !== undefined && timestamp)) {
    return null;
  }
  const fields: StreamEventFields = {
    eventType,
    runId,
    sequence,
    timestamp,
  };
  const status = asString(value.status);
  if (status) {
    fields.status = toTimelineStatus(status);
  }
  const message = asString(value.message);
  if (message) {
    fields.message = message;
  }
  const action = asString(value.action);
  if (action) {
    fields.action = action;
  }
  if (isRecord(value.result)) {
    fields.resultSuccess = value.result.success === true;
    const resultError = asString(value.result.error);
    if (resultError) {
      fields.resultError = resultError;
    }
  }
  if (isRecord(value.error)) {
    const errorMessage = asString(value.error.message);
    if (errorMessage) {
      fields.errorMessage = errorMessage;
    }
  }
  return fields;
};

export const projectStreamEvents = <T>(value: T): readonly StreamEventFields[] => {
  const parsed = projectJson(value);
  const entries = asJsonArray(parsed) ?? [];
  const events: StreamEventFields[] = [];
  for (const entry of entries) {
    const event = projectStreamEvent(entry);
    if (event) {
      events.push(event);
    }
  }
  return events;
};

export const projectOutputSteps = (output: JsonValue | null): OutputStep[] => {
  if (!isRecord(output)) {
    return [];
  }
  const steps = asJsonArray(output.steps) ?? [];
  const projected: OutputStep[] = [];
  for (const step of steps) {
    if (!isRecord(step)) {
      continue;
    }
    const action = asString(step.action);
    const status = asString(step.status);
    if (!(action && (status === "ok" || status === "error"))) {
      continue;
    }
    const message = asString(step.message);
    projected.push(message ? { action, status, message } : { action, status });
  }
  return projected;
};

export const toLocaleCode = <T>(value: T): string => {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string" && value[0].length > 0) {
    return value[0];
  }
  return "en-US";
};
