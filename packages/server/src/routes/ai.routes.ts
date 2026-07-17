import { Elysia, type status } from "elysia";
import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_OK } from "@bao/shared/constants/http";
import { MS_PER_MINUTE } from "@bao/shared/constants/time";
import { db } from "../db/client";
import { chatHistory } from "../db/schema/chat-history";
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
  analyzeResumeRouteBodySchema,
  automationActionRouteBodySchema,
  automationActionResponses,
  type ChatRouteBody,
  chatRouteBodySchema,
  chatRouteResponses,
  type GenerateCoverLetterRouteBody,
  generateCoverLetterRouteBodySchema,
  generateCoverLetterResponses,
  aiModelsResponses,
  aiUsageResponses,
  type MatchJobsRouteBody,
  matchJobsRouteBodySchema,
  matchJobsResponses,
  usageTailLimit,
} from "./ai-route-contracts";
import { buildProviderModelsResponse } from "./ai-route-support";

type RouteStatus = typeof status;

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
      response: chatRouteResponses,
    },
    async ({ body, status }: { body: ChatRouteBody; status: RouteStatus }) => {
      const result = await handleChatRoute(body);
      return status(result.status, result.body);
    },
  )
  .post(
    "/analyze-resume",
    {
      detail: { tags: ["AI"] },
      body: analyzeResumeRouteBodySchema,
      response: analyzeResumeResponses,
    },
    async ({ body, status }: { body: AnalyzeResumeRouteBody; status: RouteStatus }) => {
      const result = await handleAnalyzeResumeRoute(body);
      return status(result.status, result.body);
    },
  )
  .post(
    "/generate-cover-letter",
    {
      detail: { tags: ["AI"] },
      body: generateCoverLetterRouteBodySchema,
      response: generateCoverLetterResponses,
    },
    async ({ body, status }: { body: GenerateCoverLetterRouteBody; status: RouteStatus }) => {
      const result = await handleGenerateCoverLetterRoute(body);
      return status(result.status, result.body);
    },
  )
  .post(
    "/match-jobs",
    {
      detail: { tags: ["AI"] },
      body: matchJobsRouteBodySchema,
      response: matchJobsResponses,
    },
    async ({ body, status }: { body: MatchJobsRouteBody; status: RouteStatus }) => {
      const result = await handleMatchJobsRoute(body);
      return status(result.status, result.body);
    },
  )
  .get(
    "/models",
    {
      detail: { tags: ["AI"] },
      response: aiModelsResponses,
    },
    async ({ status }: { status: RouteStatus }) =>
      status(HTTP_STATUS_OK, await buildProviderModelsResponse()),
  )
  .get(
    "/usage",
    {
      detail: { tags: ["AI"] },
      response: aiUsageResponses,
    },
    async ({ status }: { status: RouteStatus }) => {
      const chatMessages = await db.select().from(chatHistory);

      return status(HTTP_STATUS_OK, {
        totalMessages: chatMessages.length,
        userMessages: chatMessages.filter((message) => message.role === "user").length,
        assistantMessages: chatMessages.filter((message) => message.role === "assistant").length,
        sessions: [...new Set(chatMessages.map((message) => message.sessionId))].length,
        recentActivity: chatMessages.slice(-usageTailLimit).map((message) => ({
          timestamp: message.timestamp,
          role: message.role,
          sessionId: message.sessionId,
        })),
      });
    },
  )
  .post(
    "/automation-action",
    {
      detail: { tags: ["AI"] },
      body: automationActionRouteBodySchema,
      response: automationActionResponses,
    },
    async ({ body, status }: { body: AutomationActionRouteBody; status: RouteStatus }) => {
      const result = await handleAutomationActionRoute(body);
      return status(result.status, result.body);
    },
  );
