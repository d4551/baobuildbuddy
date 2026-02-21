import { API_ENDPOINTS } from "@bao/shared";
import { createPinoLogger } from "@bogeychan/elysia-logger";

export const log = createPinoLogger({
  level: Bun.env.LOG_LEVEL || "info",
  transport:
    Bun.env.NODE_ENV !== "production"
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
