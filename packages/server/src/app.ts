import {
  API_ENDPOINT_PREFIX,
  API_ENDPOINTS,
  APP_BRAND,
  HTTP_STATUS_OK,
  OPENAPI_VERSION,
  settle,
  toApiScopedPath,
} from "@bao/shared";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import Type, { StandardSchemaV1 } from "baobox";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { config } from "./config/env";
import { RATE_LIMIT_GLOBAL_DURATION_MS, RATE_LIMIT_GLOBAL_MAX_REQUESTS } from "./config/rate-limit";
import { HEALTHCHECK_PROBE_SQL, sqlite } from "./db/client";
import { authGuard } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";
import { logger } from "./middleware/logger";
import {
  aiRoutes,
  authRoutes,
  automationRoutes,
  automationScreenshotRoutes,
  coverLetterRoutes,
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
} from "./routes/route-modules";
import { automationWebSocket } from "./ws/automation.ws";
import { chatWebSocket } from "./ws/chat.ws";
import { interviewWebSocket } from "./ws/interview.ws";

const getRequestOrigin = (request: Request): string | null =>
  request.headers.get("origin") ?? request.headers.get("Origin");

const applyAllowedOriginHeader = (
  headers: Record<string, string | number>,
  request: Request,
): void => {
  const requestOrigin = getRequestOrigin(request);
  if (!(requestOrigin && config.corsOrigins.includes(requestOrigin))) {
    return;
  }

  headers["access-control-allow-origin"] = requestOrigin;
  const varyHeader = typeof headers.vary === "string" ? headers.vary : "";
  if (varyHeader !== "Origin" && varyHeader !== "*") {
    headers.vary = varyHeader ? `${varyHeader}, Origin` : "Origin";
  }
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
  { name: "Gamification", description: "XP, achievements, challenges, and streak endpoints." },
  { name: "Skill Mapping", description: "Transferable skill analysis and CRUD endpoints." },
  { name: "Search", description: "Global search and autocomplete endpoints." },
  { name: "Stats", description: "Dashboard and trend reporting endpoints." },
  { name: "Automation", description: "Automation execution, scheduling, history, and artifacts." },
] as const;

export const app = new Elysia({ prefix: API_ENDPOINT_PREFIX, nativeStaticResponse: true })
  .onRequest(({ request, set }) => {
    applyAllowedOriginHeader(set.headers, request);
  })
  .use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
    }),
  )
  .use(
    swagger({
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
  .model({
    HealthResponse: StandardSchemaV1(
      Type.Object(
        {
          status: Type.String(),
          timestamp: Type.String(),
          database: Type.String(),
          uptime: Type.Number(),
        },
        { required: ["status", "timestamp", "database", "uptime"] },
      ),
    ),
    ErrorResponse: StandardSchemaV1(
      Type.Object(
        {
          error: Type.String(),
          code: Type.Optional(Type.String()),
          fields: Type.Optional(Type.Array(Type.String())),
        },
        { required: ["error"] },
      ),
    ),
  })
  .use(rateLimit({ duration: RATE_LIMIT_GLOBAL_DURATION_MS, max: RATE_LIMIT_GLOBAL_MAX_REQUESTS }))
  .use(logger)
  .use(errorHandler)
  .get(
    toApiScopedPath(API_ENDPOINTS.health),
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
    {
      response: {
        [HTTP_STATUS_OK]: "HealthResponse",
      },
      detail: {
        tags: ["Health"],
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
  .use(automationScreenshotRoutes)
  .use(automationWebSocket)
  .use(chatWebSocket)
  .use(interviewWebSocket);

export type App = typeof app;
