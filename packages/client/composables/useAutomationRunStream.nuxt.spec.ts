import type { RpaRunEvent, RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import { beforeEach, describe, expect, it, vi } from "vitest";
const NUM_3 = 3;
const NUM_67 = 67;

const getRunMock = vi.fn<(runId: string) => Promise<RpaRunExecutionEnvelope>>();
const subscribeToRunMock =
  vi.fn<(runId: string, onEvent: (event: RpaRunEvent) => void) => () => void>();

let latestEventHandler: ((event: RpaRunEvent) => void) | null = null;
const unsubscribeMock = vi.fn();

vi.mock("./useAutomation", () => ({
  useAutomation: () => ({
    getRun: getRunMock,
    subscribeToRun: (runId: string, onEvent: (event: RpaRunEvent) => void) => {
      latestEventHandler = onEvent;
      return subscribeToRunMock(runId, onEvent);
    },
  }),
}));

const createRun = (status: RpaRunExecutionEnvelope["status"]): RpaRunExecutionEnvelope => ({
  id: "run_12345678",
  type: "job_apply",
  status,
  jobId: "job_1",
  userId: null,
  input: {},
  output: null,
  screenshots: [],
  error: null,
  progress: 0,
  currentStep: 0,
  totalSteps: 3,
  startedAt: new Date().toISOString(),
  completedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  exitCode: null,
  timedOut: false,
  aborted: false,
  executionMs: null,
});

const { useAutomationRunStream } = await import("./useAutomationRunStream");

beforeEach(() => {
  vi.clearAllMocks();
  latestEventHandler = null;
  unsubscribeMock.mockReset();
  subscribeToRunMock.mockReturnValue(unsubscribeMock);
});

async function assertStartsStreamLifecycle(): Promise<void> {
  getRunMock.mockResolvedValueOnce(createRun("running"));
  const stream = useAutomationRunStream();

  await stream.start("run_12345678");

  expect(getRunMock).toHaveBeenCalledWith("run_12345678");
  expect(subscribeToRunMock).toHaveBeenCalledTimes(1);
  expect(stream.state.value).toBe("loading");
  expect(stream.run.value?.status).toBe("running");
  expect(stream.isStreaming.value).toBe(true);
}

async function assertAppliesEventsAndStopsAtResult(): Promise<void> {
  getRunMock.mockResolvedValueOnce(createRun("running"));
  const stream = useAutomationRunStream();

  await stream.start("run_12345678");
  expect(latestEventHandler).not.toBeNull();

  latestEventHandler?.({
    protocolVersion: "1.0",
    runId: "run_12345678",
    sequence: 1,
    timestamp: new Date().toISOString(),
    eventType: "progress",
    action: "fill_form",
    status: "running",
    step: 2,
    totalSteps: 3,
    message: "Filling required fields",
  });

  expect(stream.run.value?.currentStep).toBe(2);
  expect(stream.run.value?.totalSteps).toBe(NUM_3);
  expect(stream.run.value?.progress).toBe(NUM_67);

  latestEventHandler?.({
    protocolVersion: "1.0",
    runId: "run_12345678",
    sequence: 2,
    timestamp: new Date().toISOString(),
    eventType: "result",
    result: {
      success: true,
      error: null,
      screenshots: [],
      artifacts: [],
      steps: [{ action: "submit", status: "ok", message: "Submitted" }],
    },
  });

  expect(stream.state.value).toBe("success");
  expect(stream.run.value?.status).toBe("success");
  expect(stream.isStreaming.value).toBe(false);
  expect(unsubscribeMock).toHaveBeenCalledTimes(1);
}

async function assertIgnoresStaleProgressEvents(): Promise<void> {
  getRunMock.mockResolvedValueOnce(createRun("running"));
  const stream = useAutomationRunStream();

  await stream.start("run_12345678");
  expect(latestEventHandler).not.toBeNull();

  latestEventHandler?.({
    protocolVersion: "1.0",
    runId: "run_12345678",
    sequence: 2,
    timestamp: new Date().toISOString(),
    eventType: "progress",
    action: "fill_profile",
    status: "success",
    step: 1,
    totalSteps: 3,
    message: "Completed one step",
  });

  latestEventHandler?.({
    protocolVersion: "1.0",
    runId: "run_12345678",
    sequence: 1,
    timestamp: new Date().toISOString(),
    eventType: "progress",
    action: "old_step",
    status: "running",
    step: 0,
    totalSteps: 3,
    message: "Out-of-order event",
  });

  expect(stream.run.value?.status).toBe("running");
  expect(stream.run.value?.currentStep).toBe(1);
  expect(stream.events.value.length).toBe(1);
  expect(stream.state.value).toBe("loading");
}

async function assertMapsUnauthorizedToUiState(): Promise<void> {
  getRunMock.mockRejectedValueOnce({ status: 401, message: "Unauthorized" });
  const stream = useAutomationRunStream();

  await stream.start("run_12345678");

  expect(stream.state.value).toBe("unauthorized");
  expect(stream.run.value).toBeNull();
  expect(stream.streamError.value?.message).toBe("Unauthorized");
}

describe("useAutomationRunStream", () => {
  it("starts stream lifecycle and subscribes for non-terminal runs", assertStartsStreamLifecycle);

  it(
    "applies progress/result events and stops on terminal result",
    assertAppliesEventsAndStopsAtResult,
  );

  it(
    "ignores stale event sequences and does not mark success on progress success",
    assertIgnoresStaleProgressEvents,
  );

  it("maps unauthorized fetch failures to deterministic ui state", assertMapsUnauthorizedToUiState);
});
