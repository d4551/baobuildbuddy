import { APP_BRAND } from "@bao/shared/constants/branding";
import {
  API_ENDPOINT_PREFIX,
  API_ENDPOINTS,
  OPENAPI_VERSION,
  toApiScopedPath,
} from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_OK } from "@bao/shared/constants/http";
import { TRACE_ID_HEADER, TRACE_ID_BYTE_LENGTH } from "@bao/shared/constants/runtime";
import { settle } from "@bao/shared/utils/promise";
import { openapi } from "@elysiajs/openapi";
import { Elysia, setupTypebox, t } from "elysia";
import { websocket } from "elysia/websocket";
import { isProductionRuntime } from "./config/env";
import { RATE_LIMIT_GLOBAL_DURATION_MS, RATE_LIMIT_GLOBAL_MAX_REQUESTS } from "./config/rate-limit";
import { HEALTHCHECK_PROBE_SQL, sqlite } from "./db/client";
import { authGuard } from "./middleware/auth";
import { corsPlugin } from "./middleware/cors";
import { errorHandler } from "./middleware/error-handler";
import { logger } from "./middleware/logger";
import { aiRoutes } from "./routes/ai.routes";
import { authRoutes } from "./routes/auth.routes";
import { automationRoutes } from "./routes/automation.routes";
import { automationScreenshotRoutes } from "./routes/automation-screenshots.routes";
import { coverLetterRoutes } from "./routes/cover-letter.routes";
import { gamificationRoutes } from "./routes/gamification.routes";
import { interviewRoutes } from "./routes/interview.routes";
import { jobsRoutes } from "./routes/jobs.routes";
import { portfolioRoutes } from "./routes/portfolio.routes";
import { resumeRoutes } from "./routes/resume.routes";
import { scraperRoutes } from "./routes/scraper.routes";
import { searchRoutes } from "./routes/search.routes";
import { settingsRoutes } from "./routes/settings.routes";
import { skillMappingRoutes } from "./routes/skill-mapping.routes";
import { speechRoutes } from "./routes/speech.routes";
import { statsRoutes } from "./routes/stats.routes";
import { studioRoutes } from "./routes/studio.routes";
import { userRoutes } from "./routes/user.routes";
import { rateLimit } from "./utils/rate-limit";
import { automationWebSocket } from "./ws/automation.ws";
import { chatWebSocket } from "./ws/chat.ws";
import { interviewWebSocket } from "./ws/interview.ws";

setupTypebox();

const createTraceId = (): string => {
  const bytes = new Uint8Array(TRACE_ID_BYTE_LENGTH);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
};

const OPENAPI_TAGS = [
  { name: "Health", description: "Service health and readiness endpoints." },
  { name: "Auth", description: "Authentication bootstrap and API key lifecycle endpoints." },
  { name: "User", description: "User profile read and update endpoints." },
  { name: "Settings", description: "Application configuration and secret-management endpoints." },
  { name: "Jobs", description: "Job discovery, saved jobs, applications, and recommendations." },
  { name: "Resumes", description: "Resume authoring, generation, and export endpoints." },
  { name: "Cover Letters", description: "Cover letter CRUD, generation, and export endpoints." },
  { name: "Portfolio", description: "Portfolio profile and project management endpoints." },
  { name: "Interview", description: "Interview prep, sessions, and analytics endpoints." },
  { name: "Studios", description: "Studio directory CRUD and analytics endpoints." },
  { name: "Scraper", description: "Manual scraper trigger endpoints." },
  { name: "AI", description: "AI chat, analysis, matching, and provider introspection endpoints." },
  { name: "Speech", description: "Speech-to-text transcription via Whisper and other STT providers." },
  { name: "Gamification", description: "XP, achievements, challenges, and streak endpoints." },
  { name: "Skill Mapping", description: "Transferable skill analysis and CRUD endpoints." },
  { name: "Search", description: "Global search and autocomplete endpoints." },
  { name: "Stats", description: "Dashboard and trend reporting endpoints." },
  { name: "Automation", description: "Automation execution, scheduling, history, and artifacts." },
] as const;

export const app = new Elysia({ prefix: API_ENDPOINT_PREFIX })
  .use(websocket())
  .use(corsPlugin)
  .model({
    HealthResponse: t.Object(
      {
        status: t.String(),
        timestamp: t.String(),
        database: t.String(),
        uptime: t.Number(),
      },
      { required: ["status", "timestamp", "database", "uptime"] },
    ),
    ErrorResponse: t.Object(
      {
        error: t.String(),
        code: t.Optional(t.String()),
        fields: t.Optional(t.Array(t.String())),
      },
      { required: ["error"] },
    ),
  })
  .use(
    rateLimit({
      duration: RATE_LIMIT_GLOBAL_DURATION_MS,
      max: RATE_LIMIT_GLOBAL_MAX_REQUESTS,
    }),
  )
  .use(logger)
  .request(({ set }) => {
    set.headers[TRACE_ID_HEADER] = createTraceId();
  })
  .use(errorHandler)
  .afterHandle(({ set }) => {
    set.headers["x-content-type-options"] = "nosniff";
    set.headers["x-frame-options"] = "DENY";
    set.headers["referrer-policy"] = "strict-origin-when-cross-origin";
    if (!set.headers[TRACE_ID_HEADER]) {
      set.headers[TRACE_ID_HEADER] = createTraceId();
    }
    set.headers["permissions-policy"] =
      "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()";

    set.headers["content-security-policy"] = "default-src 'none'; frame-ancestors 'none'";

    if (isProductionRuntime()) {
      set.headers["strict-transport-security"] = "max-age=63072000; includeSubDomains; preload";
    }
  })
  .get(
    toApiScopedPath(API_ENDPOINTS.health),
    {
      response: {
        [HTTP_STATUS_OK]: "HealthResponse",
      },
      detail: {
        tags: ["Health"],
      },
    },
    async () => {
      const healthResult = await settle(
        Promise.resolve().then(() => {
          sqlite.exec(HEALTHCHECK_PROBE_SQL);
          return true;
        }),
      );
      const dbOk = healthResult.status === "fulfilled";
      return {
        status: dbOk ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        database: dbOk ? "ok" : "error",
        uptime: process.uptime(),
      };
    },
  )
  .use(authRoutes)
  .use(authGuard)
  .use(
    openapi({
      path: toApiScopedPath(API_ENDPOINTS.apiDocsUi),
      specPath: toApiScopedPath(API_ENDPOINTS.apiDocsJson),
      documentation: {
        info: {
          title: APP_BRAND.apiName,
          version: OPENAPI_VERSION,
          description: "AI-powered career assistant for the video game industry",
        },
        tags: [...OPENAPI_TAGS],
      },
    }),
  )
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
  .use(speechRoutes)
  .use(gamificationRoutes)
  .use(skillMappingRoutes)
  .use(searchRoutes)
  .use(statsRoutes)
  .use(automationRoutes)
  .use(automationScreenshotRoutes)
  .use(automationWebSocket)
  .use(chatWebSocket)
  .use(interviewWebSocket);

export type App = typeof app;
