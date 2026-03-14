import type {
  AutomationScriptId,
  AutomationSettings,
  ErrorEnvelope,
  JsonObject,
  RpaRunErrorCode,
  RpaRunEvent,
  RpaRunResult,
} from "@bao/shared";
import {
  automationScriptEntryById,
  automationScriptIdSchema,
  DEFAULT_AUTOMATION_SETTINGS,
  RPA_PROTOCOL_VERSION,
  rpaRunEventSchema,
  safeParseJson,
} from "@bao/shared";
import { config } from "../../config/env";
import { SCRAPER_DIR } from "../../config/paths";
import { isAbsolute, resolve } from "path";

const DEFAULT_KILL_SIGNAL = "SIGKILL";
const MAX_PROTOCOL_ERROR_LINES = 20;
const NDJSON_LINE_SPLIT_PATTERN = /\r?\n/gu;

type ParsedProtocolLine =
  | {
      ok: true;
      event: RpaRunEvent;
    }
  | {
      ok: false;
      reason: "invalid_json" | "invalid_event";
    };

const toSafeTimeoutMs = (value: number | undefined): number => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  return config.automationScriptTimeoutMs;
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

const emitNonEmptyLines = (lines: string[], onLine: (line: string) => void): void => {
  for (const line of lines) {
    const normalized = line.trim();
    if (normalized.length > 0) {
      onLine(normalized);
    }
  }
};

const appendDecodedChunk = (
  decoder: TextDecoder,
  pending: string,
  value: Uint8Array,
  onLine: (line: string) => void,
): string => {
  const decoded = decoder.decode(value, { stream: true });
  const lines = `${pending}${decoded}`.split(NDJSON_LINE_SPLIT_PATTERN);
  const nextPending = lines.pop() ?? "";
  emitNonEmptyLines(lines, onLine);
  return nextPending;
};

const readNdjsonLines = async (
  stream: ReadableStream<Uint8Array>,
  onLine: (line: string) => void,
): Promise<void> => {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let pending = "";

  const flushPending = (): void => {
    const trailing = `${pending}${decoder.decode()}`.trim();
    if (trailing.length > 0) {
      onLine(trailing);
    }
    pending = "";
  };

  const readLoop = (): Promise<void> =>
    reader.read().then(
      ({ done, value }) => {
        if (done) {
          flushPending();
          return Promise.resolve();
        }

        if (value && value.length > 0) {
          pending = appendDecodedChunk(decoder, pending, value, onLine);
        }

        return readLoop();
      },
      () => Promise.resolve(),
    );

  return readLoop();
};

const buildErrorEnvelope = (
  code: RpaRunErrorCode,
  message: string,
  details?: JsonObject,
): ErrorEnvelope => ({
  code,
  message,
  ...(details ? { details } : {}),
});

/**
 * Generic process-level result for automation script execution.
 */
export interface AutomationScriptExecutionResult {
  exitCode: number;
  timedOut: boolean;
  aborted: boolean;
  executionMs: number;
  stdoutLines: string[];
  stderrLines: string[];
}

/**
 * Options for generic Bun-based automation script execution.
 */
export interface RunAutomationScriptOptions {
  scriptId?: AutomationScriptId;
  scriptPath?: string;
  scriptInput: Record<string, unknown>;
  timeoutMs?: number;
  signal?: AbortSignal;
  runId: string;
  outputDir?: string;
  killSignal?: number | string;
  stdoutLineLimit?: number;
  stderrLineLimit?: number;
  onStdoutLine?: (line: string) => void;
  onStderrLine?: (line: string) => void;
}

type ExecutionAbortState = {
  timedOut: boolean;
  aborted: boolean;
};

const createExecutionAbortState = (): ExecutionAbortState => ({
  timedOut: false,
  aborted: false,
});

const createProcessSignal = (
  timeoutSignal: AbortSignal,
  externalSignal: AbortSignal | undefined,
  state: ExecutionAbortState,
): AbortSignal => {
  timeoutSignal.addEventListener(
    "abort",
    () => {
      state.timedOut = true;
    },
    { once: true },
  );

  if (!externalSignal) {
    return timeoutSignal;
  }
  externalSignal.addEventListener(
    "abort",
    () => {
      state.aborted = true;
    },
    { once: true },
  );
  return AbortSignal.any([externalSignal, timeoutSignal]);
};

const resolveAutomationScriptPath = (options: RunAutomationScriptOptions): string => {
  const scriptPath = options.scriptPath?.trim();
  if (scriptPath && scriptPath.length > 0) {
    return isAbsolute(scriptPath) ? scriptPath : resolve(SCRAPER_DIR, scriptPath);
  }

  const parsedScriptId = automationScriptIdSchema.safeParse(options.scriptId);
  if (!parsedScriptId.success) {
    return resolve(SCRAPER_DIR, "__missing-script__.ts");
  }

  return resolve(SCRAPER_DIR, automationScriptEntryById[parsedScriptId.data]);
};

const spawnAutomationProcess = (
  scriptPath: string,
  signal: AbortSignal,
  killSignal: number | string | undefined,
): ReturnType<typeof Bun.spawn> =>
  Bun.spawn([process.execPath, scriptPath], {
    cwd: SCRAPER_DIR,
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
    signal,
    killSignal: killSignal ?? DEFAULT_KILL_SIGNAL,
  });

interface ProcessWritableStdin {
  write(payload: string): Promise<number | undefined> | number | undefined;
  end(): Promise<undefined> | undefined;
}

const isWritableStdin = (stream: unknown): stream is ProcessWritableStdin => {
  if (typeof stream !== "object" || stream === null) {
    return false;
  }
  if (!("write" in stream && "end" in stream)) {
    return false;
  }
  return typeof stream.write === "function" && typeof stream.end === "function";
};

const writeProcessPayload = async (
  stream: ProcessWritableStdin,
  payload: string,
): Promise<void> => {
  await stream.write(payload);
  await stream.end();
};

const isReadableBinaryStream = (
  stream: number | ReadableStream<Uint8Array> | undefined,
): stream is ReadableStream<Uint8Array> => stream instanceof ReadableStream;

const createClosedBinaryStream = (): ReadableStream<Uint8Array> =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      controller.close();
    },
  });

const resolveReadableBinaryStream = (
  stream: number | ReadableStream<Uint8Array> | undefined,
): ReadableStream<Uint8Array> =>
  isReadableBinaryStream(stream) ? stream : createClosedBinaryStream();

const buildScriptPayload = (options: RunAutomationScriptOptions): string =>
  JSON.stringify({
    ...options.scriptInput,
    runId: options.runId,
    outputDir: options.outputDir ?? null,
    protocolVersion: RPA_PROTOCOL_VERSION,
  });

/**
 * Executes a Bun-based automation script with bounded IO capture and cancellation.
 */
export async function runAutomationScript(
  options: RunAutomationScriptOptions,
): Promise<AutomationScriptExecutionResult> {
  const timeoutMs = toSafeTimeoutMs(options.timeoutMs);
  const stdoutLimit = options.stdoutLineLimit ?? config.automationStdioBufferLimit;
  const stderrLimit = options.stderrLineLimit ?? config.automationStdioBufferLimit;
  const scriptPath = resolveAutomationScriptPath(options);
  const startedAt = Date.now();
  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];
  const abortState = createExecutionAbortState();

  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = createProcessSignal(timeoutSignal, options.signal, abortState);
  const proc = spawnAutomationProcess(scriptPath, signal, options.killSignal);
  if (isWritableStdin(proc.stdin)) {
    await writeProcessPayload(proc.stdin, buildScriptPayload(options));
  }

  const stdoutTask = readNdjsonLines(resolveReadableBinaryStream(proc.stdout), (line) => {
    pushBoundedLine(stdoutLines, line, stdoutLimit);
    options.onStdoutLine?.(line);
  });
  const stderrTask = readNdjsonLines(resolveReadableBinaryStream(proc.stderr), (line) => {
    pushBoundedLine(stderrLines, line, stderrLimit);
    options.onStderrLine?.(line);
  });

  const [, , exitCode] = await Promise.all([stdoutTask, stderrTask, proc.exited]);
  const executionMs = Date.now() - startedAt;

  return {
    exitCode,
    timedOut: abortState.timedOut,
    aborted: abortState.aborted,
    executionMs,
    stdoutLines,
    stderrLines,
  };
}

/**
 * Options for contract-first RPA script execution.
 */
export interface RunRpaScriptOptions {
  scriptId?: AutomationScriptId;
  scriptPath?: string;
  scriptInput: Record<string, unknown>;
  executionContext: {
    runId: string;
    timeoutMs?: number;
    signal?: AbortSignal;
    outputDir?: string;
  };
  automationSettings?: AutomationSettings | null;
  onEvent?: (event: RpaRunEvent) => void;
}

/**
 * Result envelope for a contract-validated RPA script run.
 */
export interface RpaScriptExecutionResult {
  result: RpaRunResult | null;
  error: ErrorEnvelope | null;
  events: RpaRunEvent[];
  exitCode: number;
  timedOut: boolean;
  aborted: boolean;
  executionMs: number;
  stdoutLines: string[];
  stderrLines: string[];
}

type ProtocolCaptureState = {
  events: RpaRunEvent[];
  protocolErrors: string[];
  terminalResult: RpaRunResult | null;
  terminalError: ErrorEnvelope | null;
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
