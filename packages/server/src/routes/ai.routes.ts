import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { MS_PER_MINUTE } from "@bao/shared/constants/time";
import { Elysia } from "elysia";
import { db } from "../db/client";
import { chatHistory } from "../db/schema/chat-history";
import {
  toSerializableProviderDiagnostics,
  toSerializableProviderRows,
} from "../services/ai/control-plane";
import { openapiDetail } from "../utils/openapi-detail";
import { resolveKnownProvider } from "./settings-route-schema-ai-brand";
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
  aiModelsResponses,
  aiUsageResponses,
  analyzeResumeResponses,
  analyzeResumeRouteBodySchema,
  automationActionResponses,
  automationActionRouteBodySchema,
  chatRouteBodySchema,
  chatRouteResponses,
  aiGenerateCoverLetterResponses,
  generateCoverLetterRouteBodySchema,
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
      detail: openapiDetail("AI", "Send a chat completion request to the configured AI provider."),
      body: chatRouteBodySchema,
      response: chatRouteResponses,
    },
    async ({ body, status }) => {
      const result = await handleChatRoute(body);
      if (result.status === HTTP_STATUS_INTERNAL_SERVER_ERROR) {
        return status(HTTP_STATUS_INTERNAL_SERVER_ERROR, result.body);
      }
      return status(HTTP_STATUS_OK, result.body);
    },
  )
  .post(
    "/analyze-resume",
    {
      detail: openapiDetail("AI", "Analyze a resume against a target role with AI feedback."),
      body: analyzeResumeRouteBodySchema,
      response: analyzeResumeResponses,
    },
    async ({ body, status }) => {
      const result = await handleAnalyzeResumeRoute(body);
      // Branch per status so each arm narrows to its declared response schema.
      if (result.status === HTTP_STATUS_NOT_FOUND) {
        return status(HTTP_STATUS_NOT_FOUND, result.body);
      }
      if (result.status === HTTP_STATUS_INTERNAL_SERVER_ERROR) {
        return status(HTTP_STATUS_INTERNAL_SERVER_ERROR, result.body);
      }
      return status(HTTP_STATUS_OK, result.body);
    },
  )
  .post(
    "/generate-cover-letter",
    {
      detail: openapiDetail("AI", "Generate cover letter draft text with the AI provider."),
      body: generateCoverLetterRouteBodySchema,
      response: aiGenerateCoverLetterResponses,
    },
    async ({ body, status }) => {
      const result = await handleGenerateCoverLetterRoute(body);
      if (result.status === HTTP_STATUS_NOT_FOUND) {
        return status(HTTP_STATUS_NOT_FOUND, result.body);
      }
      if (result.status === HTTP_STATUS_INTERNAL_SERVER_ERROR) {
        return status(HTTP_STATUS_INTERNAL_SERVER_ERROR, result.body);
      }
      return status(HTTP_STATUS_OK, result.body);
    },
  )
  .post(
    "/match-jobs",
    {
      detail: openapiDetail("AI", "Match the user profile against open jobs with AI ranking."),
      body: matchJobsRouteBodySchema,
      response: matchJobsResponses,
    },
    async ({ body, status }) => {
      const result = await handleMatchJobsRoute(body);
      if (result.status === HTTP_STATUS_INTERNAL_SERVER_ERROR) {
        return status(HTTP_STATUS_INTERNAL_SERVER_ERROR, result.body);
      }
      return status(HTTP_STATUS_OK, result.body);
    },
  )
  .get(
    "/models",
    {
      detail: openapiDetail("AI", "List AI models available from configured providers."),
      response: aiModelsResponses,
    },
    async ({ status }) => {
      const models = await buildProviderModelsResponse();
      // The unconfigured arm carries no provider at all; the control-plane arm
      // can still hold a null one, which this contract narrows to a known id.
      return status(
        HTTP_STATUS_OK,
        "preferredProvider" in models
          ? {
              ...models,
              preferredProvider: resolveKnownProvider(models.preferredProvider),
              providerDiagnostics: toSerializableProviderDiagnostics(models.providerDiagnostics),
              providers: toSerializableProviderRows(models.providers),
            }
          : models,
      );
    },
  )
  .get(
    "/usage",
    {
      detail: openapiDetail("AI", "Retrieve AI token and request usage counters."),
      response: aiUsageResponses,
    },
    async ({ status }) => {
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
      detail: openapiDetail("AI", "Propose or execute an AI-assisted automation operator action."),
      body: automationActionRouteBodySchema,
      response: automationActionResponses,
    },
    async ({ body, status }) => {
      const result = await handleAutomationActionRoute(body);
      // Only the success arm carries the action payload; every other status
      // returns the simple error envelope declared in the response map.
      if (result.status === HTTP_STATUS_OK) {
        return status(HTTP_STATUS_OK, result.body);
      }
      return status(result.status, result.body);
    },
  );
