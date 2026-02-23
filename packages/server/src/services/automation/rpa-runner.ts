import { join } from "node:path";
import type {
  AutomationSettings,
  ErrorEnvelope,
  RpaRunEvent,
  RpaRunResult,
  RpaRunErrorCode,
} from "@bao/shared";
import {
  DEFAULT_AUTOMATION_SETTINGS,
  RPA_PROTOCOL_VERSION,
  rpaRunEventSchema,
  safeParseJson,
} from "@bao/shared";
import { config } from "../../config/env";
import { SCRAPER_DIR } from "../../config/paths";

const DEFAULT_KILL_SIGNAL = "SIGKILL";
const MAX_PROTOCOL_ERROR_LINES = 20;
const WINDOWS_PLATFORM = "win32";
const PYTHON_BINARY_WINDOWS = "python";
const PYTHON_BINARY_POSIX = "python3";

const PYTHON_BINARY =
  Bun.env.PYTHON_BINARY && Bun.env.PYTHON_BINARY.trim().length > 0
    ? Bun.env.PYTHON_BINARY.trim()
    : process.platform === WINDOWS_PLATFORM
      ? PYTHON_BINARY_WINDOWS
      : PYTHON_BINARY_POSIX;

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
          pending += decoder.decode(value, { stream: true });
          const lines = pending.split(/\r?\n/gu);
          pending = lines.pop() ?? "";
          for (const line of lines) {
            const normalized = line.trim();
            if (normalized.length > 0) {
              onLine(normalized);
            }
          }
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
  details?: Record<string, unknown>,
): ErrorEnvelope => ({
  code,
  message,
  ...(details ? { details } : {}),
});

/**
 * Generic process-level result for Python script execution.
 */
export interface PythonScriptExecutionResult {
  exitCode: number;
  timedOut: boolean;
  aborted: boolean;
  executionMs: number;
  stdoutLines: string[];
  stderrLines: string[];
}

/**
 * Options for generic Python script execution.
 */
export interface RunPythonScriptOptions {
  scriptName: string;
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

/**
 * Executes a Python script with Bun-native lifecycle controls and bounded IO capture.
 */
export async function runPythonScript(
  options: RunPythonScriptOptions,
): Promise<PythonScriptExecutionResult> {
  const timeoutMs = toSafeTimeoutMs(options.timeoutMs);
  const stdoutLimit = options.stdoutLineLimit ?? config.automationStdioBufferLimit;
  const stderrLimit = options.stderrLineLimit ?? config.automationStdioBufferLimit;
  const scriptPath = join(SCRAPER_DIR, options.scriptName);
  const startedAt = Date.now();
  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];
  let timedOut = false;
  let aborted = false;

  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  timeoutSignal.addEventListener(
    "abort",
    () => {
      timedOut = true;
    },
    { once: true },
  );

  if (options.signal) {
    options.signal.addEventListener(
      "abort",
      () => {
        aborted = true;
      },
      { once: true },
    );
  }

  const signal = options.signal ? AbortSignal.any([options.signal, timeoutSignal]) : timeoutSignal;
  const proc = Bun.spawn([PYTHON_BINARY, scriptPath], {
    cwd: SCRAPER_DIR,
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
    signal,
    killSignal: options.killSignal ?? DEFAULT_KILL_SIGNAL,
  });

  const payload = JSON.stringify({
    ...options.scriptInput,
    runId: options.runId,
    outputDir: options.outputDir ?? null,
    protocolVersion: RPA_PROTOCOL_VERSION,
  });

  await proc.stdin.write(payload);
  await proc.stdin.end();

  const stdoutTask = readNdjsonLines(proc.stdout, (line) => {
    pushBoundedLine(stdoutLines, line, stdoutLimit);
    options.onStdoutLine?.(line);
  });
  const stderrTask = readNdjsonLines(proc.stderr, (line) => {
    pushBoundedLine(stderrLines, line, stderrLimit);
    options.onStderrLine?.(line);
  });

  const [, , exitCode] = await Promise.all([stdoutTask, stderrTask, proc.exited]);
  const executionMs = Date.now() - startedAt;

  return {
    exitCode,
    timedOut,
    aborted,
    executionMs,
    stdoutLines,
    stderrLines,
  };
}

/**
 * Options for contract-first RPA script execution.
 */
export interface RunRpaScriptOptions {
  scriptName: string;
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

/**
 * Runs an RPA script and validates protocol events using shared schemas.
 */
export async function runRpaScript(
  options: RunRpaScriptOptions,
): Promise<RpaScriptExecutionResult> {
  const events: RpaRunEvent[] = [];
  const protocolErrors: string[] = [];
  let terminalResult: RpaRunResult | null = null;
  let terminalError: ErrorEnvelope | null = null;

  const processResult = await runPythonScript({
    scriptName: options.scriptName,
    scriptInput: {
      ...options.scriptInput,
      settings: options.automationSettings ?? DEFAULT_AUTOMATION_SETTINGS,
    },
    runId: options.executionContext.runId,
    timeoutMs: options.executionContext.timeoutMs,
    signal: options.executionContext.signal,
    outputDir: options.executionContext.outputDir,
    onStdoutLine: (line) => {
      const parsedJson = safeParseJson(line);
      const parsedEvent = rpaRunEventSchema.safeParse(parsedJson);
      if (!parsedEvent.success) {
        pushBoundedLine(protocolErrors, line, MAX_PROTOCOL_ERROR_LINES);
        return;
      }

      const event = parsedEvent.data;
      events.push(event);
      options.onEvent?.(event);
      if (event.eventType === "result") {
        terminalResult = event.result;
      }
      if (event.eventType === "error") {
        terminalError = event.error;
      }
    },
    onStderrLine: (line) => {
      const parsedJson = safeParseJson(line);
      const parsedEvent = rpaRunEventSchema.safeParse(parsedJson);
      if (!parsedEvent.success) {
        return;
      }

      const event = parsedEvent.data;
      if (event.eventType !== "progress") {
        return;
      }

      events.push(event);
      options.onEvent?.(event);
    },
  });

  if (processResult.timedOut) {
    terminalError = buildErrorEnvelope("PYTHON_TIMEOUT", "Python script timed out", {
      timeoutMs: options.executionContext.timeoutMs ?? config.automationScriptTimeoutMs,
    });
  }

  if (!terminalError && processResult.aborted) {
    terminalError = buildErrorEnvelope("PYTHON_CANCELLED", "Python script execution was cancelled");
  }

  if (!terminalError && processResult.exitCode !== 0) {
    terminalError = buildErrorEnvelope("PYTHON_RUNTIME_ERROR", "Python script exited with an error", {
      exitCode: processResult.exitCode,
      stderrTail: processResult.stderrLines,
      stdoutTail: processResult.stdoutLines,
    });
  }

  if (!terminalError && !terminalResult) {
    terminalError = buildErrorEnvelope(
      "SCRIPT_OUTPUT_INVALID",
      "Python script did not emit a terminal result event",
      {
        protocolErrors,
        stdoutTail: processResult.stdoutLines,
      },
    );
  }

  if (!terminalError && protocolErrors.length > 0 && !terminalResult) {
    terminalError = buildErrorEnvelope(
      "SCRIPT_PROTOCOL_ERROR",
      "Python script emitted malformed protocol lines",
      {
        protocolErrors,
      },
    );
  }

  return {
    result: terminalResult,
    error: terminalError,
    events,
    exitCode: processResult.exitCode,
    timedOut: processResult.timedOut,
    aborted: processResult.aborted,
    executionMs: processResult.executionMs,
    stdoutLines: processResult.stdoutLines,
    stderrLines: processResult.stderrLines,
  };
}
