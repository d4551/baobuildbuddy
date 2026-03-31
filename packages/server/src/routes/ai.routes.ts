import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { MS_PER_MINUTE } from "@bao/shared/constants/time";
import { StandardSchemaV1 } from "baobox";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { db } from "../db/client";
import { chatHistory } from "../db/schema/chat-history";
import { resolveRateLimitClientKey } from "../utils/request";
import {
  handleAnalyzeResumeRoute,
  handleChatRoute,
  handleGenerateCoverLetterRoute,
  handleMatchJobsRoute,
} from "./ai-route-actions";
import { handleAutomationActionRoute } from "./ai-route-automation";
import {
  analyzeResumeRouteBodySchema,
  automationActionRouteBodySchema,
  chatRouteBodySchema,
  generateCoverLetterRouteBodySchema,
  matchJobsRouteBodySchema,
  usageTailLimit,
} from "./ai-route-contracts";
import { buildProviderModelsResponse } from "./ai-route-support";

export const aiRoutes = new Elysia({ prefix: toApiScopedPath(API_ENDPOINTS.aiBase), tags: ["AI"] })
  .use(
    rateLimit({
      scoping: "scoped",
      duration: MS_PER_MINUTE,
      max: 25,
      generator: (request) => resolveRateLimitClientKey(request),
    }),
  )
  .post("/chat", async ({ body, set }) => handleChatRoute(body, set), {
    body: StandardSchemaV1(chatRouteBodySchema),
  })
  .post("/analyze-resume", async ({ body, set }) => handleAnalyzeResumeRoute(body, set), {
    body: StandardSchemaV1(analyzeResumeRouteBodySchema),
  })
  .post(
    "/generate-cover-letter",
    async ({ body, set }) => handleGenerateCoverLetterRoute(body, set),
    {
      body: StandardSchemaV1(generateCoverLetterRouteBodySchema),
    },
  )
  .post("/match-jobs", async ({ body, set }) => handleMatchJobsRoute(body, set), {
    body: StandardSchemaV1(matchJobsRouteBodySchema),
  })
  .get("/models", async () => buildProviderModelsResponse())
  .get("/usage", async () => {
    const chatMessages = await db.select().from(chatHistory);

    return {
      totalMessages: chatMessages.length,
      userMessages: chatMessages.filter((message) => message.role === "user").length,
      assistantMessages: chatMessages.filter((message) => message.role === "assistant").length,
      sessions: [...new Set(chatMessages.map((message) => message.sessionId))].length,
      recentActivity: chatMessages.slice(-usageTailLimit).map((message) => ({
        timestamp: message.timestamp,
        role: message.role,
        sessionId: message.sessionId,
      })),
    };
  })
  .post("/automation-action", async ({ body, set }) => handleAutomationActionRoute(body, set), {
    body: StandardSchemaV1(automationActionRouteBodySchema),
  });
