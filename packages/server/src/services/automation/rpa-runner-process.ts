import { isAbsolute, resolve } from "node:path";
import {
  automationScriptEntryById,
  automationScriptIdSchema,
} from "@bao/shared/schemas/automation-scripts.schema";
import { RPA_PROTOCOL_VERSION } from "@bao/shared/schemas/rpa-protocol.schema";
import { config } from "../../config/env";
import { SCRAPER_DIR } from "../../config/paths";
import type {
  AutomationScriptExecutionResult,
  RunAutomationScriptOptions,
} from "./rpa-runner-contracts";

const DEFAULT_KILL_SIGNAL = "SIGKILL";
const NDJSON_LINE_SPLIT_PATTERN = /\r?\n/gu;

type ExecutionAbortState = {
  timedOut: boolean;
  aborted: boolean;
};

const toSafeTimeoutMs = (value: number | undefined, defaultTimeoutMs: number): number => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  return defaultTimeoutMs;
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

const resolveAutomationCommand = (scriptPath: string): string[] => {
  const scriptRunnerPath = process.env.BAO_SCRIPT_RUNNER_PATH?.trim();
  const scriptRunnerEntrypointPath = process.env.BAO_SCRIPT_RUNNER_ENTRYPOINT_PATH?.trim();
  if (scriptRunnerPath && scriptRunnerPath.length > 0) {
    return scriptRunnerEntrypointPath && scriptRunnerEntrypointPath.length > 0
      ? [scriptRunnerPath, scriptRunnerEntrypointPath, SCRAPER_DIR, scriptPath]
      : [scriptRunnerPath, SCRAPER_DIR, scriptPath];
  }

  return [process.execPath, scriptPath];
};

const spawnAutomationProcess = (
  scriptPath: string,
  signal: AbortSignal,
  killSignal: number | string | undefined,
): ReturnType<typeof Bun.spawn> =>
  Bun.spawn(resolveAutomationCommand(scriptPath), {
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
  const timeoutMs = toSafeTimeoutMs(options.timeoutMs, config.automationScriptTimeoutMs);
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
