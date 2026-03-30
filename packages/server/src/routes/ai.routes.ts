import type { AIChatContextDomain, AIResponse } from "@bao/shared";
import {
  AI_DEFAULT_TEMPERATURE,
  AI_DEFAULT_TEMPERATURE_CREATIVE,
  API_ERROR_ANALYZE_RESUME,
  API_ERROR_GENERATE_AI_RESPONSE,
  API_ERROR_GENERATE_COVER_LETTER,
  API_ERROR_MATCH_JOBS,
  API_ERROR_RESUME_NOT_FOUND,
  API_ERROR_UNSUPPORTED_AUTOMATION_ACTION,
  API_MESSAGE_COVER_LETTER_GENERATED,
  API_MESSAGE_RESUME_ANALYSIS_COMPLETE,
  generateId,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  MS_PER_MINUTE,
  resolveBrandSettings,
  SCHEMA_MAX_LENGTH_LONG,
  settle,
  toErrorMessage,
} from "@bao/shared";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { db } from "../db/client";
import { chatHistory } from "../db/schema/chat-history";
import { resumes } from "../db/schema/resumes";
import { contextManager } from "../services/ai/context-manager";
import { buildSystemPrompt } from "../services/ai/prompts";
import { applicationAutomationService } from "../services/automation/application-automation-service";
import { mapAutomationRouteError } from "../utils/automation-route-error";
import { createServerLogger } from "../utils/logger";
import { resolveRateLimitClientKey } from "../utils/request";
import {
  composeChatSystemPrompt,
  normalizeClientChatContext,
  type ChatContextPayload,
} from "./ai-route-chat-context";
import {
  analyzeResumeRouteBodySchema,
  automationActionRouteBodySchema,
  chatRouteBodySchema,
  generateCoverLetterRouteBodySchema,
  matchJobsRouteBodySchema,
  type AnalyzeResumeBody,
  type GenerateCoverLetterBody,
  type RouteSetState,
  usageTailLimit,
} from "./ai-route-contracts";
import {
  buildAnalyzeResumePrompt,
  buildCoverLetterPrompt,
  parseCoverLetterSections,
  parseResumeAnalysisResult,
  resolveAnalyzeResumeJobDescription,
  resolveCoverLetterJobDescription,
  serializeResume,
} from "./ai-route-content";
import { runJobMatchingFlow } from "./ai-route-job-matching";
import {
  buildProviderModelsResponse,
  getAIService,
  getAISettingsRow,
} from "./ai-route-support";

const aiRoutesLogger = createServerLogger("ai-routes");

type ChatHistoryInsert = typeof chatHistory.$inferInsert;

const createChatMessage = (
  role: "user" | "assistant",
  content: string,
  sessionId: string,
): ChatHistoryInsert => ({
  id: generateId(),
  role,
  content,
  timestamp: new Date().toISOString(),
  sessionId,
});

const persistChatMessage = async (
  message: ChatHistoryInsert,
): Promise<PromiseSettledResult<unknown>> => settle(db.insert(chatHistory).values(message));

const buildChatRouteResponse = (
  assistantMessage: ChatHistoryInsert,
  response: AIResponse,
  preferredDomain: AIChatContextDomain,
) => ({
  message: assistantMessage.content,
  sessionId: assistantMessage.sessionId,
  timestamp: assistantMessage.timestamp,
  provider: response.provider,
  model: response.model,
  followUps: contextManager.generateFollowUps(preferredDomain),
  contextDomain: preferredDomain,
});

const startJobApplyRun = (
  runId: string,
  payload: {
    jobUrl: string;
    resumeId: string;
    coverLetterId?: string;
    jobId?: string;
  },
) => {
  applicationAutomationService.runJobApply(runId, payload).then(undefined, (error: unknown) => {
    aiRoutesLogger.error("Failed to execute job application automation run:", error);
  });
};

const handleChatRoute = async (
  body: { message: string; sessionId?: string; context?: ChatContextPayload },
  set: RouteSetState,
) => {
  const sessionId = body.sessionId ?? generateId();
  const persistUserMessageResult = await persistChatMessage(
    createChatMessage("user", body.message, sessionId),
  );
  if (persistUserMessageResult.status === "rejected") {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return {
      error: toErrorMessage(persistUserMessageResult.reason, API_ERROR_GENERATE_AI_RESPONSE),
    };
  }

  const clientContext = normalizeClientChatContext(body.context);
  const preferredDomain = clientContext?.domain ?? contextManager.inferDomain(body.message);
  const settingsRow = await getAISettingsRow();
  const runtimeBrand = resolveBrandSettings(settingsRow?.brandSettings);
  const aiService = await getAIService(settingsRow);
  const contextualConversation = await contextManager.buildContext(
    sessionId,
    body.message,
    preferredDomain,
    runtimeBrand,
  );
  const systemPrompt = composeChatSystemPrompt(
    buildSystemPrompt(runtimeBrand),
    contextualConversation.systemPrompt,
    clientContext,
  );
  const generationResult = await settle(
    aiService.generate(body.message, {
      purpose: "chat",
      systemPrompt,
      messages: contextualConversation.messages,
      temperature: AI_DEFAULT_TEMPERATURE_CREATIVE,
      maxTokens: SCHEMA_MAX_LENGTH_LONG,
    }),
  );
  if (generationResult.status === "rejected") {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: toErrorMessage(generationResult.reason, API_ERROR_GENERATE_AI_RESPONSE) };
  }

  const response = generationResult.value;
  if (response.error) {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: response.error };
  }

  const assistantMessage = createChatMessage("assistant", response.content, sessionId);
  const persistAssistantMessageResult = await persistChatMessage(assistantMessage);
  if (persistAssistantMessageResult.status === "rejected") {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return {
      error: toErrorMessage(persistAssistantMessageResult.reason, API_ERROR_GENERATE_AI_RESPONSE),
    };
  }

  return buildChatRouteResponse(assistantMessage, response, preferredDomain);
};

const handleAnalyzeResumeRoute = async (body: AnalyzeResumeBody, set: RouteSetState) => {
  const resumeRows = await db.select().from(resumes).where(eq(resumes.id, body.resumeId));
  const resume = resumeRows[0];
  if (!resume) {
    set.status = HTTP_STATUS_NOT_FOUND;
    return { error: API_ERROR_RESUME_NOT_FOUND };
  }

  const resumeText = serializeResume(resume);
  const jobDescription = await resolveAnalyzeResumeJobDescription(body.jobId);
  const aiService = await getAIService();
  const responseResult = await settle(
    aiService.generate(buildAnalyzeResumePrompt(resumeText, jobDescription), {
      purpose: "resume",
      temperature: AI_DEFAULT_TEMPERATURE,
      maxTokens: SCHEMA_MAX_LENGTH_LONG,
    }),
  );
  if (responseResult.status === "rejected") {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: toErrorMessage(responseResult.reason, API_ERROR_ANALYZE_RESUME) };
  }

  const response = responseResult.value;
  if (response.error) {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: response.error };
  }

  return {
    message: API_MESSAGE_RESUME_ANALYSIS_COMPLETE,
    resumeId: body.resumeId,
    jobId: body.jobId || null,
    analysis: parseResumeAnalysisResult(response.content),
    provider: response.provider,
    model: response.model,
  };
};

const handleGenerateCoverLetterRoute = async (
  body: GenerateCoverLetterBody,
  set: RouteSetState,
) => {
  const resumeRows = await db.select().from(resumes).where(eq(resumes.id, body.resumeId));
  const resume = resumeRows[0];
  if (!resume) {
    set.status = HTTP_STATUS_NOT_FOUND;
    return { error: API_ERROR_RESUME_NOT_FOUND };
  }

  const resumeText = serializeResume(resume);
  const jobDescription = await resolveCoverLetterJobDescription(body.jobId);
  const aiService = await getAIService();
  const responseResult = await settle(
    aiService.generate(
      buildCoverLetterPrompt(body.company, body.position, jobDescription, resumeText),
      {
        purpose: "coverLetter",
        temperature: AI_DEFAULT_TEMPERATURE_CREATIVE,
        maxTokens: SCHEMA_MAX_LENGTH_LONG,
      },
    ),
  );
  if (responseResult.status === "rejected") {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: toErrorMessage(responseResult.reason, API_ERROR_GENERATE_COVER_LETTER) };
  }

  const response = responseResult.value;
  if (response.error) {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: response.error };
  }

  return {
    message: API_MESSAGE_COVER_LETTER_GENERATED,
    content: parseCoverLetterSections(response.content),
    provider: response.provider,
    model: response.model,
  };
};

const handleMatchJobsRoute = async (
  body: { resumeId?: string; skills?: string[] },
  set: RouteSetState,
) => {
  const flowResult = await settle(runJobMatchingFlow(body.resumeId, body.skills));
  if (flowResult.status === "rejected") {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: toErrorMessage(flowResult.reason, API_ERROR_MATCH_JOBS) };
  }
  return flowResult.value;
};

export const aiRoutes = new Elysia({ prefix: "/ai", tags: ["AI"] })
  .use(
    rateLimit({
      scoping: "scoped",
      duration: MS_PER_MINUTE,
      max: 25,
      generator: (request) => resolveRateLimitClientKey(request),
    }),
  )
  .post("/chat", async ({ body, set }) => handleChatRoute(body, set), {
    body: chatRouteBodySchema,
  })
  .post("/analyze-resume", async ({ body, set }) => handleAnalyzeResumeRoute(body, set), {
    body: analyzeResumeRouteBodySchema,
  })
  .post(
    "/generate-cover-letter",
    async ({ body, set }) => handleGenerateCoverLetterRoute(body, set),
    {
      body: generateCoverLetterRouteBodySchema,
    },
  )
  .post("/match-jobs", async ({ body, set }) => handleMatchJobsRoute(body, set), {
    body: matchJobsRouteBodySchema,
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
  .post(
    "/automation-action",
    async ({ body, set }) => {
      const { action, jobUrl, resumeId, coverLetterId, jobId } = body;

      if (action !== "job_apply") {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return { error: API_ERROR_UNSUPPORTED_AUTOMATION_ACTION.replace("__ACTION__", action) };
      }

      const runResult = await settle(
        applicationAutomationService.createJobApplyRun(
          { jobUrl, resumeId, coverLetterId, jobId },
          { includeActionInPayload: true },
        ),
      );
      if (runResult.status === "rejected") {
        const mapped = mapAutomationRouteError(runResult.reason);
        set.status = mapped.status;
        return {
          error: mapped.body.error.message,
        };
      }

      const runId = runResult.value;
      startJobApplyRun(runId, {
        jobUrl,
        resumeId,
        coverLetterId,
        jobId,
      });

      return {
        runId,
        status: "running",
        message:
          "Job application automation started. Use GET /api/automation/runs/:id to check status.",
      };
    },
    {
      body: automationActionRouteBodySchema,
    },
  );
