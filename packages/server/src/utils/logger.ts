import { log } from "../middleware/logger";

type LogDetail = object | string | number | boolean | null;

/**
 * Minimal logger contract used by runtime modules to avoid direct console usage.
 */
export type ServerLogger = {
  debug: (message: string, detail?: LogDetail) => void;
  info: (message: string, detail?: LogDetail) => void;
  warn: (message: string, detail?: LogDetail) => void;
  error: (message: string, detail?: LogDetail) => void;
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
    debug: (message: string, detail?: LogDetail) => {
      scopedLogger.debug(detail !== undefined ? { details: detail } : {}, message);
    },
    info: (message: string, detail?: LogDetail) => {
      scopedLogger.info(detail !== undefined ? { details: detail } : {}, message);
    },
    warn: (message: string, detail?: LogDetail) => {
      scopedLogger.warn(detail !== undefined ? { details: detail } : {}, message);
    },
    error: (message: string, detail?: LogDetail) => {
      scopedLogger.error(detail !== undefined ? { details: detail } : {}, message);
    },
  };
};

/**
 * Default server logger for shared startup and infra messages.
 */
export const serverLogger = createServerLogger("server");
