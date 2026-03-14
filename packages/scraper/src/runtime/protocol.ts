import type {
  ErrorEnvelope,
  JsonObject,
  RpaRunErrorCode,
  RpaRunEvent,
  RpaRunResult,
} from "@bao/shared";
import { RPA_PROTOCOL_VERSION } from "@bao/shared";

type ProtocolOutputStream = "stdout" | "stderr";

const writeProtocolLine = (stream: ProtocolOutputStream, event: RpaRunEvent): void => {
  const target = stream === "stdout" ? process.stdout : process.stderr;
  target.write(`${JSON.stringify(event)}\n`);
};

/**
 * Writes a single NDJSON protocol line to the requested stream.
 *
 * @param stream Output stream used for the event.
 * @param event Fully constructed protocol event.
 */
export const emitProtocolLine = (stream: ProtocolOutputStream, event: RpaRunEvent): void => {
  writeProtocolLine(stream, event);
};

/**
 * Contract-first protocol emitter for Bun-based job-apply automation scripts.
 */
export class ProtocolEmitter {
  private readonly runId: string;
  private sequence = 0;

  /**
   * Creates a protocol emitter for a single run identifier.
   *
   * @param runId Stable run identifier supplied by the server.
   */
  constructor(runId: string) {
    this.runId = runId;
  }

  private nextMetadata() {
    const metadata = {
      protocolVersion: RPA_PROTOCOL_VERSION,
      runId: this.runId,
      sequence: this.sequence,
      timestamp: new Date().toISOString(),
    } as const;
    this.sequence += 1;
    return metadata;
  }

  /**
   * Emits a progress event to stderr.
   *
   * @param event Progress payload without shared metadata.
   */
  emitProgress(
    event: Pick<
      Extract<RpaRunEvent, { eventType: "progress" }>,
      "action" | "status" | "message" | "step" | "totalSteps"
    >,
  ): void {
    emitProtocolLine("stderr", {
      ...this.nextMetadata(),
      eventType: "progress",
      ...event,
    });
  }

  /**
   * Emits a terminal result event to stdout.
   *
   * @param result Final automation result payload.
   */
  emitResult(result: RpaRunResult): void {
    emitProtocolLine("stdout", {
      ...this.nextMetadata(),
      eventType: "result",
      result,
    });
  }

  /**
   * Emits a terminal error event to stdout.
   *
   * @param code Runtime-neutral error classification.
   * @param message Human-readable error detail.
   * @param details Optional JSON details payload.
   */
  emitError(code: RpaRunErrorCode, message: string, details?: JsonObject): void {
    const error: ErrorEnvelope = {
      code,
      message,
      ...(details ? { details } : {}),
    };

    emitProtocolLine("stdout", {
      ...this.nextMetadata(),
      eventType: "error",
      error: {
        ...error,
        source: "@bao/scraper",
      },
    });
  }
}
