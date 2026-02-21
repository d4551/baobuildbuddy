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
export declare const createServerLogger: (component: string) => ServerLogger;
/**
 * Default server logger for shared startup and infra messages.
 */
export declare const serverLogger: ServerLogger;
