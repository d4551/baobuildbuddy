import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { MS_PER_MINUTE } from "@bao/shared/constants/time";
import { StandardSchemaV1 } from "baobox";
import { Elysia } from "elysia";
import { db } from "../db/client";
import { chatHistory } from "../db/schema/chat-history";
import type { RouteSetState } from "../types/route-state";
import { rateLimit } from "../utils/rate-limit";
import { resolveRateLimitClientKey } from "../utils/request";
import {
  handleAnalyzeResumeRoute,
  handleChatRoute,
  handleGenerateCoverLetterRoute,
  handleMatchJobsRoute,
} from "./ai-route-actions";
import { handleAutomationActionRoute } from "./ai-route-automation";
import {
  type AnalyzeResumeRouteBody,
  type AutomationActionRouteBody,
  analyzeResumeRouteBodySchema,
  automationActionRouteBodySchema,
  type ChatRouteBody,
  chatRouteBodySchema,
  type GenerateCoverLetterRouteBody,
  generateCoverLetterRouteBodySchema,
  type MatchJobsRouteBody,
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
  .post(
    "/chat",
    {
      body: StandardSchemaV1(chatRouteBodySchema),
    }, async ({ body, set }: { body: ChatRouteBody; set: RouteSetState }) =>
      handleChatRoute(body, set),
  )
  .post(
    "/analyze-resume",
    {
      body: StandardSchemaV1(analyzeResumeRouteBodySchema),
    }, async ({ body, set }: { body: AnalyzeResumeRouteBody; set: RouteSetState }) =>
      handleAnalyzeResumeRoute(body, set),
  )
  .post(
    "/generate-cover-letter",
    {
      body: StandardSchemaV1(generateCoverLetterRouteBodySchema),
    }, async ({ body, set }: { body: GenerateCoverLetterRouteBody; set: RouteSetState }) =>
      handleGenerateCoverLetterRoute(body, set),
  )
  .post(
    "/match-jobs",
    {
      body: StandardSchemaV1(matchJobsRouteBodySchema),
    }, async ({ body, set }: { body: MatchJobsRouteBody; set: RouteSetState }) =>
      handleMatchJobsRoute(body, set),
  )
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
  .post(
    "/automation-action",
    {
      body: StandardSchemaV1(automationActionRouteBodySchema),
    }, async ({ body, set }: { body: AutomationActionRouteBody; set: RouteSetState }) =>
      handleAutomationActionRoute(body, set),
  );
