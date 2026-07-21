import type { RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import { describe, expect, it } from "vitest";
import { DATE_FORMAT_OPTIONS, resolveScheduledRunAt, toIsoTimestamp } from "./schedule-timestamp";

const createEnvelope = (
  overrides: Pick<RpaRunExecutionEnvelope, "createdAt" | "input">,
): RpaRunExecutionEnvelope => ({
  id: "019f7bcf-0000-7000-8000-000000000001",
  type: "job_apply",
  status: "pending",
  jobId: null,
  userId: null,
  input: overrides.input,
  output: null,
  screenshots: null,
  error: null,
  progress: null,
  currentStep: null,
  totalSteps: null,
  startedAt: null,
  completedAt: null,
  createdAt: overrides.createdAt,
  updatedAt: overrides.createdAt,
  exitCode: null,
  timedOut: false,
  aborted: false,
  executionMs: null,
});

describe("schedule-timestamp SSOT", () => {
  it("exposes canonical medium date+time options", () => {
    expect(DATE_FORMAT_OPTIONS).toEqual({ dateStyle: "medium", timeStyle: "short" });
  });

  it("resolves schedule.runAt when present", () => {
    const runAt = "2026-07-20T12:00:00.000Z";
    expect(
      resolveScheduledRunAt(
        createEnvelope({
          createdAt: "2026-07-19T12:00:00.000Z",
          input: { schedule: { runAt } },
        }),
      ),
    ).toBe(runAt);
  });

  it("falls back to createdAt without schedule input", () => {
    expect(
      resolveScheduledRunAt(
        createEnvelope({
          createdAt: "2026-07-19T12:00:00.000Z",
          input: null,
        }),
      ),
    ).toBe("2026-07-19T12:00:00.000Z");
  });

  it("rejects past or invalid datetime-local values", () => {
    expect(toIsoTimestamp("not-a-date")).toBeNull();
    expect(toIsoTimestamp("2000-01-01T00:00")).toBeNull();
  });
});
