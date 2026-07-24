import { API_ENDPOINTS } from "@bao/shared/constants/endpoints";
import { DEFAULT_LOG_LEVEL } from "@bao/shared/constants/runtime";
import { Elysia } from "elysia";
import pino from "pino";
import { config, shouldUsePrettyLogTransport } from "../config/env";
import { HTTP_STATUS_OK } from "@bao/shared/constants/http";

/**
 * Canonical pino root logger for server runtime (SSOT for structured logs).
 */
export const log = pino({
  level: config.logLevel || DEFAULT_LOG_LEVEL,
  transport: shouldUsePrettyLogTransport()
    ? {
        target: "pino-pretty",
        options: { colorize: true },
      }
    : undefined,
});

/**
 * Request-access logging plugin for Elysia 2.
 * Logs request method, path, and status. Trace ID is handled by the main app.
 */
export const logger = new Elysia({ name: "request-logger" }).afterHandle(({ request, set }) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === API_ENDPOINTS.health) {
    return;
  }

  log.info(
    {
      method: request.method,
      path: pathname,
      status: set.status ?? HTTP_STATUS_OK,
    },
    "request",
  );
});
