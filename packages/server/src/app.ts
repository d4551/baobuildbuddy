import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { APP_BRAND } from "@bao/shared";
import { Elysia, t } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { config } from "./config/env";
import { sqlite } from "./db/client";
import { authGuard } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";
import { logger } from "./middleware/logger";
import {
  aiRoutes,
  authRoutes,
  coverLetterRoutes,
  automationRoutes,
  gamificationRoutes,
  interviewRoutes,
  jobsRoutes,
  portfolioRoutes,
  resumeRoutes,
  scraperRoutes,
  searchRoutes,
  settingsRoutes,
  skillMappingRoutes,
  statsRoutes,
  studioRoutes,
  userRoutes,
} from "./routes";
import { chatWebSocket } from "./ws/chat.ws";
import { interviewWebSocket } from "./ws/interview.ws";

const API_PREFIX = "/api" as const;
const OPENAPI_VERSION = "0.1.0" as const;
const HTTP_STATUS_OK = 200;
const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_NOT_FOUND = 404;
const GLOBAL_RATE_LIMIT_DURATION_MS = 60_000;
const GLOBAL_RATE_LIMIT_MAX_REQUESTS = 100;
const HEALTHCHECK_PROBE_SQL = "SELECT 1";

export const app = new Elysia({ prefix: API_PREFIX })
  .use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
    }),
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: APP_BRAND.apiName,
          version: OPENAPI_VERSION,
          description: "AI-powered career assistant for the video game industry",
        },
      },
    }),
  )
  .model({
    HealthResponse: t.Object({
      status: t.String(),
      timestamp: t.String(),
      database: t.String(),
      uptime: t.Number(),
    }),
    ErrorResponse: t.Object({
      error: t.String(),
      code: t.Optional(t.String()),
      fields: t.Optional(t.Array(t.Any())),
    }),
  })
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      let fields: unknown[] | undefined;
      if (typeof error === "object" && error && "all" in error) {
        const details = (error as { all?: unknown }).all;
        if (Array.isArray(details)) {
          fields = details;
        } else if (typeof details === "function") {
          fields = details();
        }
      }

      set.status = HTTP_STATUS_BAD_REQUEST;
      return {
        error: "Validation failed",
        code,
        fields,
      };
    }

    if (code === "NOT_FOUND") {
      set.status = HTTP_STATUS_NOT_FOUND;
      return { error: "Not found", code };
    }
  })
  .use(rateLimit({ duration: GLOBAL_RATE_LIMIT_DURATION_MS, max: GLOBAL_RATE_LIMIT_MAX_REQUESTS }))
  .use(logger)
  .use(errorHandler)
  .get(
    "/health",
    () => {
      const dbOk = (() => {
        try {
          sqlite.exec(HEALTHCHECK_PROBE_SQL);
          return true;
        } catch {
          return false;
        }
      })();
      return {
        status: dbOk ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        database: dbOk ? "ok" : "error",
        uptime: process.uptime(),
      };
    },
    {
      response: {
        [HTTP_STATUS_OK]: "HealthResponse",
      },
    },
  )
  .use(authRoutes)
  .use(authGuard)
  .use(userRoutes)
  .use(settingsRoutes)
  .use(jobsRoutes)
  .use(resumeRoutes)
  .use(coverLetterRoutes)
  .use(portfolioRoutes)
  .use(interviewRoutes)
  .use(studioRoutes)
  .use(scraperRoutes)
  .use(aiRoutes)
  .use(gamificationRoutes)
  .use(skillMappingRoutes)
  .use(searchRoutes)
  .use(statsRoutes)
  .use(automationRoutes)
  .use(chatWebSocket)
  .use(interviewWebSocket);

export type App = typeof app;
