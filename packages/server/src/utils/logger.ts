import { log } from "../middleware/logger";

type ServerLogLevel = "debug" | "info" | "warn" | "error";

/**
 * Minimal logger contract used by runtime modules to avoid direct console usage.
 */
export type ServerLogger = {
  debug: (...values: readonly unknown[]) => void;
  info: (...values: readonly unknown[]) => void;
  warn: (...values: readonly unknown[]) => void;
  error: (...values: readonly unknown[]) => void;
};

/**
 * Creates a scoped logger instance with component metadata attached to each entry.
 *
 * @param component - Source component name for traceability in structured logs.
 * @returns A logger with shared lifecycle as Bun-native pino integration.
 */
export const createServerLogger = (component: string): ServerLogger => {
  const scopedLogger = log.child({ component });

  const emit = (level: ServerLogLevel, values: readonly unknown[]): void => {
    if (values.length === 0) {
      return;
    }

    const [primary, ...rest] = values;

    if (typeof primary === "string") {
      if (rest.length === 0) {
        scopedLogger[level](primary);
        return;
      }

      scopedLogger[level](rest.length === 1 ? { details: rest[0] } : { details: rest }, primary);
      return;
    }

    if (values.length === 1) {
      scopedLogger[level](primary);
      return;
    }

    scopedLogger[level]({ details: values });
  };

  return {
    debug: (...values: unknown[]) => {
      emit("debug", values);
    },
    info: (...values: unknown[]) => {
      emit("info", values);
    },
    warn: (...values: unknown[]) => {
      emit("warn", values);
    },
    error: (...values: unknown[]) => {
      emit("error", values);
    },
  };
};

/**
 * Default server logger for shared startup and infra messages.
 */
export const serverLogger = createServerLogger("server");
