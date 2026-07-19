import pino from "pino";
/**
 * Canonical pino root logger for server runtime (SSOT for structured logs).
 */
export declare const log: pino.Logger<never, boolean>;
/**
 * Request-access logging plugin for Elysia 2.
 * Logs request method, path, and status. Trace ID is handled by the main app.
 */
export declare const logger: import("elysia/types").LocalHookReturn<"", "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, {}>;
