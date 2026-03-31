import { API_ENDPOINTS } from "@bao/shared/constants/endpoints";
import { DEFAULT_LOG_LEVEL } from "@bao/shared/constants/runtime";
import { createPinoLogger } from "@bogeychan/elysia-logger";
import { config, isProductionRuntime } from "../config/env";

export const log = createPinoLogger({
  level: config.logLevel || DEFAULT_LOG_LEVEL,
  transport: !isProductionRuntime()
    ? {
        target: "pino-pretty",
        options: { colorize: true },
      }
    : undefined,
});

export const logger = log.into({
  autoLogging: {
    ignore(ctx) {
      return new URL(ctx.request.url).pathname === API_ENDPOINTS.health;
    },
  },
});
