import { Elysia } from "elysia";
import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { MS_PER_MINUTE } from "@bao/shared/constants/time";
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
  analyzeResumeResponses,
  type AutomationActionRouteBody,
  automationActionResponses,
  analyzeResumeRouteBodySchema,
  automationActionRouteBodySchema,
  aiModelsResponses,
  aiUsageResponses,
  type ChatRouteBody,
  chatRouteResponses,
  chatRouteBodySchema,
  type GenerateCoverLetterRouteBody,
  generateCoverLetterResponses,
  generateCoverLetterRouteBodySchema,
  type MatchJobsRouteBody,
  matchJobsResponses,
  matchJobsRouteBodySchema,
  usageTailLimit,
} from "./ai-route-contracts";
import { buildProviderModelsResponse } from "./ai-route-support";

export const aiRoutes = new Elysia({ prefix: toApiScopedPath(API_ENDPOINTS.aiBase) })
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
      detail: { tags: ["AI"] },
      body: chatRouteBodySchema,
      },
    async ({ body, set }: { body: ChatRouteBody; set: RouteSetState }) =>
      handleChatRoute(body, set),
  )
  .post(
    "/analyze-resume",
    {
      detail: { tags: ["AI"] },
      body: analyzeResumeRouteBodySchema,
      },
    async ({ body, set }: { body: AnalyzeResumeRouteBody; set: RouteSetState }) =>
      handleAnalyzeResumeRoute(body, set),
  )
  .post(
    "/generate-cover-letter",
    {
      detail: { tags: ["AI"] },
      body: generateCoverLetterRouteBodySchema,
      },
    async ({ body, set }: { body: GenerateCoverLetterRouteBody; set: RouteSetState }) =>
      handleGenerateCoverLetterRoute(body, set),
  )
  .post(
    "/match-jobs",
    {
      detail: { tags: ["AI"] },
      body: matchJobsRouteBodySchema,
      },
    async ({ body, set }: { body: MatchJobsRouteBody; set: RouteSetState }) =>
      handleMatchJobsRoute(body, set),
  )
  .get(
    "/models",
    {
      detail: { tags: ["AI"] },
      },
    async () => buildProviderModelsResponse(),
  )
  .get(
    "/usage",
    {
      detail: { tags: ["AI"] },
      },
    async () => {
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
    },
  )
  .post(
    "/automation-action",
    {
      detail: { tags: ["AI"] },
      body: automationActionRouteBodySchema,
      },
    async ({ body, set }: { body: AutomationActionRouteBody; set: RouteSetState }) =>
      handleAutomationActionRoute(body, set),
  );
