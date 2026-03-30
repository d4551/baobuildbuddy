import type {
  ErrorEnvelope,
  RpaRunEvent,
  RpaRunResult,
} from "@bao/shared";
import {
  DEFAULT_AUTOMATION_SETTINGS,
  rpaRunEventSchema,
  safeParseJson,
} from "@bao/shared";
import { config } from "../../config/env";
import type {
  AutomationScriptExecutionResult,
  RpaScriptExecutionResult,
  RunRpaScriptOptions,
} from "./rpa-runner-contracts";
import { buildErrorEnvelope } from "./rpa-runner-contracts";
import { runAutomationScript } from "./rpa-runner-process";

const MAX_PROTOCOL_ERROR_LINES = 20;

type ParsedProtocolLine =
  | {
      ok: true;
      event: RpaRunEvent;
    }
  | {
      ok: false;
      reason: "invalid_json" | "invalid_event";
    };

type ProtocolCaptureState = {
  events: RpaRunEvent[];
  protocolErrors: string[];
  terminalResult: RpaRunResult | null;
  terminalError: ErrorEnvelope | null;
};

const pushBoundedLine = (target: string[], value: string, limit: number): void => {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return;
  }
  target.push(normalized);
  if (target.length > limit) {
    target.shift();
  }
};

const isLikelyJsonLine = (line: string): boolean => {
  const normalized = line.trim();
  return normalized.startsWith("{") && normalized.endsWith("}");
};

const parseProtocolLine = (line: string): ParsedProtocolLine => {
  const parsedJson = safeParseJson(line);
  if (parsedJson === null) {
    return {
      ok: false,
      reason: "invalid_json",
    };
  }

  const parsedEvent = rpaRunEventSchema.safeParse(parsedJson);
  if (!parsedEvent.success) {
    return {
      ok: false,
      reason: "invalid_event",
    };
  }

  return {
    ok: true,
    event: parsedEvent.data,
  };
};

const createProtocolCaptureState = (): ProtocolCaptureState => ({
  events: [],
  protocolErrors: [],
  terminalResult: null,
  terminalError: null,
});

const pushProtocolError = (
  state: ProtocolCaptureState,
  source: "stdout" | "stderr",
  line: string,
  reason: string,
): void => {
  pushBoundedLine(state.protocolErrors, `${source}:${reason}:${line}`, MAX_PROTOCOL_ERROR_LINES);
};

const handleStdoutLine = (
  line: string,
  state: ProtocolCaptureState,
  onEvent: ((event: RpaRunEvent) => void) | undefined,
): void => {
  if (!isLikelyJsonLine(line)) {
    pushProtocolError(state, "stdout", line, "non_json_line");
    return;
  }
  const parsedLine = parseProtocolLine(line);
  if (!parsedLine.ok) {
    pushProtocolError(state, "stdout", line, parsedLine.reason);
    return;
  }

  const event = parsedLine.event;
  if (event.eventType === "progress") {
    pushProtocolError(state, "stdout", line, "unexpected_progress_event");
    return;
  }
  state.events.push(event);
  onEvent?.(event);
  if (event.eventType === "result") {
    state.terminalResult = event.result;
  } else if (event.eventType === "error") {
    state.terminalError = event.error;
  }
};

const handleStderrLine = (
  line: string,
  state: ProtocolCaptureState,
  onEvent: ((event: RpaRunEvent) => void) | undefined,
): void => {
  if (!isLikelyJsonLine(line)) {
    return;
  }
  const parsedLine = parseProtocolLine(line);
  if (!parsedLine.ok) {
    pushProtocolError(state, "stderr", line, parsedLine.reason);
    return;
  }
  if (parsedLine.event.eventType !== "progress") {
    pushProtocolError(state, "stderr", line, "unexpected_non_progress_event");
    return;
  }
  state.events.push(parsedLine.event);
  onEvent?.(parsedLine.event);
};

const resolveTerminalError = (
  state: ProtocolCaptureState,
  processResult: AutomationScriptExecutionResult,
  timeoutMs: number | undefined,
): ErrorEnvelope | null => {
  let terminalError = state.terminalError;
  if (processResult.timedOut) {
    terminalError = buildErrorEnvelope("AUTOMATION_TIMEOUT", "Automation script timed out", {
      timeoutMs: timeoutMs ?? config.automationScriptTimeoutMs,
    });
  }
  if (!terminalError && processResult.aborted) {
    terminalError = buildErrorEnvelope(
      "AUTOMATION_CANCELLED",
      "Automation script execution was cancelled",
    );
  }
  if (!terminalError && processResult.exitCode !== 0) {
    terminalError = buildErrorEnvelope(
      "AUTOMATION_RUNTIME_ERROR",
      "Automation script exited with an error",
      {
        exitCode: processResult.exitCode,
        stderrTail: processResult.stderrLines,
        stdoutTail: processResult.stdoutLines,
      },
    );
  }
  if (!terminalError && state.protocolErrors.length > 0) {
    terminalError = buildErrorEnvelope(
      "SCRIPT_PROTOCOL_ERROR",
      "Automation script emitted malformed protocol lines",
      {
        protocolErrors: state.protocolErrors,
        stdoutTail: processResult.stdoutLines,
        stderrTail: processResult.stderrLines,
      },
    );
  }
  if (!(terminalError || state.terminalResult)) {
    terminalError = buildErrorEnvelope(
      "SCRIPT_OUTPUT_INVALID",
      "Automation script did not emit a terminal result event",
      { stdoutTail: processResult.stdoutLines },
    );
  }
  return terminalError;
};

/**
 * Runs an RPA script and validates protocol events using shared schemas.
 */
export async function runRpaScript(
  options: RunRpaScriptOptions,
): Promise<RpaScriptExecutionResult> {
  const state = createProtocolCaptureState();

  const processResult = await runAutomationScript({
    scriptId: options.scriptId,
    scriptPath: options.scriptPath,
    scriptInput: {
      ...options.scriptInput,
      settings: options.automationSettings ?? DEFAULT_AUTOMATION_SETTINGS,
    },
    runId: options.executionContext.runId,
    timeoutMs: options.executionContext.timeoutMs,
    signal: options.executionContext.signal,
    outputDir: options.executionContext.outputDir,
    onStdoutLine: (line) => {
      handleStdoutLine(line, state, options.onEvent);
    },
    onStderrLine: (line) => {
      handleStderrLine(line, state, options.onEvent);
    },
  });

  const terminalError = resolveTerminalError(
    state,
    processResult,
    options.executionContext.timeoutMs,
  );

  return {
    result: state.terminalResult,
    error: terminalError,
    events: state.events,
    exitCode: processResult.exitCode,
    timedOut: processResult.timedOut,
    aborted: processResult.aborted,
    executionMs: processResult.executionMs,
    stdoutLines: processResult.stdoutLines,
    stderrLines: processResult.stderrLines,
  };
}
