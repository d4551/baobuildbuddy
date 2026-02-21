import { log } from "../middleware/logger";

/**
 * Structured logging levels supported by the server logger.
 */
export type ServerLogLevel = "debug" | "info" | "warn" | "error";

/**
 * Minimal logger contract used by runtime modules to avoid direct console usage.
 */
export type ServerLogger = {
  debug: (...values: unknown[]) => void;
  info: (...values: unknown[]) => void;
  warn: (...values: unknown[]) => void;
  error: (...values: unknown[]) => void;
};

/**
 * Creates a scoped logger instance with component metadata attached to each entry.
 *
 * @param component - Source component name for traceability in structured logs.
 * @returns A logger with shared lifecycle as Bun-native pino integration.
 */
export const createServerLogger = (component: string): ServerLogger => {
  const scopedLogger = log.child({ component });
  return {
    debug: (...values: unknown[]) => {
      scopedLogger.debug(...values);
    },
    info: (...values: unknown[]) => {
      scopedLogger.info(...values);
    },
    warn: (...values: unknown[]) => {
      scopedLogger.warn(...values);
    },
    error: (...values: unknown[]) => {
      scopedLogger.error(...values);
    },
  };
};

/**
 * Default server logger for shared startup and infra messages.
 */
export const serverLogger = createServerLogger("server");
