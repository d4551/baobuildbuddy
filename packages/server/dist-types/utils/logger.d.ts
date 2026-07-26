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
export declare const createServerLogger: (component: string) => ServerLogger;
export {};
